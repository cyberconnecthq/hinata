import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { SocialDetail } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const xId = searchParams.get("x_id");
  const timeRange = searchParams.get("time_range") || "7d";

  if (!q && !xId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q or x_id required" } }, { status: 400 });
  }

  const result = await surf<SocialDetail>(
    "social-detail",
    {
      q: q || undefined,
      "x-id": xId || undefined,
      "time-range": timeRange,
      "geo-limit": 12,
    },
    { ttlSeconds: 600 }
  );

  if (result.error) {
    // NOT_FOUND is a normal "no linked twitter" case — don't throw 502.
    const status = result.error.code === "NOT_FOUND" ? 200 : 502;
    return NextResponse.json({ error: result.error, data: null }, { status });
  }
  return NextResponse.json(result);
}
