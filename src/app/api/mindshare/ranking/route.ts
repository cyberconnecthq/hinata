import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { RankingItem } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag") || undefined;
  const timeRange = searchParams.get("time_range") || "7d";
  const sentiment = searchParams.get("sentiment") || undefined;
  const limit = Number(searchParams.get("limit") || 30);

  const result = await surf<RankingItem[]>(
    "social-ranking",
    {
      "time-range": timeRange,
      limit,
      tag: tag === "all" ? undefined : tag,
      sentiment,
    },
    { ttlSeconds: 300 }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error, data: [] }, { status: 502 });
  }
  return NextResponse.json(result);
}
