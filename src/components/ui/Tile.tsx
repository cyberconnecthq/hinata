import clsx from "clsx";
import type { ReactNode } from "react";

interface TileProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  padded?: boolean;
}

export function Tile({ children, className, accent, padded = true }: TileProps) {
  return (
    <div
      className={clsx(
        "tile noise",
        accent && "tile-accent",
        padded && "p-5 md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TileHeader({
  label,
  trailing,
  description,
}: {
  label: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex flex-col gap-1">
        <span className="mono-label">{label}</span>
        {description && <span className="text-[12px] text-ink-300">{description}</span>}
      </div>
      {trailing}
    </div>
  );
}
