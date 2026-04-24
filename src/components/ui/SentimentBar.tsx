import clsx from "clsx";

export function SentimentBar({ score, width = 72 }: { score: number | null | undefined; width?: number }) {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return <div style={{ width }} className="h-1.5 rounded-full bg-white/5" />;
  }
  const clamped = Math.max(-1, Math.min(1, score));
  const pct = (clamped + 1) / 2;
  const color =
    clamped >= 0.15 ? "#4FD1C5" : clamped <= -0.15 ? "#FF6B6B" : "#FFB547";
  const fillWidth = Math.abs(clamped) * (width / 2);
  const centerX = width / 2;
  const fillX = clamped >= 0 ? centerX : centerX - fillWidth;
  return (
    <div
      className="relative rounded-full overflow-hidden bg-white/[0.04]"
      style={{ width, height: 6 }}
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
      <div
        className={clsx("absolute top-0 bottom-0 rounded-full transition-all")}
        style={{
          left: fillX,
          width: fillWidth,
          background: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
}
