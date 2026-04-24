import { NextRequest, NextResponse } from "next/server";
import { surf } from "@/lib/surf";
import { NEWS_SOURCES, type NewsArticleItem, type NewsSource } from "@/lib/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project");
  const sortBy = (searchParams.get("sort_by") || "recency") as "recency" | "trending";
  const limit = Number(searchParams.get("limit") || 20);
  const sourcesParam = searchParams.get("sources") || searchParams.get("source");

  if (!project) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "project required" } }, { status: 400 });
  }

  const sources = sourcesParam
    ? sourcesParam
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is NewsSource => (NEWS_SOURCES as readonly string[]).includes(s))
    : [];

  // No source filter OR single source → one surf call.
  if (sources.length <= 1) {
    const result = await surf<NewsArticleItem[]>(
      "news-feed",
      {
        project,
        source: sources[0],
        "sort-by": sortBy,
        limit,
      },
      { ttlSeconds: 180 }
    );
    if (result.error) {
      const status = result.error.code === "NOT_FOUND" ? 200 : 502;
      return NextResponse.json({ error: result.error, data: [] }, { status });
    }
    return NextResponse.json(result);
  }

  // Multi-source: fan out in parallel, merge, dedupe, resort.
  const perSourceLimit = Math.max(5, Math.ceil(limit / sources.length) * 2);
  const calls = await Promise.all(
    sources.map((src) =>
      surf<NewsArticleItem[]>(
        "news-feed",
        { project, source: src, "sort-by": sortBy, limit: perSourceLimit },
        { ttlSeconds: 180 }
      )
    )
  );
  const merged: NewsArticleItem[] = [];
  const seen = new Set<string>();
  for (const r of calls) {
    if (r.error || !Array.isArray(r.data)) continue;
    for (const a of r.data) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      merged.push(a);
    }
  }
  merged.sort((a, b) =>
    sortBy === "recency" ? b.published_at - a.published_at : 0
  );
  return NextResponse.json({
    data: merged.slice(0, limit),
    meta: {
      sources: sources.length,
      sampled: merged.length,
    },
  });
}
