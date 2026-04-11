'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewForm } from './review-form';
import { NugShot } from './nug-shot';

type Terpene = { name: string; percent: number | null; source?: string };

type ProductLog = {
  id: string;
  brand: string;
  product_type: string;
  strain_name: string;
  strain_type: string | null;
  strain_bio: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  thc_mg: number | null;
  cbd_mg: number | null;
  mg_per_piece: number | null;
  weight: string;
  dispensary_name: string | null;
  created_at: string;
  headshot_url: string | null;
  has_review?: boolean;
  terpenes?: Terpene[] | null;
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

// Terpene metadata — color, emoji, effect hint, description, found-in
const TERP_META: Record<string, {
  color: string; bg: string; border: string; emoji: string;
  effect: string; description: string; foundIn: string;
}> = {
  myrcene: {
    color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30', emoji: '🥭',
    effect: 'Relaxing · Earthy',
    description: 'The most abundant terpene in cannabis. Promotes sedation and may enhance cannabinoid absorption — often credited with the classic "couch-lock" effect.',
    foundIn: 'Mangoes, hops, lemongrass, thyme',
  },
  limonene: {
    color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', emoji: '🍋',
    effect: 'Uplifting · Citrus',
    description: 'A bright citrusy terpene associated with elevated mood and stress relief. May have anti-anxiety properties and is often found in sativa-leaning strains.',
    foundIn: 'Citrus fruits, juniper, peppermint, rosemary',
  },
  caryophyllene: {
    color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30', emoji: '🌶️',
    effect: 'Calming · Spicy',
    description: 'Unique among terpenes — it binds directly to CB2 receptors like a cannabinoid. Known for anti-inflammatory and analgesic effects with a peppery aroma.',
    foundIn: 'Black pepper, cloves, cinnamon, basil',
  },
  linalool: {
    color: 'text-purple-300', bg: 'bg-purple-500/15', border: 'border-purple-500/30', emoji: '💜',
    effect: 'Soothing · Floral',
    description: 'Best known from lavender, linalool has calming, anti-anxiety, and sleep-promoting properties. Often used to counteract THC-induced anxiety.',
    foundIn: 'Lavender, mint, coriander, birch trees',
  },
  pinene: {
    color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', emoji: '🌲',
    effect: 'Alert · Pine',
    description: 'The most common terpene in nature. May improve alertness and memory retention, and can act as a bronchodilator. Comes in alpha and beta forms.',
    foundIn: 'Pine trees, rosemary, basil, dill, parsley',
  },
  terpinolene: {
    color: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-500/30', emoji: '🍏',
    effect: 'Energetic · Fresh',
    description: 'A multifaceted terpene with floral, herbal, and piney notes. Associated with uplifting effects and commonly found in Jack Herer and Ghost Train Haze.',
    foundIn: 'Apples, cumin, lilac, tea tree',
  },
  ocimene: {
    color: 'text-teal-300', bg: 'bg-teal-500/15', border: 'border-teal-500/30', emoji: '🌿',
    effect: 'Uplifting · Sweet',
    description: 'A sweet, herbal, and woody terpene with potential antiviral and antifungal properties. Often found in strains like Strawberry Cough and Clementine.',
    foundIn: 'Mint, parsley, orchids, mangoes, basil',
  },
  humulene: {
    color: 'text-zinc-300', bg: 'bg-zinc-700/40', border: 'border-zinc-600', emoji: '🍺',
    effect: 'Appetite suppressing · Earthy',
    description: 'Shares its distinctive hoppy aroma with beer. May suppress appetite and has anti-inflammatory properties — one of the few terpenes that can reduce hunger.',
    foundIn: 'Hops, cloves, ginger, coriander',
  },
  bisabolol: {
    color: 'text-pink-300', bg: 'bg-pink-500/15', border: 'border-pink-500/30', emoji: '🌸',
    effect: 'Gentle · Floral',
    description: 'A delicate floral terpene prized in skincare for its anti-irritant properties. In cannabis it contributes soothing, anti-inflammatory effects with a subtle chamomile scent.',
    foundIn: 'German chamomile, candeia tree',
  },
  nerolidol: {
    color: 'text-lime-300', bg: 'bg-lime-500/15', border: 'border-lime-500/30', emoji: '🌙',
    effect: 'Sedating · Woody',
    description: 'A secondary terpene with a woody, floral aroma. Known for strong sedative and anti-parasitic properties. Found in strains ideal for sleep and relaxation.',
    foundIn: 'Jasmine, lemongrass, ginger, niaouli',
  },
};

function getTerpMeta(name: string) {
  return TERP_META[name.toLowerCase()] ?? {
    color: 'text-zinc-400', bg: 'bg-zinc-800/60', border: 'border-zinc-700', emoji: '🧪',
    effect: '', description: 'A lesser-documented terpene contributing to this strain\'s unique aroma and effect profile.', foundIn: 'Various plants',
  };
}

function TerpenePanel({ terpenes }: { terpenes: Terpene[] }) {
  const [activeTerp, setActiveTerp] = useState<string | null>(null);
  if (!terpenes || terpenes.length === 0) return null;
  const isEstimated = terpenes.some(t => t.source === 'ai_estimated');
  const hasPercents = terpenes.some(t => t.percent != null && t.percent > 0);
  const maxPct = hasPercents ? Math.max(...terpenes.map(t => t.percent ?? 0)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Terpenes</p>
        {isEstimated && (
          <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-500">
            AI estimated
          </span>
        )}
      </div>
      <div className="space-y-2">
        {terpenes.map((t) => {
          const m = getTerpMeta(t.name);
          const pctWidth = hasPercents && t.percent != null ? Math.round((t.percent / maxPct) * 100) : 0;
          const isActive = activeTerp === t.name;
          return (
            <div key={t.name}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveTerp(isActive ? null : t.name); }}
                className={`w-full text-left rounded-xl border ${m.border} ${m.bg} px-3 py-2.5 transition active:opacity-75`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none shrink-0">{m.emoji}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold capitalize ${m.color}`}>{t.name}</p>
                      {m.effect && <p className="text-[11px] text-zinc-500 mt-0.5">{m.effect}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.percent != null && (
                      <span className={`text-sm font-bold ${m.color}`}>{t.percent}%</span>
                    )}
                    <span className={`text-[11px] text-zinc-600 transition-transform duration-200 inline-block ${isActive ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </div>
                {hasPercents && t.percent != null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/60">
                    <div
                      className={`h-full rounded-full transition-all ${m.bg.replace('/15', '/60').replace('bg-', 'bg-')}`}
                      style={{ width: `${pctWidth}%`, backgroundColor: undefined }}
                    />
                  </div>
                )}
              </button>
              {isActive && (
                <div className={`mt-1 rounded-xl border ${m.border} bg-zinc-950/80 px-3 py-3 space-y-1.5`}>
                  <p className="text-xs text-zinc-300 leading-relaxed">{m.description}</p>
                  <p className="text-[11px] text-zinc-500">
                    <span className="text-zinc-600">Found in · </span>{m.foundIn}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryRow({ log, scanCount = 1 }: { log: ProductLog; scanCount?: number }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicated, setDuplicated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bio, setBio] = useState<string | null>(log.strain_bio);
  const [refreshingBio, setRefreshingBio] = useState(false);
  const [bioError, setBioError] = useState('');

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

  const handleRefreshBio = async () => {
    if (refreshingBio) return;
    setRefreshingBio(true);
    setBioError('');
    try {
      const res = await fetch('/api/refresh-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_log_id: log.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBioError(data.error ?? 'Could not refresh bio.');
      } else {
        setBio(data.strain_bio);
      }
    } catch {
      setBioError('Network error.');
    } finally {
      setRefreshingBio(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      {/* Review tick — top-right corner */}
      <div
        className="absolute top-0 right-0 z-10"
        title={log.has_review ? 'Reviewed' : 'No review yet'}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M28 0 L28 28 L0 0 Z" fill={log.has_review ? 'rgba(253,224,71,0.15)' : 'rgba(63,63,70,0.3)'} />
          <polyline
            points="11,6 16,11 22,4"
            stroke={log.has_review ? '#fde047' : '#52525b'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
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
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating || duplicated}
              className={duplicated ? 'rounded-lg px-3 py-1 text-xs font-semibold transition bg-emerald-500/20 text-emerald-400' : 'rounded-lg px-3 py-1 text-xs font-semibold transition bg-emerald-400 text-zinc-950 hover:bg-emerald-300 active:scale-95'}
            >
              {duplicated ? '&#10003; Logged' : duplicating ? '...' : '+ Log'}
            </button>
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
          {(() => {
            const t = (log.product_type ?? '').toLowerCase();
            const showShot =
              t.includes('flower') || t.includes('preroll') || t.includes('pre-roll') ||
              t.includes('pre roll') || t.includes('joint') || t.includes('concentrate') ||
              t.includes('wax') || t.includes('shatter') || t.includes('rosin') ||
              t.includes('resin') || t.includes('hash') || t.includes('dab');
            return showShot ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Nugg-Shot</p>
                <NugShot logId={log.id} initialUrl={log.headshot_url} />
              </div>
            ) : null;
          })()}

          {log.strain_name && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Strain Bio</p>
                {bio ? (
                  <button
                    type="button"
                    onClick={handleRefreshBio}
                    disabled={refreshingBio}
                    aria-label="Refresh bio"
                    title="Refresh bio"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-800 hover:text-emerald-400 disabled:opacity-50"
                  >
                    <span className={refreshingBio ? 'inline-block animate-spin text-xs' : 'text-xs'}>↻</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRefreshBio}
                    disabled={refreshingBio}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-50"
                  >
                    {refreshingBio ? 'Fetching…' : '✨ Fetch bio'}
                  </button>
                )}
              </div>
              {bio ? (
                <p className="text-sm leading-relaxed text-zinc-300 italic">{bio}</p>
              ) : (
                <p className="text-sm text-zinc-500 italic">No bio yet — click &ldquo;Fetch bio&rdquo; to pull one from Leafly + Claude.</p>
              )}
              {bioError && <p className="mt-2 text-xs text-rose-400">{bioError}</p>}
            </div>
          )}

          {log.terpenes && log.terpenes.length > 0 && (
            <TerpenePanel terpenes={log.terpenes} />
          )}

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Your Review</p>
            <ReviewForm productLogId={log.id} productType={log.product_type} />
          </div>
        </div>
      )}
    </div>
  );
}
