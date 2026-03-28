'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HistoryRow } from '@/components/history-row';

type ProductLog = {
  id: string;
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
  created_at: string;
};

export function HistoryClient({ logs }: { logs: ProductLog[] }) {
  const [filter, setFilter] = useState('all');

  const productTypes = useMemo(() => {
    const types = new Set(logs.map(l => (l.product_type ?? '').toLowerCase()).filter(Boolean));
    return Array.from(types).sort();
  }, [logs]);

  const filtered = filter === 'all' ? logs : logs.filter(l => (l.product_type ?? '').toLowerCase() === filter);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">My Log</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {filter !== 'all' && <span className="text-zinc-600"> (filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {productTypes.length > 0 && (
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="all">All types</option>
              {productTypes.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          )}
          <Link
            href="/"
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95"
          >
            + Scan
          </Link>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 py-20 text-center">
          <div className="mb-3 text-4xl">🌿</div>
          <p className="font-medium text-zinc-300">Nothing scanned yet</p>
          <p className="mt-1 text-sm text-zinc-500">Scan your first product to start tracking</p>
          <Link href="/" className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
            Scan a product
          </Link>
        </div>
      )}

      {filtered.length === 0 && logs.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 py-12 text-center">
          <p className="text-sm text-zinc-500">No {filter} entries yet.</p>
          <button onClick={() => setFilter('all')} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition">Clear filter</button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((log) => (
            <HistoryRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}