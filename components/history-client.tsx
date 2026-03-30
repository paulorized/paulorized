'use client';

import { useState, useMemo, useEffect } from 'react';
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
  headshot_url: string | null;
};

type SortKey = 'date_desc' | 'date_asc' | 'thc_desc' | 'thc_asc' | 'name_asc';

export function HistoryClient({ logs }: { logs: ProductLog[] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date_desc');

  useEffect(() => { document.title = 'My Log — CannaBaseAI'; }, []);

  const productTypes = useMemo(() => {
    const types = new Set(logs.map(l => (l.product_type ?? '').toLowerCase()).filter(Boolean));
    return Array.from(types).sort();
  }, [logs]);

  const scanCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const key = ((log.brand ?? '') + '__' + (log.strain_name ?? '') + '__' + (log.product_type ?? '')).toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [logs]);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? logs : logs.filter(l => (l.product_type ?? '').toLowerCase() === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l =>
        (l.strain_name ?? '').toLowerCase().includes(q) ||
        (l.brand ?? '').toLowerCase().includes(q) ||
        (l.dispensary_name ?? '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case 'date_asc':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'thc_desc':  return (b.thc_percent ?? 0) - (a.thc_percent ?? 0);
        case 'thc_asc':   return (a.thc_percent ?? 0) - (b.thc_percent ?? 0);
        case 'name_asc':  return (a.strain_name ?? '').localeCompare(b.strain_name ?? '');
        default:          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [logs, filter, search, sort]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">My Log</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            {(filter !== 'all' || search.trim()) && <span className="text-zinc-600"> (filtered)</span>}
          </p>
        </div>
        <Link href="/" className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">
          + Scan
        </Link>
      </div>

      {/* Search + filters row */}
      {logs.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search strain, brand, dispensary…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            {productTypes.length > 0 && (
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none">
                <option value="all">All types</option>
                {productTypes.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            )}
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:border-emerald-500/50 focus:outline-none">
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="thc_desc">Highest THC</option>
              <option value="thc_asc">Lowest THC</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </div>
        </div>
      )}

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
          <p className="text-sm text-zinc-500">No results found.</p>
          <button onClick={() => { setFilter('all'); setSearch(''); }}
            className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition">
            Clear filters
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((log) => (
            <HistoryRow key={log.id} log={log}
              scanCount={scanCounts.get(((log.brand ?? '') + '__' + (log.strain_name ?? '') + '__' + (log.product_type ?? '')).toLowerCase()) ?? 1}
            />
          ))}
        </div>
      )}
    </main>
  );
}
