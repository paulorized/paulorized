'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StrainHit {
  slug: string;
  name: string;
  strain_type: string | null;
  thc_min: number | null;
  thc_max: number | null;
  cbd_min?: number | null;
  cbd_max?: number | null;
  typical_effects?: string[];
  typical_flavors?: string[];
}

const typeConfig: Record<string, { label: string; color: string; bg: string; bar: string; icon: string }> = {
  indica:  { label: 'Indica',  color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/20', bar: 'bg-purple-500', icon: '🌙' },
  sativa:  { label: 'Sativa',  color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-400', icon: '☀️' },
  hybrid:  { label: 'Hybrid',  color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500', icon: '⚡' },
  unknown: { label: 'Unknown', color: 'text-zinc-400', bg: 'bg-zinc-800/50 border-zinc-700', bar: 'bg-zinc-600', icon: '🌿' },
};

// THC bar — prominent visual range bar
function ThcBar({ min, max, color }: { min: number | null; max: number | null; color: string }) {
  if (min == null && max == null) return null;
  const lo = Math.min(min ?? max ?? 0, max ?? min ?? 0);
  const hi = Math.max(min ?? max ?? 0, max ?? min ?? 0);
  const maxVal = 40;
  const loPct = (lo / maxVal) * 100;
  const rangePct = ((hi - lo) / maxVal) * 100;
  const displayVal = lo === hi ? `${lo}%` : `${lo}–${hi}%`;
  const barColor = color.replace('text-', 'bg-').replace('-300', '-500').replace('-400', '-400');

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">THC</span>
        <span className={`text-xs font-bold ${color}`}>{displayVal}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 w-full relative overflow-hidden">
        <div className={`absolute top-0 h-full rounded-full ${barColor}`}
          style={{ left: `${loPct}%`, width: `${Math.max(rangePct, 5)}%` }} />
      </div>
    </div>
  );
}

// Pill tags for effects/flavors
function PillRow({ items, color }: { items?: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 4).map(item => (
        <span key={item} className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function StrainCard({ strain }: { strain: StrainHit }) {
  const type = typeConfig[strain.strain_type ?? 'unknown'] ?? typeConfig.unknown;

  return (
    <Link
      href={`/strains/${strain.slug}`}
      className={`group flex flex-col gap-3 rounded-2xl border p-4 transition hover:brightness-110 ${type.bg}`}
    >
      {/* Top row: name + type badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{type.icon}</span>
          <p className="text-sm font-bold text-zinc-100 leading-snug truncate">{strain.name}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${type.color} ${type.bg}`}>
          {type.label}
        </span>
      </div>

      {/* Potency row */}
      <div className="flex flex-col gap-2">
        <ThcBar min={strain.thc_min} max={strain.thc_max} color={type.color} />
        {/* Only show CBD if it's notably high (5%+) */}
        {strain.cbd_max != null && strain.cbd_max >= 5 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">CBD</span>
            <span className="text-[10px] font-medium text-sky-400">{strain.cbd_min ?? strain.cbd_max}–{strain.cbd_max}%</span>
            <span className="rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.5 font-medium">High CBD</span>
          </div>
        )}
      </div>

      {/* Effects */}
      {strain.typical_effects && strain.typical_effects.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Effects</span>
          <PillRow items={strain.typical_effects} color="border-zinc-700 text-zinc-400" />
        </div>
      )}

      {/* Flavors */}
      {strain.typical_flavors && strain.typical_flavors.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Flavors</span>
          <PillRow items={strain.typical_flavors} color="border-zinc-700/60 text-zinc-500" />
        </div>
      )}
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-zinc-800" />
          <div className="h-4 w-28 rounded bg-zinc-800" />
        </div>
        <div className="h-4 w-14 rounded-full bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded bg-zinc-800" />
          <div className="h-1.5 w-full rounded-full bg-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded bg-zinc-800" />
          <div className="h-1.5 w-full rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-12 rounded bg-zinc-800" />
        <div className="flex gap-1">
          {[40, 52, 36, 48].map(w => (
            <div key={w} className={`h-4 w-${w === 40 ? '10' : w === 52 ? '14' : w === 36 ? '9' : '12'} rounded-full bg-zinc-800`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StrainsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<StrainHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/strain-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), page: 0, take: 20 }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInputVal(q);
      search(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    setQuery(q);
    setResults([]);
    router.replace(`/strains?q=${encodeURIComponent(q)}`);
    search(q);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Strain Library</h1>
        <p className="mt-1 text-sm text-zinc-500">Search any cannabis strain for effects, potency, and flavors.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="e.g. GMO, Diesel, Blue Dream..."
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* Results count */}
      {!loading && query && results.length > 0 && (
        <p className="mb-4 text-xs text-zinc-500">
          {total} strain{total !== 1 ? 's' : ''} matching <span className="text-zinc-300">&quot;{query}&quot;</span>
        </p>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.map(s => <StrainCard key={s.slug} strain={s} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && results.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm font-medium text-zinc-300">No strains found for &quot;{query}&quot;</p>
          <p className="text-xs text-zinc-500 mt-1">Try a different name or check the spelling.</p>
        </div>
      )}

      {/* Initial empty state */}
      {!loading && !query && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <div className="text-3xl mb-2">🌿</div>
          <p className="text-sm text-zinc-400">Type a strain name above to search.</p>
        </div>
      )}
    </div>
  );
}

export default function StrainsPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl px-4 py-8 text-zinc-500 text-sm">Loading...</div>}>
      <StrainsInner />
    </Suspense>
  );
}
