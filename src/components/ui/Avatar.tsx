import clsx from "clsx";

export function Avatar({
  src,
  alt,
  size = 32,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const initials = alt
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (
    <div
      className={clsx(
        "relative shrink-0 overflow-hidden rounded-full bg-white/5 border border-white/10",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className="w-full h-full flex items-center justify-center text-ink-300"
          style={{ fontSize: size * 0.4 }}
        >
          {initials || "·"}
        </span>
      )}
    </div>
  );
}
