"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import type { ProjectEventItem } from "@/app/api/mindshare/events/route";
import { Tile, TileHeader } from "@/components/ui/Tile";
import { Avatar } from "@/components/ui/Avatar";
import { SentimentBar } from "@/components/ui/SentimentBar";
import { formatCompact, formatSigned, sentimentLabel } from "@/lib/format";
import type {
  MindsharePoint,
  RankingItem,
  SmartFollowerHistoryPoint,
  SocialDetail,
  TagSeries,
} from "@/lib/types";

function formatDate(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en", { month: "short", day: "2-digit" });
}

export function Spotlight({
  project,
  timeRange,
}: {
  project: RankingItem | null;
  timeRange: string;
}) {
  const [trend, setTrend] = useState<MindsharePoint[]>([]);
  const [tagPercents, setTagPercents] = useState<TagSeries[]>([]);
  const [detail, setDetail] = useState<SocialDetail | null>(null);
  const [smartHistory, setSmartHistory] = useState<SmartFollowerHistoryPoint[]>([]);
  const [events, setEvents] = useState<ProjectEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    const q = project.project.slug || project.project.name.toLowerCase();
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    // Keep stale data visible (stale-while-revalidate) — don't blank out
    // the panel between project switches; new data swaps in on arrival.

    const days = timeRange === "24h" ? 7 : timeRange === "48h" ? 14 : timeRange === "7d" ? 30 : 60;
    const interval = timeRange === "24h" || timeRange === "48h" ? "1h" : "1d";

    Promise.allSettled([
      fetch(
        `/api/mindshare/trend?q=${encodeURIComponent(q)}&interval=${interval}&days=${days}&include_tags=1`
      ).then((r) => r.json()),
      fetch(`/api/mindshare/detail?q=${encodeURIComponent(q)}&time_range=${timeRange}`).then((r) => r.json()),
      fetch(`/api/mindshare/smart-followers?q=${encodeURIComponent(q)}`).then((r) => r.json()),
      fetch(`/api/mindshare/events?q=${encodeURIComponent(q)}&limit=30`).then((r) => r.json()),
    ]).then(([trendRes, detailRes, smartRes, eventsRes]) => {
      if (cancelled) return;
      if (trendRes.status === "fulfilled" && trendRes.value?.data) {
        setTrend(trendRes.value.data);
        setTagPercents(
          Array.isArray(trendRes.value?.tag_percents) ? trendRes.value.tag_percents : []
        );
      }
      if (detailRes.status === "fulfilled" && detailRes.value?.data) {
        setDetail(detailRes.value.data);
      } else if (detailRes.status === "fulfilled" && detailRes.value?.error?.message) {
        setErrorMsg(detailRes.value.error.message);
      }
      if (smartRes.status === "fulfilled" && smartRes.value?.data) {
        setSmartHistory(smartRes.value.data);
      }
      if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value?.data)) {
        setEvents(eventsRes.value.data);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [project, timeRange]);

  if (!project) {
    return (
      <Tile className="h-full flex items-center justify-center text-ink-400">
        Select a project from the leaderboard
      </Tile>
    );
  }

  const smartSorted = [...smartHistory].sort((a, b) => (a.date > b.date ? 1 : -1));
  const smartLatest = smartSorted.at(-1);
  const smartPrev = smartSorted.length > 7 ? smartSorted[smartSorted.length - 8] : smartSorted[0];
  const smartDelta =
    smartLatest && smartPrev
      ? ((smartLatest.count - smartPrev.count) / Math.max(1, smartPrev.count)) * 100
      : 0;

  const peakValue = trend.length ? Math.max(...trend.map((p) => p.value)) : 0;
  const lastValue = trend.at(-1)?.value || 0;
  const firstValue = trend[0]?.value || 0;
  const trendDelta = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  // For each event, find the closest trend timestamp and use that point's
  // value as the y-coordinate so the dot sits on the line. Events outside
  // the trend's time window are dropped.
  const eventDots = (() => {
    if (!trend.length || !events.length) return [] as { x: number; y: number; event: ProjectEventItem }[];
    const first = trend[0].timestamp;
    const last = trend.at(-1)!.timestamp;
    const dots: { x: number; y: number; event: ProjectEventItem }[] = [];
    const seen = new Set<string>();
    for (const ev of events) {
      const eventTs = Math.floor(new Date(ev.date + "T00:00:00Z").getTime() / 1000);
      if (isNaN(eventTs)) continue;
      if (eventTs < first || eventTs > last) continue;
      // Dedupe events on the same day
      const dayKey = ev.date + "|" + ev.type;
      if (seen.has(dayKey)) continue;
      seen.add(dayKey);
      // Closest trend point
      let closest = trend[0];
      let minDiff = Math.abs(trend[0].timestamp - eventTs);
      for (const p of trend) {
        const d = Math.abs(p.timestamp - eventTs);
        if (d < minDiff) {
          minDiff = d;
          closest = p;
        }
      }
      dots.push({ x: closest.timestamp, y: closest.value, event: ev });
    }
    return dots.slice(0, 12);
  })();

  const eventTypeColor = (t: string) =>
    t === "twitter" ? "#4FD1C5" : t === "news" ? "#FFB547" : "#C8FF3D";

  const geoTop = detail?.follower_geo?.locations?.slice(0, 5) || [];

  return (
    <Tile className="h-full" padded={false}>
      <div className="p-5 md:p-6 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              size={56}
              alt={project.project.name}
              src={project.token?.image || project.twitter?.avatar_url}
            />
            <div className="flex flex-col min-w-0">
              <span className="mono-label">mindshare spotlight · rank #{project.rank}</span>
              <span className="display text-2xl md:text-3xl text-ink-50 truncate">
                {project.project.name}
              </span>
              <span className="text-[12px] text-ink-400 truncate">
                {project.token?.symbol ? `$${project.token.symbol}` : ""}
                {project.twitter ? `  ·  @${project.twitter.x_handle}` : ""}
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
            <span className="mono-label">aggregate sentiment</span>
            <div className="flex items-center gap-3">
              <SentimentBar score={project.sentiment_score ?? 0} width={100} />
              <span className="tnum text-[14px]">{formatSigned(project.sentiment_score, 2)}</span>
            </div>
            <span className="text-[11px] text-ink-400">{sentimentLabel(project.sentiment_score)}</span>
          </div>
        </div>
      </div>

      <div className="hairline mx-5 md:mx-6 mb-3" />

      {tagPercents.length > 0 && (
        <div className="px-5 md:px-6 pb-3 flex flex-wrap gap-2">
          <span className="mono-label self-center mr-1">share of category</span>
          {tagPercents
            .filter((t) => typeof t.share_ratio === "number")
            .sort((a, b) => (b.share_ratio ?? 0) - (a.share_ratio ?? 0))
            .slice(0, 6)
            .map((t) => (
              <div
                key={t.tag}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime/25 bg-lime/[0.04]"
                title={`Rank ${t.rank ?? "—"} · ${((t.share_ratio ?? 0) * 100).toFixed(2)}% of total views in ${t.tag}`}
              >
                <span className="text-[11px] text-ink-100">{t.tag}</span>
                <span className="mono-label text-lime">#{t.rank ?? "—"}</span>
                <span className="tnum text-[12px] text-lime">
                  {((t.share_ratio ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 px-5 md:px-6 pb-6">
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="mono-label">mindshare · social views</div>
              <div className="display text-3xl text-ink-50 tnum">{formatCompact(lastValue)}</div>
              <div className="text-[11px] text-ink-400 tnum">
                peak {formatCompact(peakValue)} · {formatSigned(trendDelta, 1)}% since window start
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-48"
          >
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="msArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8FF3D" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#C8FF3D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  tick={{ fill: "#7F786C", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v) => formatCompact(Number(v))}
                  tick={{ fill: "#7F786C", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141210",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#E8E3D7",
                    fontSize: 12,
                  }}
                  labelFormatter={(ts) => formatDate(Number(ts))}
                  formatter={(v: number) => [formatCompact(v), "views"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#C8FF3D"
                  strokeWidth={2}
                  fill="url(#msArea)"
                />
                {eventDots.map((d, i) => (
                  <ReferenceDot
                    key={i}
                    x={d.x}
                    y={d.y}
                    r={5}
                    fill={eventTypeColor(d.event.type)}
                    stroke="#0C0B0A"
                    strokeWidth={2}
                    isFront
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          {loading && (
            <div className="mono-label text-center mt-2 animate-pulse-soft">fetching trend…</div>
          )}
          {eventDots.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="mono-label">key events on chart</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-ink-400">
                    <span className="w-2 h-2 rounded-full bg-amber inline-block" /> news
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-ink-400">
                    <span className="w-2 h-2 rounded-full bg-teal inline-block" /> x/social
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                {eventDots.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] leading-snug">
                    <span
                      className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: eventTypeColor(d.event.type) }}
                    />
                    <span className="mono-label tnum shrink-0 w-16">{d.event.date}</span>
                    <span className="text-ink-100 truncate" title={d.event.description || d.event.title}>
                      {d.event.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="mono-label mb-1">smart followers</div>
            <div className="flex items-baseline gap-2">
              <span className="display text-3xl tnum">{smartLatest?.count ?? "—"}</span>
              <span
                className={
                  smartDelta >= 0 ? "text-lime text-[12px]" : "text-rose text-[12px]"
                }
              >
                {smartDelta !== 0 ? `${formatSigned(smartDelta, 1)}% 7d` : ""}
              </span>
            </div>
            {smartSorted.length > 1 && (
              <div className="mt-2 h-8">
                <ResponsiveContainer>
                  <AreaChart data={smartSorted}>
                    <defs>
                      <linearGradient id="smArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4FD1C5" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#4FD1C5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area dataKey="count" stroke="#4FD1C5" strokeWidth={1.5} fill="url(#smArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="mono-label mb-2">top follower geo</div>
            {geoTop.length > 0 ? (
              <div className="flex flex-col gap-2">
                {geoTop.map((g) => (
                  <div key={g.location} className="flex items-center gap-3">
                    <span className="text-[12px] text-ink-100 w-28 truncate">{g.location}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber"
                        style={{
                          width: `${Math.min(100, (g.percentage / (geoTop[0]?.percentage || 1)) * 100)}%`,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="tnum text-[11px] text-ink-300 w-10 text-right">
                      {g.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-ink-400">
                {errorMsg || "no geo data linked to this project"}
              </div>
            )}
            {detail?.follower_geo?.total_follower_count ? (
              <div className="mono-label mt-3">
                {formatCompact(detail.follower_geo.total_follower_count)} followers sampled
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {detail?.smart_followers?.followers?.length ? (
        <div className="px-5 md:px-6 pb-6">
          <div className="hairline mb-4" />
          <div className="mono-label mb-3">smart follower roster · top by influence</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {detail.smart_followers.followers.slice(0, 12).map((f) => (
              <a
                key={f.handle}
                href={`https://x.com/${f.handle}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-colors"
              >
                <Avatar size={32} alt={f.name} src={f.avatar} />
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[12px] text-ink-100 truncate">{f.name}</span>
                  <span className="mono-label truncate">{f.tag}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </Tile>
  );
}
