'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CommunityData = {
  totalScans: number;
  avgThc: number | null;
  strainTypeCounts: Record<string, number>;
  topStrains: { name: string; count: number }[];
  topBrands: { name: string; count: number }[];
  topProductTypes: { name: string; count: number }[];
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
  isFallback: boolean;
  totalCommunityScans: number;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function Bar({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-zinc-300">{name}</span>
        <span className="text-zinc-500">{count.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load community data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-zinc-500">Loading community data…</p>
      </div>
    </main>
  );

  if (error || !data) return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <p className="text-sm text-rose-400">{error || 'No data available.'}</p>
    </main>
  );

  const strainTotal = Object.values(data.strainTypeCounts).reduce((a, b) => a + b, 0);
  const strainColors: Record<string, string> = {
    hybrid: 'bg-emerald-400',
    indica: 'bg-purple-400',
    sativa: 'bg-yellow-400',
    unknown: 'bg-zinc-600',
  };
  const strainTextColors: Record<string, string> = {
    hybrid: 'text-emerald-400',
    indica: 'text-purple-400',
    sativa: 'text-yellow-400',
    unknown: 'text-zinc-500',
  };

  const maxBrand = data.topBrands[0]?.count ?? 1;
  const maxStrain = data.topStrains[0]?.count ?? 1;
  const maxType = data.topProductTypes[0]?.count ?? 1;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Community</h1>
          <p className="mt-0.5 text-xs text-zinc-500">What everyone is logging</p>
        </div>
        <Link href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800">
          My Stats →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Total scans</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{data.totalScans.toLocaleString()}</p>
          <p className="text-xs text-zinc-600">across all users</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-500">Avg THC</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{data.avgThc != null ? `${data.avgThc}%` : '—'}</p>
          <p className="text-xs text-zinc-600">community average</p>
        </div>
      </div>

      {/* Strain type breakdown */}
      {strainTotal > 0 && (
        <Section title="Strain types">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(data.strainTypeCounts)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-center">
                  <p className={`text-lg font-bold ${strainTextColors[type] ?? 'text-zinc-400'}`}>
                    {Math.round((count / strainTotal) * 100)}%
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-zinc-500">{type}</p>
                </div>
              ))}
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {Object.entries(data.strainTypeCounts)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className={strainColors[type] ?? 'bg-zinc-600'}
                  style={{ width: `${(count / strainTotal) * 100}%` }}
                />
              ))}
          </div>
        </Section>
      )}

      {/* Product types */}
      {data.topProductTypes.length > 0 && (
        <Section title="Most scanned product types">
          <div className="space-y-2">
            {data.topProductTypes.map(p => (
              <Bar key={p.name} name={p.name} count={p.count} max={maxType} color="bg-sky-500" />
            ))}
          </div>
        </Section>
      )}

      {/* Top strains */}
      {data.topStrains.length > 0 && (
        <Section title="Most logged strains">
          <div className="space-y-2">
            {data.topStrains.map(s => (
              <Bar key={s.name} name={s.name} count={s.count} max={maxStrain} color="bg-emerald-500" />
            ))}
          </div>
        </Section>
      )}

      {/* Top brands */}
      {data.topBrands.length > 0 && (
        <Section title="Top brands">
          <div className="space-y-2">
            {data.topBrands.map(b => (
              <Bar key={b.name} name={b.name} count={b.count} max={maxBrand} color="bg-purple-500" />
            ))}
          </div>
        </Section>
      )}

      {/* Effects */}
      {data.topEffects.length > 0 && (
        <Section title="Most reported effects">
          <div className="flex flex-wrap gap-2">
            {data.topEffects.map((e, i) => (
              <span key={i} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {e.name} <span className="text-emerald-600">×{e.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Flavors */}
      {data.topFlavors.length > 0 && (
        <Section title="Most reported flavors">
          <div className="flex flex-wrap gap-2">
            {data.topFlavors.map((f, i) => (
              <span key={i} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                {f.name} <span className="text-amber-600">×{f.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      <div className="pb-8" />
    </main>
  );
}