import clsx from "clsx";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatPercent } from "@/lib/format";

export function Delta({
  value,
  className,
  size = "sm",
}: {
  value: number | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className={clsx("inline-flex items-center gap-1 text-ink-400 tnum", className)}>
        <Minus className="w-3 h-3" />—
      </span>
    );
  }
  const positive = value > 0;
  const negative = value < 0;
  const tone = positive
    ? "text-lime"
    : negative
      ? "text-rose"
      : "text-ink-300";
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  const textSize = size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={clsx("inline-flex items-center gap-0.5 tnum font-medium", textSize, tone, className)}>
      <Icon className={size === "md" ? "w-4 h-4" : "w-3 h-3"} />
      {formatPercent(Math.abs(value), value >= 10 ? 0 : 1).replace("+", "")}
    </span>
  );
}
