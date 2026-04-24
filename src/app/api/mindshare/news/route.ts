import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface AiNewsItem {
  id: string;
  signal_type: string;
  slug?: string;
  title: string;
  subtitle?: string;
  tldr?: string[];
  sources?: string[];
  timestamp: number;
  twitter_author?: {
    handle: string;
    display_name: string;
    avatar_url?: string;
    follower_count?: number;
  };
  source_tweet?: {
    tweet_id: string;
    text: string;
    likes: number;
    repost: number;
    comment: number;
    views: number;
    post_at: number;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const id = searchParams.get("id");
  const lang = searchParams.get("lang") || "en";
  const limit = Number(searchParams.get("limit") || 10);

  if (!q && !id) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q or id required" } }, { status: 400 });
  }

  const result = await surf<AiNewsItem[]>(
    "project-ai-news",
    {
      q: q || undefined,
      id: id || undefined,
      lang,
      limit,
    },
    { ttlSeconds: 300 }
  );

  if (result.error) {
    const status = result.error.code === "NOT_FOUND" ? 200 : 502;
    return NextResponse.json({ error: result.error, data: [] }, { status });
  }
  return NextResponse.json(result);
}
