import clsx from "clsx";
import type { ReactNode } from "react";

export function Chip({
  children,
  active,
  accent,
  onClick,
  className,
  size = "sm",
}: {
  children: ReactNode;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border transition-colors whitespace-nowrap select-none";
  const sz = size === "md" ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]";
  const clickable = onClick ? "cursor-pointer hover:border-white/20" : "";
  const tone = active
    ? "bg-lime text-ink-950 border-lime font-semibold"
    : accent
      ? "bg-lime/6 text-lime border-lime/30"
      : "bg-white/[0.02] text-ink-300 border-white/5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(base, sz, tone, clickable, className)}
      disabled={!onClick}
    >
      {children}
    </button>
  );
}
