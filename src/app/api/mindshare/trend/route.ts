import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { MindsharePoint, TagSeries } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TrendResponse {
  data: MindsharePoint[];
  tag_percents?: TagSeries[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const interval = searchParams.get("interval") || "1d";
  const days = Number(searchParams.get("days") || 30);
  const includeTags = searchParams.get("include_tags") === "1";

  if (!q) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q required" } }, { status: 400 });
  }

  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;

  const result = await surf<MindsharePoint[]>(
    "social-mindshare",
    {
      q,
      interval,
      from,
      to,
      "include-tag-percents": includeTags,
    },
    { ttlSeconds: 600 }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error, data: [] }, { status: 502 });
  }
  const body: TrendResponse = {
    data: result.data || [],
    tag_percents: (result as unknown as { tag_percents?: TagSeries[] }).tag_percents,
  };
  return NextResponse.json(body);
}
