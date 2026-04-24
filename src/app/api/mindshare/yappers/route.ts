import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import type { SocialPost } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface Yapper {
  author: SocialPost["author"];
  posts: number;
  views: number;
  likes: number;
  reposts: number;
  replies: number;
  engagement: number;
  share: number;
  top_post?: {
    tweet_id: string;
    url: string;
    text: string;
    views: number;
    created_at: number;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const limit = Number(searchParams.get("limit") || 30);
  const sampleSize = Number(searchParams.get("sample") || 100);

  if (!q) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "q required" } }, { status: 400 });
  }

  const result = await surf<SocialPost[]>(
    "search-social-posts",
    { q, limit: sampleSize },
    { ttlSeconds: 240 }
  );

  if (result.error) {
    return NextResponse.json({ error: result.error, data: [] }, { status: 502 });
  }

  const posts = result.data || [];

  const byAuthor = new Map<string, Yapper>();
  for (const p of posts) {
    const key = p.author.user_id;
    const cur = byAuthor.get(key) || {
      author: p.author,
      posts: 0,
      views: 0,
      likes: 0,
      reposts: 0,
      replies: 0,
      engagement: 0,
      share: 0,
    };
    cur.posts += 1;
    cur.views += p.stats.views || 0;
    cur.likes += p.stats.likes || 0;
    cur.reposts += p.stats.reposts || 0;
    cur.replies += p.stats.replies || 0;
    cur.engagement = cur.likes + cur.reposts + cur.replies;
    // Track top post by views for this author
    if (!cur.top_post || (p.stats.views || 0) > cur.top_post.views) {
      cur.top_post = {
        tweet_id: p.tweet_id,
        url: p.url,
        text: p.text,
        views: p.stats.views || 0,
        created_at: p.created_at,
      };
    }
    byAuthor.set(key, cur);
  }

  const allYappers = Array.from(byAuthor.values());
  const totalViews = allYappers.reduce((s, y) => s + y.views, 0);
  const yappers = allYappers
    .map((y) => ({ ...y, share: totalViews ? y.views / totalViews : 0 }))
    .sort((a, b) => b.views - a.views || b.engagement - a.engagement)
    .slice(0, limit);

  return NextResponse.json({
    data: yappers,
    meta: {
      sample_posts: posts.length,
      unique_authors: byAuthor.size,
      total_views: totalViews,
    },
  });
}
