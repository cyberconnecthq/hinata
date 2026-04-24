"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { HeroTiles } from "@/components/panels/HeroTiles";
import { Leaderboard } from "@/components/panels/Leaderboard";
import { Arena } from "@/components/panels/Arena";
import { Spotlight } from "@/components/panels/Spotlight";
import { ContributorsPanel } from "@/components/panels/ContributorsPanel";
import { LiveFeed } from "@/components/panels/LiveFeed";
import { NewsPanel } from "@/components/panels/NewsPanel";
import { SurfWordmark } from "@/components/ui/SurfLogo";
import {
  CATEGORY_TAGS,
  isPreTge,
  type CategoryId,
  type RankingItem,
  type TgeMode,
  type TimeRange,
} from "@/lib/types";

interface DashboardProps {
  initialRanking: RankingItem[];
  initialTimeRange: TimeRange;
  initialCategory: CategoryId;
}

export function Dashboard({ initialRanking, initialTimeRange, initialCategory }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [tgeMode, setTgeMode] = useState<TgeMode>("all");
  const cleanInitial = initialRanking.filter(
    (r): r is RankingItem => !!r?.project?.id && !!r?.project?.name
  );
  const [ranking, setRanking] = useState<RankingItem[]>(cleanInitial);
  const firstWithTwitter =
    cleanInitial.find((r) => r.twitter?.x_handle) || cleanInitial[0] || null;
  const [selected, setSelected] = useState<RankingItem | null>(firstWithTwitter);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // Background prefetch all remaining category rankings on mount so
  // subsequent chip clicks hit the 5-min server cache instantly.
  useEffect(() => {
    const cats = CATEGORY_TAGS.filter(
      (t) => t.id !== "all" && t.id !== initialCategory
    ).map((t) => t.id);
    let cancelled = false;
    (async () => {
      for (const cat of cats) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 250));
        if (cancelled) return;
        fetch(
          `/api/mindshare/ranking?time_range=${initialTimeRange}&limit=100&tag=${cat}`
        ).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRanking = useCallback(async (tr: TimeRange, cat: CategoryId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ time_range: tr, limit: "100" });
      if (cat && cat !== "all") params.set("tag", cat);
      const res = await fetch(`/api/mindshare/ranking?${params}`);
      const json = await res.json();
      if (Array.isArray(json?.data)) {
        const next: RankingItem[] = json.data.filter(
          (r: RankingItem | undefined): r is RankingItem => !!r?.project?.id
        );
        setRanking(next);
        setLastUpdated(new Date());
        setSelected((prev) => {
          const prevId = prev?.project?.id;
          if (prevId && next.some((r) => r.project.id === prevId)) {
            return prev;
          }
          return next.find((r) => r.twitter?.x_handle) || next[0] || null;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // skip initial (we already have initialRanking)
    if (timeRange === initialTimeRange && category === initialCategory) return;
    fetchRanking(timeRange, category);
  }, [timeRange, category, fetchRanking, initialTimeRange, initialCategory]);

  const tgeFiltered = useMemo(() => {
    if (tgeMode === "all") return ranking;
    return ranking.filter((r) =>
      tgeMode === "pre" ? isPreTge(r) : !isPreTge(r)
    );
  }, [ranking, tgeMode]);

  const spotlightQuery = selected
    ? selected.project.slug || selected.project.name.toLowerCase()
    : "bitcoin";

  return (
    <div className="min-h-screen">
      <TopBar
        timeRange={timeRange}
        onTimeRange={setTimeRange}
        category={category}
        onCategory={setCategory}
        tgeMode={tgeMode}
        onTgeMode={setTgeMode}
        onSearchPick={setSelected}
        lastUpdated={lastUpdated}
        loading={loading}
      />

      <main className="mx-auto max-w-[1600px] px-4 md:px-8 py-6 md:py-8 flex flex-col gap-4 md:gap-5">
        <HeroTiles ranking={tgeFiltered} timeRange={timeRange} />

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 md:gap-5">
          <Leaderboard
            items={tgeFiltered}
            selectedId={selected?.project.id}
            onSelect={setSelected}
            onCategory={setCategory}
            loading={loading}
          />
          <Arena items={tgeFiltered} leaderId={selected?.project.id} onSelect={setSelected} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 md:gap-5">
          <Spotlight project={selected} timeRange={timeRange} />
          <ContributorsPanel query={spotlightQuery} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4 md:gap-5">
          <NewsPanel query={spotlightQuery} />
          <LiveFeed query={spotlightQuery} />
        </div>

        <footer className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
          <div className="mono-label">
            data · <span className="text-lime">surf</span> api · refreshed live
          </div>
          <a
            href="https://asksurf.ai"
            target="_blank"
            rel="noreferrer"
            aria-label="Made by Surf"
            className="group inline-flex items-center gap-2 mono-label transition-colors"
          >
            <span>made by</span>
            <SurfWordmark className="h-3.5 w-auto text-ink-100 group-hover:text-lime transition-colors" />
          </a>
        </footer>
      </main>
    </div>
  );
}
