"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ExternalLink, Newspaper, Eye, Heart, Repeat2, Globe, Flame, Clock } from "lucide-react";
import { Tile } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { formatCompact, timeAgo } from "@/lib/format";
import type { AiNewsItem } from "@/app/api/mindshare/news/route";
import { NEWS_SOURCES, type NewsArticleItem, type NewsSource } from "@/lib/news";

type SortBy = "recency" | "trending";

type Tab = "pulse" | "feed";

export function NewsPanel({ query }: { query: string }) {
  const [tab, setTab] = useState<Tab>("pulse");

  const [pulses, setPulses] = useState<AiNewsItem[]>([]);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseErr, setPulseErr] = useState<string | null>(null);

  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedErr, setFeedErr] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<NewsSource>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>("recency");

  const toggleSource = (src: NewsSource) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };
  const clearSources = () => setSelectedSources(new Set());

  const sourcesQs = useMemo(
    () => (selectedSources.size > 0 ? `&sources=${Array.from(selectedSources).join(",")}` : ""),
    [selectedSources]
  );

  useEffect(() => {
    let cancelled = false;
    setPulseLoading(true);
    setPulseErr(null);
    fetch(`/api/mindshare/news?q=${encodeURIComponent(query)}&limit=8`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.data)) setPulses(res.data);
        if (res.error) setPulseErr(res.error.message);
      })
      .finally(() => !cancelled && setPulseLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    setFeedErr(null);
    const url = `/api/mindshare/news-feed?project=${encodeURIComponent(query)}&limit=25&sort_by=${sortBy}${sourcesQs}`;
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.data)) setArticles(res.data);
        if (res.error) setFeedErr(res.error.message);
      })
      .finally(() => !cancelled && setFeedLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, sortBy, sourcesQs]);

  return (
    <Tile padded className="h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <span className="mono-label">news &amp; narratives</span>
          <span className="text-[12px] text-ink-300">
            what&apos;s moving the story for &quot;{query}&quot;
          </span>
        </div>
        <div className="inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/[0.02] p-0.5 shrink-0">
          <TabButton active={tab === "pulse"} onClick={() => setTab("pulse")}>
            AI Pulse
          </TabButton>
          <TabButton active={tab === "feed"} onClick={() => setTab("feed")}>
            News Feed
            {articles.length > 0 && (
              <span className="ml-1.5 mono-label tnum opacity-70">{articles.length}</span>
            )}
          </TabButton>
        </div>
      </div>

      {tab === "pulse" ? (
        <PulseView items={pulses} loading={pulseLoading} errMsg={pulseErr} />
      ) : (
        <FeedView
          items={articles}
          loading={feedLoading}
          errMsg={feedErr}
          selectedSources={selectedSources}
          toggleSource={toggleSource}
          clearSources={clearSources}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}
    </Tile>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-3 py-1 text-[11px] font-medium rounded-full transition-colors inline-flex items-center",
        active ? "bg-lime text-ink-950" : "text-ink-300 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function PulseView({
  items,
  loading,
  errMsg,
}: {
  items: AiNewsItem[];
  loading: boolean;
  errMsg: string | null;
}) {
  if (loading && items.length === 0) {
    return <div className="mono-label text-center py-8 animate-pulse-soft">synthesizing news pulses…</div>;
  }
  if (errMsg && items.length === 0) {
    return <div className="text-[12px] text-ink-400 text-center py-8">{errMsg}</div>;
  }
  if (items.length === 0) {
    return <div className="text-[12px] text-ink-400 text-center py-8">No AI-synthesized pulses yet.</div>;
  }
  return (
    <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
      {items.map((n, i) => {
        const author = n.twitter_author;
        const st = n.source_tweet;
        const sourceCount = Array.isArray(n.sources) ? n.sources.length : 0;
        return (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03 }}
            className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {n.signal_type === "twitter" && author ? (
                  <Avatar size={28} alt={author.display_name} src={author.avatar_url} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center">
                    <Newspaper className="w-3.5 h-3.5 text-lime" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[11px] text-ink-300">
                    {n.signal_type === "twitter" && author ? `@${author.handle}` : n.signal_type}
                  </span>
                  <span className="mono-label tnum">
                    {timeAgo(n.timestamp)} · {sourceCount} source{sourceCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {st?.tweet_id && author ? (
                <a
                  href={`https://x.com/${author.handle}/status/${st.tweet_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-400 hover:text-lime shrink-0"
                  title="open on x.com"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
            <div className="text-[13px] text-ink-50 font-medium leading-snug mb-1">{n.title}</div>
            {n.subtitle && <div className="text-[12px] text-ink-300 leading-snug mb-2">{n.subtitle}</div>}
            {Array.isArray(n.tldr) && n.tldr.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {n.tldr.slice(0, 4).map((t, j) => (
                  <li key={j} className="flex items-start gap-2 text-[11px] text-ink-200 leading-snug">
                    <span className="text-lime mt-1.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
            {st && (
              <div className="mt-3 flex items-center gap-4 text-[10px] text-ink-400 tnum">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatCompact(st.views)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {formatCompact(st.likes)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="w-3 h-3" />
                  {formatCompact(st.repost)}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function FeedView({
  items,
  loading,
  errMsg,
  selectedSources,
  toggleSource,
  clearSources,
  sortBy,
  setSortBy,
}: {
  items: NewsArticleItem[];
  loading: boolean;
  errMsg: string | null;
  selectedSources: Set<NewsSource>;
  toggleSource: (s: NewsSource) => void;
  clearSources: () => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
}) {
  return (
    <>
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="mono-label">
            {selectedSources.size === 0
              ? "all 17 sources"
              : `${selectedSources.size} source${selectedSources.size > 1 ? "s" : ""}`}
            {selectedSources.size > 0 && (
              <button
                onClick={clearSources}
                className="ml-2 underline decoration-dotted hover:text-lime"
              >
                clear
              </button>
            )}
          </div>
          <div className="inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/[0.02] p-0.5 shrink-0">
            <SortButton active={sortBy === "recency"} onClick={() => setSortBy("recency")}>
              <Clock className="w-3 h-3 mr-1" /> Recency
            </SortButton>
            <SortButton active={sortBy === "trending"} onClick={() => setSortBy("trending")}>
              <Flame className="w-3 h-3 mr-1" /> Trending
            </SortButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 -mx-1 px-1">
          {NEWS_SOURCES.map((s) => {
            const on = selectedSources.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSource(s)}
                className={clsx(
                  "px-2 py-0.5 rounded-full text-[10px] border transition-colors tnum",
                  on
                    ? "bg-lime text-ink-950 border-lime"
                    : "bg-white/[0.02] text-ink-300 border-white/10 hover:border-white/20"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="mono-label text-center py-8 animate-pulse-soft">loading news feed…</div>
      ) : errMsg && items.length === 0 ? (
        <div className="text-[12px] text-ink-400 text-center py-8">{errMsg}</div>
      ) : items.length === 0 ? (
        <div className="text-[12px] text-ink-400 text-center py-8">
          No articles matching these filters.
        </div>
      ) : (
        <div className={clsx("flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1", loading && "opacity-60")}>
          {items.map((a, i) => (
            <motion.a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 14) * 0.02 }}
              className="group p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="mono-label shrink-0 text-lime/80">
                    {a.source?.toLowerCase() || "source"}
                  </span>
                  <span className="mono-label shrink-0">·</span>
                  <span className="mono-label tnum shrink-0">{timeAgo(a.published_at)}</span>
                </div>
                <Globe className="w-3.5 h-3.5 text-ink-400 shrink-0 group-hover:text-lime transition-colors" />
              </div>
              <div className="text-[13px] text-ink-50 leading-snug line-clamp-2">{a.title}</div>
              {a.summary && (
                <div className="mt-1 text-[11px] text-ink-400 leading-snug line-clamp-2">{a.summary}</div>
              )}
            </motion.a>
          ))}
        </div>
      )}
    </>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium rounded-full transition-colors",
        active ? "bg-lime text-ink-950" : "text-ink-300 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
