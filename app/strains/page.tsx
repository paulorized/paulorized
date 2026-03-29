'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StrainHit {
  slug: string;
  name: string;
  strain_type: string | null;
  thc_min: number | null;
  thc_max: number | null;
  nugshot_url: string | null;
}

const typeBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

function StrainCard({ strain }: { strain: StrainHit }) {
  const badge = typeBadge[strain.strain_type ?? 'unknown'] ?? typeBadge.unknown;
  const thc = strain.thc_min != null && strain.thc_max != null
    ? strain.thc_min === strain.thc_max ? `${strain.thc_min}%` : `${strain.thc_min}–${strain.thc_max}%`
    : strain.thc_max != null ? `${strain.thc_max}%` : null;

  return (
    <Link
      href={`/strains/${strain.slug}`}
      className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-emerald-500/40 hover:bg-zinc-900 transition"
    >
      {/* Nugshot */}
      <div className="aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
        {strain.nugshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={strain.nugshot_url}
            alt={strain.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl opacity-30">🌿</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">{strain.name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {strain.strain_type && strain.strain_type !== 'unknown' && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badge}`}>
              {strain.strain_type}
            </span>
          )}
          {thc && (
            <span className="text-xs text-emerald-500 font-medium">THC {thc}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function StrainsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<StrainHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) return;
    if (p === 0) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch('/api/strain-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), page: p, take: 20 }),
      });
      const data = await res.json();
      if (append) {
        setResults(prev => [...prev, ...(data.results ?? [])]);
      } else {
        setResults(data.results ?? []);
      }
      setTotal(data.total ?? 0);
      setHasMore(data.has_more ?? false);
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial search from URL param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInputVal(q);
      search(q, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        search(query, page + 1, true);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, page, query, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputVal.trim();
    if (!q) return;
    setQuery(q);
    setResults([]);
    setPage(0);
    router.replace(`/strains?q=${encodeURIComponent(q)}`);
    search(q, 0);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Strain Library</h1>
        <p className="mt-1 text-sm text-zinc-500">Search thousands of real cannabis strains.</p>
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

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden animate-pulse">
              <div className="aspect-square bg-zinc-800" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {results.map(s => <StrainCard key={s.slug} strain={s} />)}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-16 flex items-center justify-center">
        {loadingMore && <div className="text-xs text-zinc-600">Loading more...</div>}
      </div>}

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
          <p className="text-sm text-zinc-400">Type a strain name above to search the library.</p>
        </div>
      )}
    </div>
  );
}

export default function StrainsPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-4xl px-4 py-8 text-zinc-500 text-sm">Loading...</div>}>
      <StrainsInner />
    </Suspense>
  );
}
