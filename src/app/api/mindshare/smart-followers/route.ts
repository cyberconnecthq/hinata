import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { SmartFollowerHistoryPoint } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const xId = searchParams.get("x_id");

  if (!q && !xId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q or x_id required" } }, { status: 400 });
  }

  const result = await surf<SmartFollowerHistoryPoint[]>(
    "social-smart-followers-history",
    {
      q: q || undefined,
      "x-id": xId || undefined,
      limit: 60,
    },
    { ttlSeconds: 1800 }
  );

  if (result.error) {
    const status = result.error.code === "NOT_FOUND" ? 200 : 502;
    return NextResponse.json({ error: result.error, data: [] }, { status });
  }
  return NextResponse.json(result);
}
