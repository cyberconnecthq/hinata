// Dual-mode Surf client:
//   1. If SURF_API_KEY is set → direct HTTP to https://api.asksurf.ai/gateway/v1
//      (works on Vercel / any serverless runtime).
//   2. Else if surf CLI binary is available → spawn it (reads key from local
//      keychain). Zero-config local dev.
//
// Same interface as before: surf<T>(command, args, opts) → SurfEnvelope<T>.

import { spawn } from "node:child_process";

const BASE_URL = process.env.SURF_API_BASE_URL || "https://api.asksurf.ai/gateway/v1";
const SURF_BIN = process.env.SURF_BIN || "surf";
const DEFAULT_TIMEOUT_MS = 30_000;
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

type SurfCache = {
  value: unknown;
  expiresAt: number;
};

const cache = new Map<string, SurfCache>();
const inflight = new Map<string, Promise<unknown>>();

let activeCalls = 0;
const MAX_CONCURRENCY = 8;
const waitQueue: Array<() => void> = [];

async function acquire() {
  if (activeCalls < MAX_CONCURRENCY) {
    activeCalls += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeCalls += 1;
}

function release() {
  activeCalls -= 1;
  const next = waitQueue.shift();
  if (next) next();
}

export interface SurfOptions {
  ttlSeconds?: number;
  timeoutMs?: number;
}

export interface SurfEnvelope<T> {
  data: T;
  meta?: {
    cached?: boolean;
    credits_used?: number;
    total?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
    next_cursor?: string;
    empty_reason?: string;
  };
  error?: { code: string; message: string };
  [extra: string]: unknown;
}

// "social-ranking" → "/social/ranking" (first dash becomes a slash)
function commandToPath(command: string): string {
  const dash = command.indexOf("-");
  if (dash < 0) return `/${command}`;
  return `/${command.slice(0, dash)}/${command.slice(dash + 1)}`;
}

// CLI flags are kebab-case; HTTP query params are snake_case.
function flagToParam(flag: string): string {
  return flag.replace(/-/g, "_");
}

export async function surf<T>(
  command: string,
  args: Record<string, string | number | boolean | undefined> = {},
  opts: SurfOptions = {}
): Promise<SurfEnvelope<T>> {
  const cacheKey = JSON.stringify([command, args]);
  const ttlSeconds = opts.ttlSeconds ?? 60;

  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value as SurfEnvelope<T>;
  }

  const running = inflight.get(cacheKey);
  if (running) return running as Promise<SurfEnvelope<T>>;

  const promise = (async () => {
    await acquire();
    try {
      const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      let result: SurfEnvelope<T>;
      if (process.env.SURF_API_KEY) {
        result = await httpCall<T>(command, args, timeoutMs);
      } else if (!IS_SERVERLESS) {
        result = await spawnCall<T>(command, args, timeoutMs);
      } else {
        result = {
          data: undefined as unknown as T,
          error: {
            code: "MISSING_API_KEY",
            message:
              "SURF_API_KEY env var required on Vercel. Get one at https://agents.asksurf.ai.",
          },
        };
      }
      if (!result.error) {
        cache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
      return result;
    } finally {
      release();
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

async function httpCall<T>(
  command: string,
  args: Record<string, string | number | boolean | undefined>,
  timeoutMs: number
): Promise<SurfEnvelope<T>> {
  const path = commandToPath(command);
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(flagToParam(key), String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SURF_API_KEY}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let parsed: SurfEnvelope<T>;
    try {
      parsed = JSON.parse(text) as SurfEnvelope<T>;
    } catch {
      return {
        data: undefined as unknown as T,
        error: {
          code: "PARSE_ERROR",
          message: `Non-JSON response from ${path} (HTTP ${res.status}): ${text.slice(0, 200)}`,
        },
      };
    }
    if (!res.ok && !parsed.error) {
      parsed.error = {
        code: `HTTP_${res.status}`,
        message: `Surf API returned HTTP ${res.status} for ${path}`,
      };
    }
    return parsed;
  } catch (err) {
    const e = err as Error;
    const code = e.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
    return {
      data: undefined as unknown as T,
      error: { code, message: e.message || String(err) },
    };
  } finally {
    clearTimeout(timer);
  }
}

function spawnCall<T>(
  command: string,
  args: Record<string, string | number | boolean | undefined>,
  timeoutMs: number
): Promise<SurfEnvelope<T>> {
  const argv: string[] = [command, "--json"];
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) argv.push(`--${key}`);
      continue;
    }
    argv.push(`--${key}`, String(value));
  }
  return new Promise((resolve) => {
    const child = spawn(SURF_BIN, argv, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.stderr.on("data", (c) => (stderr += c.toString()));
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout || "{}") as SurfEnvelope<T>);
      } catch (err) {
        resolve({
          data: undefined as unknown as T,
          error: {
            code: "PARSE_ERROR",
            message: `Failed to parse surf output: ${stderr || (err as Error).message}`,
          },
        });
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        data: undefined as unknown as T,
        error: { code: "SPAWN_ERROR", message: err.message },
      });
    });
  });
}
