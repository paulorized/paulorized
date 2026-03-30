'use client';

import { useState, useEffect, useCallback } from 'react';

interface Tier {
  label: string;
  emoji: string;
  color: string;
}

interface FeedItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  tier: Tier;
  brand: string;
  strain_name: string;
  strain_type: string;
  product_type: string;
  thc_percent: number | null;
  rating: number | null;
  notes: string | null;
  effects: string[];
  flavors: string[];
  would_buy_again: boolean | null;
  helpful_count: number;
  i_voted: boolean;
  created_at: string;
  is_mine: boolean;
  nugshot_url: string | null;
  scan_count: number;
}

const DEFAULT_TIER: Tier = { label: 'Seedling', emoji: '🌿', color: 'text-zinc-400' };

const strainColors: Record<string, string> = {
  indica:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

const BUBBLE_COLORS = ['bg-emerald-600','bg-purple-600','bg-yellow-500','bg-sky-600','bg-rose-600','bg-orange-500','bg-teal-600','bg-indigo-600'];

function getBubbleColor(userId: string) {
  if (!userId) return BUBBLE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating || rating < 1) return null;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= rating ? '#f59e0b' : 'none'}
          stroke={i <= rating ? '#f59e0b' : '#52525b'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function FeedCard({ item, onVote, onImageClick, onDelete }: { item: FeedItem; onVote: (id: string, voted: boolean) => void; onImageClick: (url: string) => void; onDelete: (id: string) => void }) {
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localVoted, setLocalVoted] = useState(!!item.i_voted);
  const [localCount, setLocalCount] = useState(item.helpful_count ?? 0);
  const canVote = !!(item.notes?.trim()) && !item.is_mine;
  const tier = item.tier ?? DEFAULT_TIER;
  const bubbleColor = getBubbleColor(item.user_id ?? '');
  const strainType = (item.strain_type ?? 'unknown').toLowerCase();

  const handleVote = async () => {
    if (!canVote || voting) return;
    setVoting(true);
    try {
      const res = await fetch('/api/review-helpful', {
        method: localVoted ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalVoted(!localVoted);
        setLocalCount(data.helpful_count ?? localCount);
        onVote(item.id, !localVoted);
      }
    } catch {}
    setVoting(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar_url} alt={item.username} referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border border-zinc-700" />
          ) : (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${bubbleColor}`}>
              {(item.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 text-sm leading-none" title={tier.label}>{tier.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-zinc-100">{item.username ?? 'Anonymous'}</span>
            <span className="text-xs text-zinc-600">{item.scan_count ?? 0} logs</span>
            <span className="text-xs text-zinc-600 ml-auto shrink-0">{timeAgo(item.created_at)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-200">{item.strain_name || item.brand || 'Unknown'}</span>
            {item.brand && item.strain_name && <span className="text-xs text-zinc-500">{item.brand}</span>}
            {strainType && strainType !== 'unknown' && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${strainColors[strainType] ?? strainColors.unknown}`}>
                {strainType}
              </span>
            )}
            {item.product_type && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 capitalize">{item.product_type}</span>
            )}
            {item.thc_percent && (
              <span className="text-xs text-emerald-500 font-medium">THC {item.thc_percent}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      {(item.rating != null || item.would_buy_again != null) && (
        <div className="px-4 pb-2 flex items-center gap-3">
          <Stars rating={item.rating} />
          {item.would_buy_again != null && (
            <span className={`text-xs font-medium ${item.would_buy_again ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.would_buy_again ? '✓ Would buy again' : '✗ Would not buy again'}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {item.notes?.trim() && (
        <div className="px-4 pb-3">
          <p className="text-sm text-zinc-300 leading-relaxed italic">&ldquo;{item.notes.trim()}&rdquo;</p>
        </div>
      )}

      {/* NugShot */}
      {item.nugshot_url && (
        <div className="px-4 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.nugshot_url}
            alt={`${item.strain_name || 'Product'} nugshot`}
            onClick={() => onImageClick(item.nugshot_url!)}
            className="w-full max-h-64 rounded-xl object-cover border border-zinc-700/60 cursor-zoom-in transition hover:brightness-110"
          />
        </div>
      )}

      {/* Tags */}
      {((item.effects?.length ?? 0) > 0 || (item.flavors?.length ?? 0) > 0) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {(item.effects ?? []).slice(0,5).map(e => (
            <span key={e} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{e}</span>
          ))}
          {(item.flavors ?? []).slice(0,3).map(f => (
            <span key={f} className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{f}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
        <button
          onClick={handleVote}
          disabled={!canVote || voting}
          title={item.is_mine ? 'Your own review' : !item.notes?.trim() ? 'Only reviews with notes can be marked helpful' : localVoted ? 'Remove vote' : 'Mark as helpful'}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition
            ${!canVote
              ? 'text-zinc-600 cursor-default'
              : localVoted
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24"
            fill={localVoted ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          Helpful
          {localCount > 0 && <span className={`ml-0.5 ${localVoted ? 'text-emerald-400' : 'text-zinc-500'}`}>{localCount}</span>}
        </button>
        <span className={`text-xs font-medium ${tier.color}`}>{tier.emoji} {tier.label}</span>
        {item.is_mine && (
          <button
            onClick={async () => {
              if (!window.confirm('Delete your review?')) return;
              setDeleting(true);
              try {
                const res = await fetch('/api/reviews', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ review_id: item.id }),
                });
                if (res.ok) onDelete(item.id);
              } catch {}
              setDeleting(false);
            }}
            disabled={deleting}
            className="text-xs text-zinc-600 italic hover:text-rose-400 transition disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete review'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Community — CannaBaseAI'; }, []);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadFeed = useCallback(async (cursor?: string) => {
    const url = '/api/community-feed' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : '');
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to load');
    return data;
  }, []);

  useEffect(() => {
    loadFeed()
      .then(data => { setFeed(data.feed ?? []); setNextCursor(data.next_cursor ?? null); setLoading(false); })
      .catch(err => { setError(String(err?.message ?? err)); setLoading(false); });
  }, [loadFeed]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await loadFeed(nextCursor);
      setFeed(prev => [...prev, ...(data.feed ?? [])]);
      setNextCursor(data.next_cursor ?? null);
    } catch {}
    setLoadingMore(false);
  };

  const handleVote = useCallback((id: string, voted: boolean) => {
    setFeed(prev => prev.map(item => item.id === id ? { ...item, i_voted: voted } : item));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setFeed(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Community</h1>
        <p className="mt-1 text-sm text-zinc-500">See what others are scanning and smoking. Write reviews to earn helpful votes and level up your rank.</p>
      </div>

      {/* Tier legend */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-2">
        <p className="text-xs text-zinc-600">Your rank is based on helpful votes your reviews receive from the community.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {[
            { emoji: '🌿', label: 'Seedling',   sub: '0+ votes',  color: 'text-zinc-400' },
            { emoji: '🌱', label: 'Grower',      sub: '5+ votes',  color: 'text-lime-400' },
            { emoji: '🍃', label: 'Connoisseur', sub: '20+ votes', color: 'text-emerald-400' },
            { emoji: '🌳', label: 'Legend',      sub: '50+ votes', color: 'text-yellow-400' },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-1.5">
              <span>{t.emoji}</span>
              <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>
              <span className="text-xs text-zinc-600">{t.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-rose-400">{error}</span>
          <button onClick={() => { setError(''); setLoading(true); loadFeed().then(data => { setFeed(data.feed ?? []); setNextCursor(data.next_cursor ?? null); setLoading(false); }).catch(err => { setError(String(err?.message ?? err)); setLoading(false); }); }}
            className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                  <div className="h-3 w-40 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-zinc-800" />
              <div className="h-3 w-4/5 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {!loading && feed.length === 0 && !error && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-2">
          <div className="text-4xl">🌿</div>
          <p className="text-sm font-medium text-zinc-300">No reviews yet</p>
          <p className="text-sm text-zinc-500">Be the first — scan something and leave a review.</p>
        </div>
      )}

      {!loading && feed.length > 0 && (
        <div className="space-y-4">
          {feed.map(item => <FeedCard key={item.id} item={item} onVote={handleVote} onImageClick={setLightboxUrl} onDelete={handleDelete} />)}
          {nextCursor && (
            <button onClick={handleLoadMore} disabled={loadingMore}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700 disabled:opacity-50">
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-zinc-800/80 p-2 text-zinc-300 hover:text-white transition"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="NugShot full view"
            onClick={e => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
