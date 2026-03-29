'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FeedItem {
  id: string;
  username: string;
  avatar_url: string | null;
  tier: { label: string; emoji: string };
  scan_count: number;
  brand: string;
  strain_name: string;
  strain_type: string;
  product_type: string;
  thc_percent: number | null;
  rating: number;
  notes: string | null;
  effects: string[];
  would_buy_again: boolean;
  created_at: string;
}

const typeBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-xs text-yellow-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export function CommunityPreview() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/community-feed')
      .then(r => r.json())
      .then(d => setItems((d.feed ?? []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-zinc-800" />
      {[0,1,2].map(i => (
        <div key={i} className="rounded-xl border border-zinc-800 p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-800" />
          </div>
          <div className="h-3 w-3/4 rounded bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Community</p>
        <Link href="/community" className="text-xs text-zinc-600 hover:text-zinc-400 transition">See all →</Link>
      </div>

      <div className="flex flex-col gap-2">
        {items.map(item => {
          const badge = typeBadge[item.strain_type] ?? typeBadge.unknown;
          const title = item.strain_name || item.brand || 'Unknown';
          const subtitle = [item.brand !== title && item.brand, item.product_type].filter(Boolean).join(' · ');
          return (
            <Link
              key={item.id}
              href="/community"
              className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 hover:border-zinc-700 transition"
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-zinc-400">{item.username[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-xs text-zinc-400 truncate">{item.username}</span>
                  <span className="text-[10px] text-zinc-600">{item.scan_count ?? 0} logs</span>
                </div>
                <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(item.created_at)}</span>
              </div>

              {/* Strain + rating */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-100 truncate">{title}</span>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${badge}`}>
                      {item.strain_type}
                    </span>
                  </div>
                  {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <StarRow rating={item.rating} />
                  {item.thc_percent && (
                    <span className="text-[10px] text-emerald-500 font-medium">{item.thc_percent}% THC</span>
                  )}
                </div>
              </div>

              {/* Note */}
              {item.notes && (
                <p className="text-xs text-zinc-400 italic line-clamp-1">&ldquo;{item.notes}&rdquo;</p>
              )}

              {/* Effects */}
              {item.effects?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.effects.slice(0, 3).map(e => (
                    <span key={e} className="rounded-full border border-zinc-700/60 text-zinc-500 text-[10px] px-2 py-0.5">{e}</span>
                  ))}
                  {item.would_buy_again && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5">✓ Would buy again</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
