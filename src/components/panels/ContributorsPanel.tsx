"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Heart, Repeat2, Eye } from "lucide-react";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { formatCompact, timeAgo } from "@/lib/format";
import type { SocialDetail } from "@/lib/types";
import type { Yapper } from "@/app/api/mindshare/yappers/route";

type Tab = "yappers" | "smart";

export function ContributorsPanel({ query }: { query: string }) {
  const [tab, setTab] = useState<Tab>("yappers");

  // Yappers state
  const [yappers, setYappers] = useState<Yapper[]>([]);
  const [yappersMeta, setYappersMeta] = useState<{ sample_posts?: number; unique_authors?: number } | null>(
    null
  );
  const [yappersLoading, setYappersLoading] = useState(false);

  // Smart followers state
  const [detail, setDetail] = useState<SocialDetail | null>(null);
  const [smartTag, setSmartTag] = useState<string>("All");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setYappersLoading(true);
    fetch(`/api/mindshare/yappers?q=${encodeURIComponent(query)}&limit=24`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.data)) {
          setYappers(res.data);
          setYappersMeta(res.meta || null);
        }
      })
      .finally(() => !cancelled && setYappersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setErrMsg(null);
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
  const filteredFollowers = followers.filter((f) => smartTag === "All" || f.tag === smartTag);

  return (
    <Tile padded className="h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <span className="mono-label">mindshare contributors</span>
          <span className="text-[12px] text-ink-300">
            who&apos;s driving attention around &quot;{query}&quot;
          </span>
        </div>
        <div className="inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/[0.02] p-0.5 shrink-0">
          <TabButton active={tab === "yappers"} onClick={() => setTab("yappers")}>
            Yappers
          </TabButton>
          <TabButton active={tab === "smart"} onClick={() => setTab("smart")}>
            Smart Followers
          </TabButton>
        </div>
      </div>

      {tab === "yappers" ? (
        <YappersView
          yappers={yappers}
          meta={yappersMeta}
          loading={yappersLoading && yappers.length === 0}
        />
      ) : (
        <SmartFollowersView
          followers={filteredFollowers}
          total={detail?.smart_followers?.count}
          tags={tags}
          selectedTag={smartTag}
          onTag={setSmartTag}
          errMsg={errMsg}
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
        "px-3 py-1 text-[11px] font-medium rounded-full transition-colors",
        active ? "bg-lime text-ink-950" : "text-ink-300 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function YappersView({
  yappers,
  meta,
  loading,
}: {
  yappers: Yapper[];
  meta: { sample_posts?: number; unique_authors?: number } | null;
  loading: boolean;
}) {
  if (loading) {
    return <div className="mono-label text-center py-10 animate-pulse-soft">building yapper leaderboard…</div>;
  }
  if (yappers.length === 0) {
    return (
      <div className="text-[12px] text-ink-400 text-center py-10">
        No recent posts found to rank contributors.
      </div>
    );
  }
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="mono-label">
          top {yappers.length} · ranked by views contributed
        </span>
        {meta && (
          <span className="mono-label tnum">
            {meta.sample_posts} posts · {meta.unique_authors} authors
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
        {yappers.map((y, i) => (
          <motion.a
            key={y.author.user_id}
            href={`https://x.com/${y.author.handle}`}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.02 }}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
            title={y.top_post?.text || ""}
          >
            <span
              className={clsx(
                "mono-label w-5 text-right tnum",
                i < 3 ? "text-lime" : "text-ink-400"
              )}
            >
              {i + 1}
            </span>
            <Avatar size={32} alt={y.author.name} src={y.author.avatar} />
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-[13px] text-ink-50 truncate">{y.author.name}</span>
              <span className="mono-label truncate">
                @{y.author.handle} · {y.posts} post{y.posts > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col items-end leading-tight shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-[13px] text-ink-50 tnum">
                  {(y.share * 100).toFixed(1)}%
                </span>
              </div>
              <span className="mono-label tnum inline-flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatCompact(y.views)}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-ink-400 tnum shrink-0 w-24 justify-end">
              <span className="inline-flex items-center gap-0.5">
                <Heart className="w-3 h-3" />
                {formatCompact(y.likes)}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Repeat2 className="w-3 h-3" />
                {formatCompact(y.reposts)}
              </span>
              {y.top_post && (
                <span className="mono-label tnum hidden md:inline">
                  {timeAgo(y.top_post.created_at)}
                </span>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </>
  );
}

function SmartFollowersView({
  followers,
  total,
  tags,
  selectedTag,
  onTag,
  errMsg,
}: {
  followers: SocialDetail["smart_followers"]["followers"];
  total?: number;
  tags: string[];
  selectedTag: string;
  onTag: (t: string) => void;
  errMsg: string | null;
}) {
  if (errMsg && followers.length === 0) {
    return <div className="text-[12px] text-ink-400 py-10 text-center">{errMsg}</div>;
  }
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Chip key={t} active={selectedTag === t} onClick={() => onTag(t)}>
              {t}
            </Chip>
          ))}
        </div>
        {total != null && (
          <span className="mono-label tnum shrink-0">
            {formatCompact(total)} total
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {followers.slice(0, 24).map((f, i) => (
          <motion.a
            key={f.handle}
            href={`https://x.com/${f.handle}`}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 4 }}
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
      </div>
    </>
  );
}
