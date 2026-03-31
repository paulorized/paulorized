'use client';

import { useState } from 'react';

export function WeightWidget({ totalGrams }: { totalGrams: number }) {
  const [comparison, setComparison] = useState<string>('');
  const [item, setItem] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fetchComparison = async () => {
    setLoading(true);
    setComparison('');
    setItem('');
    try {
      const res = await fetch('/api/weight-fun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grams: totalGrams }),
      });
      const data = await res.json();
      setComparison(data.comparison ?? '');
      setItem(data.item ?? '');
      setRevealed(true);
    } catch {}
    finally { setLoading(false); }
  };

  if (totalGrams <= 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">Total Weight Logged</p>
          <p className="text-3xl font-bold text-zinc-100">
            {totalGrams >= 1000
              ? (totalGrams / 1000).toFixed(2) + ' kg'
              : totalGrams.toFixed(1) + 'g'}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">across all your logs</p>
        </div>
        <span className="text-3xl">🌿</span>
      </div>

      {revealed && comparison ? (
        <div className="mt-4 rounded-xl bg-zinc-900/60 px-4 py-3">
          <p className="text-sm text-zinc-300 leading-relaxed">{comparison}</p>
          <button
            type="button"
            onClick={fetchComparison}
            disabled={loading}
            className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
          >
            {loading ? 'thinking...' : '↺ Try another'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={fetchComparison}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-emerald-500/20 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
        >
          {loading ? '🤔 thinking...' : '✨ What does this weigh as much as?'}
        </button>
      )}
    </div>
  );
}
