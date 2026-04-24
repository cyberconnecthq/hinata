export function formatCompact(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (Math.abs(n) < 1000) return n.toFixed(n % 1 === 0 ? 0 : digits);
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPercent(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatSigned(n: number | undefined | null, digits = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

export function timeAgo(unixSeconds: number): string {
  const diffSec = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
  if (diffSec < 60) return `${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

export function sentimentColor(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "text-ink-300";
  if (score >= 0.2) return "text-teal";
  if (score >= -0.2) return "text-amber";
  return "text-rose";
}

export function sentimentLabel(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "neutral";
  if (score >= 0.5) return "bullish";
  if (score >= 0.15) return "positive";
  if (score >= -0.15) return "neutral";
  if (score >= -0.5) return "negative";
  return "bearish";
}
