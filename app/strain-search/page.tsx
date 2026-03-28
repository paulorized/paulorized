'use client';

import { useState, useRef, useEffect } from 'react';

interface StrainResult {
  strain_name: string;
  strain_type: 'indica' | 'sativa' | 'hybrid' | 'unknown';
  strain_bio: string;
  typical_effects: string[];
  typical_flavors: string[];
  thc_min: number | null;
  thc_max: number | null;
  cbd_min: number | null;
  cbd_max: number | null;
  best_for: string;
  also_known_as: string[];
  confidence: number;
  not_found?: boolean;
  message?: string;
}

const strainTypeBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

const RECENT_KEY = 'strain_search_recent';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}

function saveRecent(query: string) {
  try {
    const existing = getRecent().filter(q => q.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...existing].slice(0, 8)));
  } catch {}
}

export default function StrainSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StrainResult | null>(null);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setRecent(getRecent()); }, []);

  const doSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/strain-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setResult(data.result);
      if (!data.result?.not_found) {
        saveRecent(trimmed);
        setRecent(getRecent());
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const thcRange = (min: number | null, max: number | null) => {
    if (min == null && max == null) return null;
    if (min != null && max != null) return `${min}–${max}%`;
    return `${min ?? max}%`;
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Strain Search</h1>
        <p className="mt-1 text-sm text-zinc-500">Look up any cannabis strain — type a name and search.</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Blue Dream, OG Kush, Gelato..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
          {query && (
            <button type="button"
              onClick={() => { setQuery(''); setResult(null); setError(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
              ✕
            </button>
          )}
        </div>
        <button type="submit" disabled={loading || !query.trim()}
          className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50">
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 animate-pulse">
          <div className="h-5 w-1/3 rounded-lg bg-zinc-800" />
          <div className="h-3 w-full rounded-lg bg-zinc-800" />
          <div className="h-3 w-4/5 rounded-lg bg-zinc-800" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-6 w-16 rounded-full bg-zinc-800" />)}
          </div>
        </div>
      )}

      {/* Not found */}
      {result?.not_found && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="text-sm font-medium text-zinc-300">Strain not found</p>
          <p className="text-xs text-zinc-500">{result.message ?? "We couldn't find info on that strain. Try a different name."}</p>
        </div>
      )}

      {/* Result card */}
      {result && !result.not_found && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800">
          {/* Header */}
          <div className="px-6 py-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{result.strain_name}</h2>
              {result.also_known_as?.length > 0 && (
                <p className="mt-0.5 text-xs text-zinc-600">Also known as: {result.also_known_as.join(', ')}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${strainTypeBadge[result.strain_type] ?? strainTypeBadge.unknown}`}>
              {result.strain_type}
            </span>
          </div>

          {/* Bio */}
          {result.strain_bio && (
            <div className="px-6 py-4">
              <p className="text-sm text-zinc-400 leading-relaxed">{result.strain_bio}</p>
            </div>
          )}

          {/* Potency */}
          {(thcRange(result.thc_min, result.thc_max) || thcRange(result.cbd_min, result.cbd_max)) && (
            <div className="px-6 py-4 flex gap-3 flex-wrap">
              {thcRange(result.thc_min, result.thc_max) && (
                <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  THC {thcRange(result.thc_min, result.thc_max)}
                </span>
              )}
              {thcRange(result.cbd_min, result.cbd_max) && (
                <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-sky-400">
                  CBD {thcRange(result.cbd_min, result.cbd_max)}
                </span>
              )}
              <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-500">~ estimated avg</span>
            </div>
          )}

          {/* Effects */}
          {result.typical_effects?.length > 0 && (
            <div className="px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Typical Effects</p>
              <div className="flex flex-wrap gap-2">
                {result.typical_effects.map(e => (
                  <span key={e} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{e}</span>
                ))}
              </div>
            </div>
          )}

          {/* Flavors */}
          {result.typical_flavors?.length > 0 && (
            <div className="px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Flavors</p>
              <div className="flex flex-wrap gap-2">
                {result.typical_flavors.map(f => (
                  <span key={f} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Best for */}
          {result.best_for && (
            <div className="px-6 py-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Best For</p>
              <p className="text-sm text-zinc-400">{result.best_for}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent searches */}
      {!result && !loading && recent.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recent.map(q => (
              <button key={q} type="button"
                onClick={() => { setQuery(q); doSearch(q); }}
                className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}