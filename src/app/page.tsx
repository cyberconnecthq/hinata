import { Dashboard } from "@/components/Dashboard";
import { surf } from "@/lib/surf";
import type { RankingItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initial = await surf<RankingItem[]>(
    "social-ranking",
    { "time-range": "7d", limit: 100 },
    { ttlSeconds: 120 }
  );

  const data = (initial.data || []).filter(
    (r): r is RankingItem => !!r?.project?.id && !!r?.project?.name
  );

  return (
    <Dashboard
      initialRanking={data}
      initialTimeRange="7d"
      initialCategory="all"
    />
  );
}
