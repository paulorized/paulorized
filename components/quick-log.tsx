'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TopProduct = {
  count: number;
  brand: string;
  product_type: string;
  strain_name: string;
  strain_type: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  thc_mg: number | null;
  cbd_mg: number | null;
  mg_per_piece: number | null;
  weight: string;
  dispensary_name: string | null;
  strain_bio: string | null;
};

const strainBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

export function QuickLog() {
  const router = useRouter();
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<number | null>(null);
  const [logged, setLogged] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/top-scans')
      .then(r => r.json())
      .then(d => setProducts(d.top5 ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLog = async (product: TopProduct, index: number) => {
    setLogging(index);
    try {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });
      if (res.ok) {
        setLogged(index);
        setTimeout(() => { setLogged(null); router.push('/history'); }, 1200);
      }
    } catch {}
    finally { setLogging(null); }
  };

  if (loading || products.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Quick Log</p>
        <p className="text-xs text-zinc-600">Your top picks</p>
      </div>
      <div className="flex flex-col gap-2">
        {products.map((p, i) => {
          const badge = strainBadge[p.strain_type ?? 'unknown'] ?? strainBadge.unknown;
          const potency = p.thc_percent != null ? `${p.thc_percent}% THC` : p.thc_mg != null ? `${p.thc_mg}mg` : null;
          const isLogging = logging === i;
          const isDone = logged === i;
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-100 truncate">{p.brand || p.strain_name || 'Unknown'}</span>
                  {p.strain_type && (
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badge}`}>
                      {p.strain_type}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
                  {p.product_type && <span className="capitalize">{p.product_type}</span>}
                  {p.strain_name && p.brand && <><span>·</span><span className="italic">{p.strain_name}</span></>}
                  {potency && <><span>·</span><span className="text-emerald-500">{potency}</span></>}
                  <span className="text-zinc-700">· {p.count}x</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLog(p, i)}
                disabled={isLogging || isDone}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300 active:scale-95 disabled:opacity-50'
                }`}
              >
                {isDone ? '✓ Logged' : isLogging ? '...' : '+ Log'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}