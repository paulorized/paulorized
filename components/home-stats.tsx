'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  thisWeek: number;
  uniqueStrains: number;
  topType: string | null;
  maxThc: number | null;
  topBrand: string | null;
  typeCounts: { indica: number; sativa: number; hybrid: number };
}

const typeColors: Record<string, { bar: string; label: string; icon: string }> = {
  indica: { bar: 'bg-purple-500', label: 'text-purple-300', icon: '🌙' },
  sativa: { bar: 'bg-yellow-400', label: 'text-yellow-300', icon: '☀️' },
  hybrid: { bar: 'bg-emerald-500', label: 'text-emerald-300', icon: '⚡' },
};

export function HomeStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/home-stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  if (!stats || stats.total === 0) return null;

  const { total, thisWeek, uniqueStrains, topType, maxThc, topBrand, typeCounts } = stats;
  const typeTotal = (typeCounts.indica + typeCounts.sativa + typeCounts.hybrid) || 1;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Your Stats</p>
        <Link href="/history" className="text-xs text-zinc-600 hover:text-zinc-400 transition">View history →</Link>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-zinc-100">{total}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">Total Scans</p>
        </div>
        <div className="rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-zinc-100">{uniqueStrains}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">Strains Tried</p>
        </div>
        <div className="rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
          <p className="text-xl font-bold text-emerald-400">{thisWeek}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">This Week</p>
        </div>
      </div>

      {/* Type breakdown bar */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Type Breakdown</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {(['indica', 'sativa', 'hybrid'] as const).map(t => {
            const pct = (typeCounts[t] / typeTotal) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={t}
                className={`${typeColors[t].bar} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        <div className="flex gap-3">
          {(['indica', 'sativa', 'hybrid'] as const).map(t => (
            typeCounts[t] > 0 && (
              <span key={t} className={`text-[10px] ${typeColors[t].label} flex items-center gap-1`}>
                {typeColors[t].icon} {typeCounts[t]} {t}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Bottom highlights */}
      <div className="flex gap-2 flex-wrap">
        {maxThc != null && (
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 px-3 py-1">
            <span className="text-[10px] text-zinc-500">Highest THC</span>
            <span className="text-[10px] font-bold text-emerald-400">{maxThc}%</span>
          </div>
        )}
        {topBrand && (
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 px-3 py-1">
            <span className="text-[10px] text-zinc-500">Fav Brand</span>
            <span className="text-[10px] font-bold text-zinc-200">{topBrand}</span>
          </div>
        )}
        {topType && (
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 px-3 py-1">
            <span className="text-[10px] text-zinc-500">Leans</span>
            <span className={`text-[10px] font-bold capitalize ${typeColors[topType]?.label ?? 'text-zinc-200'}`}>
              {typeColors[topType]?.icon} {topType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
