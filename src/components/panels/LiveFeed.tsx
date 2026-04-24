"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Eye } from "lucide-react";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { formatCompact, timeAgo } from "@/lib/format";
import type { SocialPost } from "@/lib/types";

export function LiveFeed({ query }: { query: string }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Keep stale posts visible while new ones load.
    fetch(`/api/mindshare/posts?q=${encodeURIComponent(query)}&limit=30`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.data)) setPosts(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <Tile padded className="h-full">
      <TileHeader
        label="live posts"
        description={`latest chatter around "${query}" on x.com`}
        trailing={
          loading ? (
            <span className="mono-label animate-pulse-soft">loading</span>
          ) : (
            <span className="mono-label flex items-center gap-1.5">
              <span className="dot-indicator" />
              streaming
            </span>
          )
        }
      />
      <div className="max-h-[520px] overflow-y-auto flex flex-col gap-2 pr-1">
        <AnimatePresence initial={false}>
          {posts.map((p, i) => (
            <motion.a
              key={p.tweet_id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.02 }}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
            >
              <Avatar size={36} alt={p.author.name} src={p.author.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="min-w-0 leading-tight">
                    <span className="text-[13px] text-ink-50 truncate">{p.author.name}</span>
                    <span className="mono-label ml-2 tnum">@{p.author.handle}</span>
                  </div>
                  <span className="mono-label shrink-0 tnum">{timeAgo(p.created_at)}</span>
                </div>
                <p className="text-[13px] text-ink-200 line-clamp-3 break-words leading-snug">
                  {p.text}
                </p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-400 tnum">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {formatCompact(p.stats.likes)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Repeat2 className="w-3 h-3" />
                    {formatCompact(p.stats.reposts)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatCompact(p.stats.replies)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatCompact(p.stats.views)}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
        {!loading && posts.length === 0 && (
          <div className="text-center text-[12px] text-ink-400 py-6">
            No posts found for this query.
          </div>
        )}
      </div>
    </Tile>
  );
}
