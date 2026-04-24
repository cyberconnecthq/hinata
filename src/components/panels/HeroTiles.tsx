"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Users, Flame } from "lucide-react";
import { Tile } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { formatCompact, formatSigned, sentimentLabel } from "@/lib/format";
import type { RankingItem, TimeRange } from "@/lib/types";

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tile accent={accent} className="h-full">
        <div className="flex items-start justify-between mb-6">
          <span className="mono-label">{label}</span>
          <span className="text-ink-400">{icon}</span>
        </div>
        <div className="display text-[44px] leading-none mb-2 tnum">{value}</div>
        <div className="text-[12px] text-ink-300">{sub}</div>
      </Tile>
    </motion.div>
  );
}

export function HeroTiles({
  ranking,
  timeRange,
}: {
  ranking: RankingItem[];
  timeRange: TimeRange;
}) {
  const tracked = ranking.length;
  const top = ranking[0];
  const withSent = ranking.filter((r) => typeof r.sentiment_score === "number");
  const avgSentiment =
    withSent.length > 0
      ? withSent.reduce((s, r) => s + (r.sentiment_score || 0), 0) / withSent.length
      : 0;
  const bullish = ranking.filter((r) => (r.sentiment_score || 0) >= 0.15).length;
  const bullishPct = tracked ? (bullish / tracked) * 100 : 0;

  const withTwitter = ranking.find((r) => r.twitter?.avatar_url);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      <Stat
        accent
        delay={0.05}
        icon={<Flame className="w-4 h-4" />}
        label="top by mindshare"
        value={
          <span>
            <span>{tracked}</span>
            <span className="text-ink-400 text-[18px] ml-2 tnum">/ 5k+</span>
          </span>
        }
        sub={
          <>
            showing the top <span className="text-ink-100 font-medium">{tracked}</span> of ~5k
            crypto projects indexed by Surf over the last{" "}
            <span className="text-ink-100 font-medium">{timeRange}</span>
          </>
        }
      />
      <Stat
        delay={0.1}
        icon={<TrendingUp className="w-4 h-4" />}
        label="top mindshare"
        value={
          <div className="flex items-center gap-3">
            {top?.token?.image || top?.twitter?.avatar_url ? (
              <Avatar
                size={40}
                alt={top?.project.name || ""}
                src={top?.token?.image || top?.twitter?.avatar_url}
              />
            ) : null}
            <span className="truncate max-w-[8ch]">{top?.project.name || "—"}</span>
          </div>
        }
        sub={
          top ? (
            <>
              <span className="text-lime">#1</span> · {sentimentLabel(top.sentiment_score)} ·{" "}
              <span className="tnum">{formatSigned(top.sentiment_score)}</span>
            </>
          ) : (
            "no data"
          )
        }
      />
      <Stat
        delay={0.15}
        icon={<Sparkles className="w-4 h-4" />}
        label="aggregate sentiment"
        value={
          <span
            className={
              avgSentiment >= 0.15
                ? "text-teal"
                : avgSentiment <= -0.15
                  ? "text-rose"
                  : "text-amber"
            }
          >
            {formatSigned(avgSentiment, 2)}
          </span>
        }
        sub={
          <>
            {sentimentLabel(avgSentiment)} · average across {withSent.length} scored projects
          </>
        }
      />
      <Stat
        delay={0.2}
        icon={<Users className="w-4 h-4" />}
        label="bullish share"
        value={<span>{bullishPct.toFixed(0)}%</span>}
        sub={
          <>
            <span className="tnum">{bullish}</span> of {tracked} projects scoring above +0.15
            {withTwitter?.twitter ? (
              <>
                {" · led by "}
                <span className="text-ink-100 font-medium">@{withTwitter.twitter.x_handle}</span>
              </>
            ) : null}
          </>
        }
      />
    </div>
  );
}
