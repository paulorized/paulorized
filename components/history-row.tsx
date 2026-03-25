'use client';

import { useState } from 'react';
import { ReviewForm } from './review-form';

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

const strainTypeBadge: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

function thcDisplay(log: ProductLog): string {
  if (log.thc_percent != null) return `${log.thc_percent}% THC`;
  if (log.thc_mg != null) {
    const perPiece = log.mg_per_piece != null ? ` · ${log.mg_per_piece}mg/pc` : '';
    return `${log.thc_mg}mg THC${perPiece}`;
  }
  return null as unknown as string;
}

function cbdDisplay(log: ProductLog): string | null {
  if (log.cbd_percent != null) return `${log.cbd_percent}% CBD`;
  if (log.cbd_mg != null) return `${log.cbd_mg}mg CBD`;
  return null;
}

export function HistoryRow({ log }: { log: ProductLog }) {
  const [expanded, setExpanded] = useState(false);

  const badgeClass = strainTypeBadge[log.strain_type ?? 'unknown'] ?? strainTypeBadge.unknown;
  const date = new Date(log.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const thc = thcDisplay(log);
  const cbd = cbdDisplay(log);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      {/* Card main area */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-4 transition hover:bg-zinc-800/50 active:bg-zinc-800"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: brand + product info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-100 truncate">{log.brand || '—'}</span>
              {log.strain_type && (
                <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}>
                  {log.strain_type}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-zinc-400">
              {log.product_type && <span>{log.product_type}</span>}
              {log.weight && <span className="text-zinc-600">·</span>}
              {log.weight && <span>{log.weight}</span>}
              {log.strain_name && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="italic text-zinc-400">{log.strain_name}</span>
                </>
              )}
            </div>

            {/* Potency row */}
            {(thc || cbd) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {thc && (
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    {thc}
                  </span>
                )}
                {cbd && (
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-sky-400">
                    {cbd}
                  </span>
                )}
              </div>
            )}

            {/* Dispensary */}
            {log.dispensary_name && (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(log.dispensary_name + ' dispensary')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition"
              >
                📍 {log.dispensary_name}
              </a>
            )}
          </div>

          {/* Right: date + chevron */}
          <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
            <span className="text-xs text-zinc-500">{date}</span>
            <span className="text-xs text-zinc-600">{expanded ? '▴' : '▾'}</span>
          </div>
        </div>
      </button>

      {/* Expanded review panel */}
      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Your Review</p>
          <ReviewForm productLogId={log.id} productType={log.product_type} />
        </div>
      )}
    </div>
  );
}
