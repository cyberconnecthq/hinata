"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { SentimentBar } from "@/components/ui/SentimentBar";
import { formatSigned, sentimentLabel } from "@/lib/format";
import { chipLabel, tagToChip, type CategoryId, type RankingItem } from "@/lib/types";

export function Leaderboard({
  items,
  selectedId,
  onSelect,
  loading,
  onCategory,
}: {
  items: RankingItem[];
  selectedId?: string;
  onSelect: (item: RankingItem) => void;
  loading?: boolean;
  onCategory?: (c: CategoryId) => void;
}) {
  return (
    <Tile className={clsx("h-full transition-opacity", loading && "opacity-60")} padded={false}>
      <div className="p-5 md:p-6 pb-3">
        <TileHeader
          label="mindshare leaderboard"
          description="crypto projects ranked by social view count · click a row to spotlight"
          trailing={
            loading ? (
              <span className="mono-label animate-pulse-soft">loading</span>
            ) : (
              <span className="mono-label">{items.length} projects</span>
            )
          }
        />
      </div>

      <div className="grid grid-cols-[36px_1fr_auto_110px_140px] md:grid-cols-[48px_1fr_auto_140px_220px] gap-4 px-5 md:px-6 pb-2 mono-label">
        <span>#</span>
        <span>project</span>
        <span>tags</span>
        <span>sentiment</span>
        <span className="text-right">score</span>
      </div>

      <div className="hairline mx-5 md:mx-6" />

      <div className="max-h-[640px] overflow-y-auto">
        {items.map((item, i) => {
          const selected = selectedId === item.project.id;
          const rawTags = item.tags || [];
          // Map each surf tag to a chip id; dedupe; unknowns fall back to raw label.
          const seen = new Set<string>();
          const tags: { key: string; label: string; chip: CategoryId | null; raw: string }[] = [];
          for (const raw of rawTags) {
            const chip = tagToChip(raw);
            const key = chip ?? raw;
            if (seen.has(key)) continue;
            seen.add(key);
            tags.push({
              key,
              label: chip ? chipLabel(chip) : raw,
              chip,
              raw,
            });
          }
          const tagsShown = tags.slice(0, 3);
          const sentScore = item.sentiment_score;
          return (
            <motion.button
              key={item.project.id}
              type="button"
              onClick={() => onSelect(item)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 20) * 0.015 }}
              className={clsx(
                "w-full text-left grid grid-cols-[36px_1fr_auto_110px_140px] md:grid-cols-[48px_1fr_auto_140px_220px] gap-4 items-center px-5 md:px-6 py-3 transition-colors border-l-2",
                selected
                  ? "bg-lime/[0.04] border-lime"
                  : "border-transparent hover:bg-white/[0.02]"
              )}
            >
              <span className={clsx("tnum text-sm", selected ? "text-lime" : "text-ink-400")}>
                {String(item.rank).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  size={32}
                  alt={item.project.name}
                  src={item.token?.image || item.twitter?.avatar_url}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] text-ink-50 truncate">{item.project.name}</span>
                  <span className="mono-label truncate">
                    {item.token?.symbol || (item.twitter ? `@${item.twitter.x_handle}` : "—")}
                  </span>
                </div>
              </div>
              <div className="hidden md:flex flex-wrap gap-1 justify-end max-w-[220px]">
                {tagsShown.map((t) => {
                  const clickable = !!t.chip && !!onCategory;
                  return (
                    <span
                      key={t.key}
                      title={t.raw}
                      onClick={
                        clickable
                          ? (e) => {
                              e.stopPropagation();
                              onCategory!(t.chip as CategoryId);
                            }
                          : undefined
                      }
                      className={clsx(
                        "px-2 py-0.5 rounded-full border text-[10px] transition-colors",
                        t.chip
                          ? "border-lime/25 bg-lime/[0.05] text-lime/90"
                          : "border-white/10 text-ink-300",
                        clickable && "cursor-pointer hover:bg-lime/10 hover:border-lime/50"
                      )}
                    >
                      {t.label}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <SentimentBar score={sentScore ?? 0} width={72} />
                <span
                  className={clsx(
                    "hidden md:inline text-[11px]",
                    sentScore !== undefined && sentScore >= 0.15
                      ? "text-teal"
                      : sentScore !== undefined && sentScore <= -0.15
                        ? "text-rose"
                        : "text-amber"
                  )}
                >
                  {sentimentLabel(sentScore)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="tnum text-[14px] text-ink-50">
                  {formatSigned(sentScore, 2)}
                </span>
                <div className="hidden md:flex items-center justify-center w-7 h-7 rounded-full border border-white/10 text-ink-300 text-[10px]">
                  →
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </Tile>
  );
}
