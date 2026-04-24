export interface NewsArticleItem {
  id: string;
  project_id?: string;
  project_name?: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  published_at: number;
}

export const NEWS_SOURCES = [
  "coindesk",
  "cointelegraph",
  "theblock",
  "decrypt",
  "dlnews",
  "blockbeats",
  "bitcoincom",
  "coinpedia",
  "ambcrypto",
  "cryptodaily",
  "cryptopotato",
  "phemex",
  "panews",
  "odaily",
  "tradingview",
  "chaincatcher",
  "techflow",
] as const;

export type NewsSource = (typeof NEWS_SOURCES)[number];
