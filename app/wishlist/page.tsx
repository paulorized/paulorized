'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WishlistItem {
  id: string;
  strain_name: string;
  strain_type: string | null;
  added_at: string;
}

const typeColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  indica:  { bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
  sativa:  { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
  hybrid:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300', glow: 'shadow-emerald-500/20' },
  unknown: { bg: 'bg-zinc-800/60', border: 'border-zinc-600/40', text: 'text-zinc-400', glow: 'shadow-zinc-500/10' },
};

const typeIcons: Record<string, string> = {
  indica: '🌙',
  sativa: '☀️',
  hybrid: '⚡',
  unknown: '❓',
};

function StrainCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: string, name: string) => void }) {
  const type = (item.strain_type ?? 'unknown').toLowerCase();
  const colors = typeColors[type] ?? typeColors.unknown;
  const icon = typeIcons[type] ?? '❓';
  const num = parseInt(item.id.replace(/-/g, '').slice(0, 4), 16) % 999 + 1;
  const dexNum = String(num).padStart(3, '0');

  return (
    <div className={`relative rounded-2xl border ${colors.border} ${colors.bg} shadow-lg p-4 flex flex-col gap-3 transition hover:scale-[1.02]`}>
      <span className="absolute top-3 right-3 text-xs font-mono text-zinc-600">#{dexNum}</span>
      <div className={`w-14 h-14 rounded-full border-2 ${colors.border} flex items-center justify-center text-2xl bg-zinc-900/60 mx-auto shadow-inner`}>
        {icon}
      </div>
      <div className="text-center">
        <p className="font-bold text-zinc-100 text-sm leading-tight">{item.strain_name}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${colors.text} ${colors.bg} border ${colors.border}`}>
          {type}
        </span>
      </div>
      <p className="text-center text-xs text-zinc-600">
        Added {new Date(item.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
      <div className="flex gap-2 mt-1">
        <Link
          href={'/strain-search?q=' + encodeURIComponent(item.strain_name)}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 text-center text-xs text-zinc-300 transition hover:bg-zinc-700"
        >
          View
        </Link>
        <button
          onClick={() => onRemove(item.id, item.strain_name)}
          className="flex-1 rounded-lg border border-rose-500/30 bg-rose-500/10 py-1.5 text-center text-xs text-rose-400 transition hover:bg-rose-500/20"
        >
          Release
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Wishlist — CannaBaseAI'; }, []);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/wishlist', { credentials: 'include' })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? 'Failed to load wishlist');
        } else {
          setItems(data.items ?? []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Network error: ' + err.message);
        setLoading(false);
      });
  }, []);

  const handleRemove = async (id: string, strain_name: string) => {
    setRemoving(id);
    await fetch('/api/wishlist', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strain_name }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
    setRemoving(null);
  };

  const counts = { indica: 0, sativa: 0, hybrid: 0, unknown: 0 };
  for (const item of items) {
    const t = (item.strain_type ?? 'unknown').toLowerCase();
    if (t in counts) counts[t as keyof typeof counts]++;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📕</span>
          <h1 className="text-2xl font-bold text-zinc-100">Strain Wishlist</h1>
        </div>
        <p className="text-sm text-zinc-500">Strains you want to try. Gotta catch &apos;em all.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-300">Collection Progress</span>
            <span className="text-sm font-bold text-emerald-400">{items.length} strain{items.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-zinc-800">
            {counts.indica > 0 && <div className="bg-purple-500 transition-all" style={{ width: (counts.indica / items.length * 100) + '%' }} />}
            {counts.sativa > 0 && <div className="bg-yellow-400 transition-all" style={{ width: (counts.sativa / items.length * 100) + '%' }} />}
            {counts.hybrid > 0 && <div className="bg-emerald-400 transition-all" style={{ width: (counts.hybrid / items.length * 100) + '%' }} />}
            {counts.unknown > 0 && <div className="bg-zinc-500 transition-all" style={{ width: (counts.unknown / items.length * 100) + '%' }} />}
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {counts.indica > 0 && <span className="text-xs text-purple-400">🌙 {counts.indica} Indica</span>}
            {counts.sativa > 0 && <span className="text-xs text-yellow-400">☀️ {counts.sativa} Sativa</span>}
            {counts.hybrid > 0 && <span className="text-xs text-emerald-400">⚡ {counts.hybrid} Hybrid</span>}
            {counts.unknown > 0 && <span className="text-xs text-zinc-500">❓ {counts.unknown} Unknown</span>}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 animate-pulse h-48" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-3">
          <div className="text-5xl">📖</div>
          <p className="text-base font-semibold text-zinc-300">Your Pokédex is empty</p>
          <p className="text-sm text-zinc-500">Search for a strain and hit <span className="text-amber-400 font-semibold">Add to Wishlist</span> to start your collection.</p>
          <Link href="/strain-search" className="mt-2 inline-block rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
            Search Strains
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className={removing === item.id ? 'opacity-50 pointer-events-none' : ''}>
                <StrainCard item={item} onRemove={handleRemove} />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/strain-search"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-400 transition hover:bg-purple-500/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add More Strains
            </Link>
          </div>
        </>
      )}

    </div>
  );
}
