'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StrainResult {
  strain_name: string;
  strain_type: string;
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
  source?: 'leafly' | 'ai' | 'index';
  nugshot_url?: string | null;
  leafly_url?: string | null;
}

const strainTypeBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

export function StrainDetailClient({ result: initialResult, slug }: { result: StrainResult | null; slug?: string }) {
  const [result, setResult] = useState<StrainResult | null>(initialResult);
  const [loading, setLoading] = useState(!initialResult && !!slug);

  useEffect(() => {
    if (initialResult || !slug) return;
    // AI fallback for strains not in the DB index
    async function load() {
      setLoading(true);
      try {
        const idxRes = await fetch('/api/strain-by-slug', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        if (idxRes.ok) {
          const d = await idxRes.json();
          if (d.result) { setResult(d.result); setLoading(false); return; }
        }
        const name = (slug ?? '').replace(/-/g, ' ');
        const searchRes = await fetch('/api/strain-search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: name }),
        });
        const sd = await searchRes.json();
        if (sd.result && !sd.result.not_found) setResult(sd.result);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, initialResult]);
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const toggleWishlist = async () => {
    if (wishlistLoading || !result) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await fetch('/api/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strain_name: result.strain_name }) });
        setWishlisted(false);
      } else {
        await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ strain_name: result.strain_name, strain_type: result.strain_type }) });
        setWishlisted(true);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const thcRange = (min: number | null, max: number | null) => {
    if (min == null && max == null) return null;
    if (min != null && max != null && min !== max) return `${min}\u2013${max}%`;
    return `${min ?? max}%`;
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
        \u2190 Back to results
      </button>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800">
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{result.strain_name}</h1>
            {result.also_known_as?.length > 0 && (
              <p className="mt-0.5 text-xs text-zinc-600">Also known as: {result.also_known_as.join(', ')}</p>
            )}
            <div className="mt-1.5">
              {result.source === 'leafly' || result.source === 'index' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified by Leafly
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  AI Estimate \u2014 may not be exact
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${strainTypeBadge[result.strain_type] ?? strainTypeBadge.unknown}`}>
              {result.strain_type}
            </span>
            {result.nugshot_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.nugshot_url} alt={result.strain_name} className="w-20 h-20 rounded-xl object-cover border border-zinc-700" />
            )}
          </div>
        </div>

        {result.strain_bio && (
          <div className="px-6 py-4">
            <p className="text-sm text-zinc-400 leading-relaxed">{result.strain_bio}</p>
          </div>
        )}

        {(thcRange(result.thc_min, result.thc_max) || thcRange(result.cbd_min, result.cbd_max)) && (
          <div className="px-6 py-4 flex gap-3 flex-wrap">
            {thcRange(result.thc_min, result.thc_max) && (
              <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-emerald-400">THC {thcRange(result.thc_min, result.thc_max)}</span>
            )}
            {thcRange(result.cbd_min, result.cbd_max) && (
              <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-sky-400">CBD {thcRange(result.cbd_min, result.cbd_max)}</span>
            )}
          </div>
        )}

        {result.typical_effects?.length > 0 && (
          <div className="px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Effects</p>
            <div className="flex flex-wrap gap-2">
              {result.typical_effects.map(e => (
                <span key={e} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{e}</span>
              ))}
            </div>
          </div>
        )}

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

        {result.best_for && (
          <div className="px-6 py-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">Best For</p>
            <p className="text-sm text-zinc-400">{result.best_for}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2 flex-wrap">
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${
              wishlisted
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {wishlistLoading ? 'Saving...' : wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>
          <Link href="/wishlist" className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-400 transition hover:bg-purple-500/20">
            View Wishlist
          </Link>
          {result.leafly_url && (
            <a href={result.leafly_url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20">
              View on Leafly \u2197
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
