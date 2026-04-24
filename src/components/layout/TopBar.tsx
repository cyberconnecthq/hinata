"use client";

import clsx from "clsx";
import { Chip } from "@/components/ui/Chip";
import { SurfWordmark } from "@/components/ui/SurfLogo";
import { ProjectSearch } from "@/components/layout/ProjectSearch";
import {
  CATEGORY_TAGS,
  TGE_MODES,
  TIME_RANGES,
  type CategoryId,
  type RankingItem,
  type TgeMode,
  type TimeRange,
} from "@/lib/types";

export function TopBar({
  timeRange,
  onTimeRange,
  category,
  onCategory,
  tgeMode,
  onTgeMode,
  onSearchPick,
  lastUpdated,
  loading,
}: {
  timeRange: TimeRange;
  onTimeRange: (t: TimeRange) => void;
  category: CategoryId;
  onCategory: (c: CategoryId) => void;
  tgeMode: TgeMode;
  onTgeMode: (m: TgeMode) => void;
  onSearchPick: (proj: RankingItem) => void;
  lastUpdated?: Date;
  loading?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-ink-950/70 backdrop-blur-xl border-b border-white/5">
      {loading && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
          <div className="progress-sweep" />
        </div>
      )}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://asksurf.ai"
                target="_blank"
                rel="noreferrer"
                aria-label="Surf"
                className="flex items-center"
              >
                <SurfWordmark className="h-5 w-auto text-ink-50" />
              </a>
              <span className="hidden sm:inline-block h-5 w-px bg-white/10" />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-display text-[17px] tracking-tight text-ink-50">
                  mindshare
                </span>
                <span className="mono-label">crypto social intelligence</span>
              </div>
            </div>
            <div className="flex-1 max-w-[420px]">
              <ProjectSearch onPick={onSearchPick} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <span className="dot-indicator animate-pulse-soft" />
              <span className="mono-label">live</span>
              {lastUpdated && (
                <span className="text-[11px] text-ink-400 tnum" suppressHydrationWarning>
                  synced {lastUpdated.toLocaleTimeString("en", { hour12: false })}
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/[0.02] p-0.5">
              {TGE_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onTgeMode(m.id)}
                  className={clsx(
                    "px-3 py-1 text-[11px] font-medium rounded-full transition-colors",
                    tgeMode === m.id
                      ? "bg-lime text-ink-950"
                      : "text-ink-300 hover:text-white"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center gap-0 rounded-full border border-white/10 bg-white/[0.02] p-0.5">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr}
                  onClick={() => onTimeRange(tr)}
                  className={clsx(
                    "px-3 py-1 text-[11px] font-medium rounded-full transition-colors tnum",
                    timeRange === tr
                      ? "bg-lime text-ink-950"
                      : "text-ink-300 hover:text-white"
                  )}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 -mx-1 px-1 overflow-x-auto">
          {CATEGORY_TAGS.map((t) => (
            <Chip
              key={t.id}
              active={category === t.id}
              onClick={() => onCategory(t.id as CategoryId)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
    </header>
  );
}
