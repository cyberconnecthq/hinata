"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import type { RankingItem } from "@/lib/types";

interface SearchItem {
  id: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo_url?: string;
  description?: string;
  tags?: string[];
  tokens?: { id: string; name: string; symbol?: string; image?: string }[];
}

export function ProjectSearch({
  onPick,
}: {
  onPick: (proj: RankingItem) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/mindshare/search?q=${encodeURIComponent(q)}&limit=8`)
        .then((r) => r.json())
        .then((res) => {
          if (Array.isArray(res.data)) setResults(res.data);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Click outside closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pickItem = (item: SearchItem) => {
    // Coerce to RankingItem shape the Dashboard uses elsewhere. rank=0
    // signals "not from leaderboard".
    const token = item.tokens?.[0] || (item.symbol ? { id: "", name: item.name, symbol: item.symbol } : undefined);
    const proj: RankingItem = {
      rank: 0,
      project: { id: item.id, name: item.name, slug: item.slug },
      token: token && { id: token.id, name: token.name, symbol: token.symbol, image: (token as { image?: string }).image || item.logo_url },
      tags: item.tags,
    };
    onPick(proj);
    setQ("");
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[380px]">
      <div
        className={clsx(
          "flex items-center gap-2 rounded-full border bg-white/[0.02] px-3 py-1.5 transition-colors",
          focused ? "border-lime/40" : "border-white/10"
        )}
      >
        <Search className="w-4 h-4 text-ink-400 shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder="search any project · bitcoin, uniswap, berachain…"
          className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-ink-400 tnum"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
            }}
            className="text-ink-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-ink-900/95 backdrop-blur-xl shadow-2xl z-40 overflow-hidden">
          {loading && results.length === 0 && (
            <div className="px-4 py-6 mono-label text-center animate-pulse-soft">searching…</div>
          )}
          {!loading && results.length === 0 && q.length >= 2 && (
            <div className="px-4 py-6 text-[12px] text-ink-400 text-center">No projects matched &quot;{q}&quot;.</div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pickItem(item)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-b-0"
            >
              <Avatar size={32} alt={item.name} src={item.logo_url || item.tokens?.[0]?.image} />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-ink-50 truncate">{item.name}</span>
                  {item.symbol && (
                    <span className="mono-label tnum">${item.symbol}</span>
                  )}
                </div>
                {item.description && (
                  <span className="text-[11px] text-ink-400 line-clamp-2">{item.description}</span>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded-full border border-white/10 text-[9px] text-ink-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
