'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewForm } from './review-form';
import { NugShot } from './nug-shot';

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

export function HistoryRow({ log, scanCount = 1 }: { log: ProductLog; scanCount?: number }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicated, setDuplicated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const badgeClass = strainTypeBadge[log.strain_type ?? 'unknown'] ?? strainTypeBadge.unknown;
  const date = new Date(log.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const thc = thcDisplay(log);
  const cbd = cbdDisplay(log);

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDuplicating(true);
    try {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_log_id: log.id }),
      });
      if (res.ok) {
        setDuplicated(true);
        setTimeout(() => { setDuplicated(false); router.refresh(); }, 1500);
      }
    } catch {}
    finally { setDuplicating(false); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/delete-log?id=${log.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch {}
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-4 transition hover:bg-zinc-800/50 active:bg-zinc-800"
      >
        <div className="flex items-start justify-between gap-3">
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
              {log.weight && <><span className="text-zinc-600">·</span><span>{log.weight}</span></>}
              {log.strain_name && (
                <><span className="text-zinc-600">·</span><span className="italic text-zinc-400">{log.strain_name}</span></>
              )}
            </div>
            {(thc || cbd) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {thc && <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-emerald-400">{thc}</span>}
                {cbd && <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-sky-400">{cbd}</span>}
              </div>
            )}
            {log.dispensary_name && (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(log.dispensary_name + ' dispensary')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> {log.dispensary_name}
              </a>
            )}
          </div>

          {/* Right column: date, actions */}
          <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
            <span className="text-xs text-zinc-500">{date}</span>
            {scanCount > 1 && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{scanCount}x</span>
            )}

            {/* Log again */}
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating || duplicated}
              className={duplicated ? 'rounded-lg px-3 py-1 text-xs font-semibold transition bg-emerald-500/20 text-emerald-400' : 'rounded-lg px-3 py-1 text-xs font-semibold transition bg-emerald-400 text-zinc-950 hover:bg-emerald-300 active:scale-95'}
            >
              {duplicated ? '&#10003; Logged' : duplicating ? '...' : '+ Log'}
            </button>

            {/* Delete with inline confirm */}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-800 hover:text-rose-400 transition"
              >
                Remove
              </button>
            ) : (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-zinc-500">Sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/30 transition"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-700 transition"
                >
                  No
                </button>
              </div>
            )}

            <span className="text-xs text-zinc-600">{expanded ? '▴' : '▾'}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-5 space-y-6">
          {/* NugShot — only for flower / concentrate / wax types */}
          {(() => {
            const t = (log.product_type ?? '').toLowerCase();
            const showNugShot =
              t.includes('flower') ||
              t.includes('concentrate') ||
              t.includes('wax') ||
              t.includes('shatter') ||
              t.includes('rosin') ||
              t.includes('resin') ||
              t.includes('hash') ||
              t.includes('dab');
            return showNugShot ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Nugg-Shot</p>
                <NugShot logId={log.id} initialUrl={log.headshot_url} />
              </div>
            ) : null;
          })()}

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Your Review</p>
            <ReviewForm productLogId={log.id} productType={log.product_type} />
          </div>
        </div>
      )}
    </div>
  );
}
