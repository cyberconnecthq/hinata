"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { formatSigned, sentimentLabel } from "@/lib/format";
import type { RankingItem } from "@/lib/types";

export function Arena({
  items,
  leaderId,
  onSelect,
}: {
  items: RankingItem[];
  leaderId?: string;
  onSelect: (item: RankingItem) => void;
}) {
  const top = items.slice(0, 6);
  if (top.length === 0) {
    return (
      <Tile>
        <TileHeader label="category arena" />
        <div className="py-8 text-center text-[12px] text-ink-400">
          No ranked projects in this category right now.
        </div>
      </Tile>
    );
  }
  const maxScore = Math.max(...top.map((_, i) => top.length - i));

  return (
    <Tile padded>
      <TileHeader
        label="category arena"
        description="mindshare leaders battle in the selected category"
        trailing={<span className="mono-label">top {top.length}</span>}
      />
      <div className="flex flex-col gap-3">
        {top.map((item, i) => {
          const weight = (top.length - i) / maxScore;
          const isLeader = item.project.id === leaderId || i === 0;
          return (
            <motion.button
              key={item.project.id}
              onClick={() => onSelect(item)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.02] group"
            >
              <span
                className={clsx(
                  "mono-label w-6 tnum text-right",
                  isLeader ? "text-lime" : "text-ink-400"
                )}
              >
                {i + 1}
              </span>
              <Avatar
                size={28}
                alt={item.project.name}
                src={item.token?.image || item.twitter?.avatar_url}
              />
              <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-white/[0.03] border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weight * 100}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={clsx(
                    "absolute inset-y-0 left-0",
                    isLeader
                      ? "bg-gradient-to-r from-lime to-lime/40"
                      : "bg-gradient-to-r from-ink-500/60 to-ink-600/20"
                  )}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <span
                    className={clsx(
                      "text-[12px] truncate",
                      isLeader ? "text-ink-950 font-semibold" : "text-ink-100"
                    )}
                  >
                    {item.project.name}
                  </span>
                  <span
                    className={clsx(
                      "tnum text-[11px]",
                      isLeader ? "text-ink-950 font-semibold" : "text-ink-400"
                    )}
                  >
                    #{item.rank}
                  </span>
                </div>
              </div>
              <span
                className={clsx(
                  "text-[11px] tnum w-16 text-right",
                  (item.sentiment_score || 0) >= 0.15
                    ? "text-teal"
                    : (item.sentiment_score || 0) <= -0.15
                      ? "text-rose"
                      : "text-amber"
                )}
              >
                {formatSigned(item.sentiment_score, 2)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Tile>
  );
}
