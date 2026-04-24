export interface RankingItem {
  rank: number;
  project: {
    id: string;
    name: string;
    slug?: string;
  };
  token?: {
    id?: string;
    image?: string;
    name: string;
    symbol?: string;
  };
  twitter?: {
    avatar_url?: string;
    display_name: string;
    twitter_id: string;
    x_handle: string;
  };
  tags?: string[];
  sentiment?: string;
  sentiment_score?: number;
}

export interface MindsharePoint {
  timestamp: number;
  value: number;
}

export interface TagSeries {
  tag: string;
  rank?: number;
  share_ratio?: number;
  points: { timestamp: number; percent: number }[];
}

export interface SocialDetail {
  twitter_id: string;
  project_id?: string;
  project_name?: string;
  sentiment: { score: number | null; time_range: string };
  follower_geo: {
    total_follower_count: number;
    locations: { location: string; follower_count: number; percentage: number }[];
  };
  smart_followers: {
    count: number;
    followers: {
      handle: string;
      name: string;
      avatar: string;
      description?: string;
      followers_count: number;
      rank: number;
      score: number;
      tag: string;
      twitter_id: string;
    }[];
  };
}

export interface SmartFollowerHistoryPoint {
  date: string;
  count: number;
}

export interface SocialPost {
  tweet_id: string;
  url: string;
  text: string;
  created_at: number;
  author: { handle: string; name: string; avatar?: string; user_id: string };
  stats: { likes: number; replies: number; reposts: number; views: number };
  media?: { type: string; url: string }[];
}

// Mirrors surf social-ranking --tag enum (15 values), plus "all" as no-filter.
// Order follows the order in surf --help output.
export const CATEGORY_TAGS = [
  { id: "all", label: "All" },
  { id: "l1", label: "L1" },
  { id: "l2", label: "L2" },
  { id: "dex", label: "DEX" },
  { id: "derivatives", label: "Perps" },
  { id: "cex", label: "CEX" },
  { id: "gamefi", label: "GameFi" },
  { id: "nft", label: "NFT" },
  { id: "oracle", label: "Oracle" },
  { id: "prediction", label: "Prediction" },
  { id: "rwa", label: "RWA" },
  { id: "yield", label: "Yield" },
  { id: "data", label: "Data" },
  { id: "devtool", label: "DevTool" },
  { id: "compliance", label: "Compliance" },
  { id: "meme", label: "Meme" },
] as const;

export type CategoryId = (typeof CATEGORY_TAGS)[number]["id"];

// Pattern-based mapping: raw tag strings in Surf response (e.g. "Layer1",
// "Prediction Market", "Exchange (CEX)") are mapped back to the 15 filter
// chip slugs so row-level tags stay visually consistent with the top bar.
const CHIP_PATTERNS: Array<[Exclude<CategoryId, "all">, RegExp]> = [
  ["l1", /^layer\s*1$/i],
  ["l2", /layer\s*2/i],
  ["dex", /(^|\W)dex($|\W)|\bamm\b/i],
  ["derivatives", /perp|derivative|option|futures/i],
  ["cex", /\bcex\b|exchange\s*\(cex\)/i],
  ["gamefi", /gamefi|metaverse/i],
  ["nft", /\bnft\b/i],
  ["oracle", /oracle/i],
  ["prediction", /prediction/i],
  ["rwa", /\brwa\b|real\s*world|listed\s*company|pre-?stock/i],
  ["yield", /yield|lending|borrowing|asset\s*mgmt/i],
  ["data", /data\s*&?\s*analytic|quant/i],
  ["devtool", /devtool|developer\s*tool/i],
  ["compliance", /compliance|regtech/i],
  ["meme", /\bmeme\b|token\s*launchpad/i],
];

export function tagToChip(rawTag: string): Exclude<CategoryId, "all"> | null {
  for (const [id, pattern] of CHIP_PATTERNS) {
    if (pattern.test(rawTag)) return id;
  }
  return null;
}

export function chipLabel(id: CategoryId): string {
  return CATEGORY_TAGS.find((t) => t.id === id)?.label ?? id;
}

export const TIME_RANGES = ["24h", "48h", "7d", "30d"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export const TGE_MODES = [
  { id: "all", label: "All" },
  { id: "pre", label: "Pre-TGE" },
  { id: "post", label: "Post-TGE" },
] as const;
export type TgeMode = (typeof TGE_MODES)[number]["id"];

export function isPreTge(item: RankingItem): boolean {
  // Heuristic: projects without a token symbol are pre-TGE.
  return !item.token?.symbol;
}
