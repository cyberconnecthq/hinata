"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { formatCompact } from "@/lib/format";
import type { SocialDetail } from "@/lib/types";

type Follower = SocialDetail["smart_followers"]["followers"][number];

export function SmartFollowersPanel({ query }: { query: string }) {
  const [detail, setDetail] = useState<SocialDetail | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [tag, setTag] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;
    setErrMsg(null);
    // keep stale detail visible until new arrives
    fetch(`/api/mindshare/detail?q=${encodeURIComponent(query)}&time_range=7d`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setErrMsg(res.error.message);
          if (!res.data) setDetail(null);
          return;
        }
        setDetail(res.data);
      })
      .catch((err) => setErrMsg(err.message));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const followers = detail?.smart_followers?.followers || [];
  const tags = useMemo(() => {
    const set = new Set<string>();
    followers.forEach((f) => set.add(f.tag));
    return ["All", ...Array.from(set)];
  }, [followers]);

  const filtered: Follower[] = followers.filter((f) => tag === "All" || f.tag === tag).slice(0, 24);

  return (
    <Tile padded className="h-full">
      <TileHeader
        label="smart followers"
        description={`VCs, KOLs, and builders tracking "${query}"`}
        trailing={
          detail ? (
            <span className="mono-label tnum">
              {formatCompact(detail.smart_followers.count)} total
            </span>
          ) : null
        }
      />
      {errMsg ? (
        <div className="text-[12px] text-ink-400">{errMsg}</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((t) => (
              <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.map((f, i) => (
              <motion.a
                key={f.handle}
                href={`https://x.com/${f.handle}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 20) * 0.02 }}
                className="flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              >
                <Avatar size={32} alt={f.name} src={f.avatar} />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-[12px] text-ink-100 truncate">{f.name}</span>
                  <span className="mono-label truncate">
                    {f.tag} · {formatCompact(f.followers_count)}
                  </span>
                </div>
              </motion.a>
            ))}
            {detail && filtered.length === 0 && (
              <div className="col-span-full text-[12px] text-ink-400 text-center py-6">
                No smart followers in this group.
              </div>
            )}
          </div>
        </>
      )}
    </Tile>
  );
}
