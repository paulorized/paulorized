'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FollowButton } from '@/components/follow-button';
import { CommentSection } from '@/components/comment-thread';
import { IconLeaf, IconPeople, IconSearch, IconTurtle, IconOkHand, IconFire, TierIcon } from '@/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tier { label: string; emoji: string; icon?: string; color: string; }

interface Terpene { name: string; percent: number | null; source?: string; }

interface FeedItem {
  id: string; user_id: string; username: string; avatar_url: string | null; tier: Tier;
  brand: string; strain_name: string; strain_type: string; product_type: string;
  thc_percent: number | null; rating: number | null; notes: string | null;
  effects: string[]; flavors: string[]; would_buy_again: boolean | null;
  burn_speed: string | null; canoeing: boolean | null; clogging: boolean | null;
  terpenes: Terpene[] | null;
  helpful_count: number; i_voted: boolean; created_at: string; is_mine: boolean;
  nugshot_url: string | null; scan_count: number; dispensary_name: string | null;
  comment_count: number;
}

// Terpene display meta (shared with history)
const FEED_TERP_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  myrcene:       { icon: '/icons/terpene-myrcene.png', color: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30'   },
  limonene:      { icon: '/icons/terpene-limonene.png', color: 'text-yellow-300',  bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30'  },
  caryophyllene: { icon: '/icons/terpene-caryophyllene.png', color: 'text-orange-300',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30'  },
  linalool:      { icon: '/icons/terpene-linalool.png', color: 'text-purple-300',  bg: 'bg-purple-500/15',  border: 'border-purple-500/30'  },
  pinene:        { icon: '/icons/terpene-pinene.png', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  terpinolene:   { icon: '/icons/terpene-terpinolene.png', color: 'text-sky-300',     bg: 'bg-sky-500/15',     border: 'border-sky-500/30'     },
  ocimene:       { icon: '/icons/terpene-ocimene.png', color: 'text-teal-300',    bg: 'bg-teal-500/15',    border: 'border-teal-500/30'    },
  humulene:      { icon: '/icons/terpene-humulene.png', color: 'text-zinc-300',    bg: 'bg-zinc-700/40',    border: 'border-zinc-600'        },
  bisabolol:     { icon: '/icons/terpene-bisabolol.png', color: 'text-pink-300',    bg: 'bg-pink-500/15',    border: 'border-pink-500/30'    },
  nerolidol:     { icon: '/icons/terpene-nerolidol.png', color: 'text-lime-300',    bg: 'bg-lime-500/15',    border: 'border-lime-500/30'    },
};
function getFeedTerpMeta(name: string) {
  return FEED_TERP_META[name.toLowerCase()] ?? { icon: '/icons/ui-leaf.png', color: 'text-zinc-400', bg: 'bg-zinc-800/60', border: 'border-zinc-700' };
}

interface UserCard {
  id: string; username: string; avatar_url: string | null; tier?: Tier;
  scan_count: number; review_count: number; total_grams: number; strain_count: number;
  is_following: boolean; is_self: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIER: Tier = { label: 'Seedling', emoji: '🌿', icon: 'seedling', color: 'text-zinc-400' };
const strainColors: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};
const BUBBLE_COLORS = ['bg-emerald-600','bg-purple-600','bg-yellow-500','bg-sky-600','bg-rose-600','bg-orange-500','bg-teal-600','bg-indigo-600'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatWeight(g: number): string {
  if (g <= 0) return '—';
  const oz = g / 28.3495;
  if (oz >= 16) return (oz / 16).toFixed(1) + ' lbs';
  if (oz >= 1) return oz.toFixed(1) + ' oz';
  return g.toFixed(0) + 'g';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number | null }) {
  if (!rating || rating < 1) return null;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= rating ? '#f59e0b' : 'none'} stroke={i <= rating ? '#f59e0b' : '#52525b'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ username, userId, avatarUrl, size = 10 }: { username: string; userId: string; avatarUrl: string | null; size?: number }) {
  const bubbleColor = getBubbleColor(userId);
  const px = size * 4;
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={username} referrerPolicy="no-referrer"
      className="rounded-full object-cover border border-zinc-700" style={{ width: px, height: px }} />;
  }
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-bold ${bubbleColor}`}
      style={{ width: px, height: px, fontSize: px * 0.4 }}>
      {(username ?? '?').charAt(0).toUpperCase()}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: 'green' | 'purple' | 'yellow' | 'gray' }) {
  const colors = {
    green:  'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300',
    gray:   'bg-zinc-700/40 border-zinc-600/40 text-zinc-300',
  };
  return (
    <div className={`flex flex-col items-center rounded-lg border px-2.5 py-1.5 ${colors[color]}`}>
      <span className="text-sm font-bold leading-none">{value}</span>
      <span className="mt-0.5 text-[10px] font-medium opacity-70 leading-none">{label}</span>
    </div>
  );
}

function FeedCard({ item, expanded, onExpand, onVote, onImageClick, onDelete, currentUserId }: {
  item: FeedItem;
  expanded: boolean;
  onExpand: (id: string | null) => void;
  onVote: (id: string, voted: boolean) => void;
  onImageClick: (url: string) => void;
  onDelete: (id: string) => void;
  currentUserId: string | null;
}) {
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localVoted, setLocalVoted] = useState(!!item.i_voted);
  const [localCount, setLocalCount] = useState(item.helpful_count ?? 0);
  const canVote = !!(item.notes?.trim()) && !item.is_mine;
  const tier = item.tier ?? DEFAULT_TIER;
  const strainType = (item.strain_type ?? 'unknown').toLowerCase();
  const hasDetails = !!(
    (item.terpenes?.length) ||
    item.burn_speed || item.canoeing != null || item.clogging != null ||
    (item.effects?.length ?? 0) > 3 || (item.flavors?.length ?? 0) > 2
  );

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
      if (res.ok) { setLocalVoted(!localVoted); setLocalCount(data.helpful_count ?? localCount); onVote(item.id, !localVoted); }
    } catch {}
    setVoting(false);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="relative shrink-0">
          <a href={`/u/${item.username}?from=feed`}>
            <Avatar username={item.username} userId={item.user_id} avatarUrl={item.avatar_url} size={10} />
          </a>
          <span className="absolute -bottom-1 -right-1 leading-none" title={tier.label}>
            {tier.icon ? <TierIcon name={tier.icon} size={16} /> : tier.emoji}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`/u/${item.username}?from=feed`} className="font-semibold text-sm text-zinc-100 hover:text-emerald-400 transition">
              {item.username ?? 'Anonymous'}
            </a>
            <span className="text-xs text-zinc-600">{item.scan_count ?? 0} logs</span>
            <span className="text-xs text-zinc-600 ml-auto shrink-0">{timeAgo(item.created_at)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {item.strain_name ? (
              <a
                href={`/strains?q=${encodeURIComponent(item.strain_name)}`}
                className="text-sm font-semibold text-zinc-200 hover:text-yellow-300 transition underline-offset-2 hover:underline decoration-dotted"
                title={`Look up "${item.strain_name}" in StrainAI`}
              >
                {item.strain_name}
              </a>
            ) : (
              <span className="text-sm font-semibold text-zinc-200">{item.brand || 'Unknown'}</span>
            )}
            {item.brand && item.strain_name && <span className="text-xs text-zinc-500">{item.brand}</span>}
            {strainType && strainType !== 'unknown' && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${strainColors[strainType] ?? strainColors.unknown}`}>{strainType}</span>
            )}
            {item.product_type && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 capitalize">{item.product_type}</span>}
            {item.thc_percent && <span className="text-xs text-emerald-500 font-medium">THC {item.thc_percent}%</span>}
          </div>
          {item.dispensary_name && (
            <a href={`https://www.google.com/maps/search/${encodeURIComponent(item.dispensary_name + ' dispensary')}`}
              target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="mt-1 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition">
              <svg width="8" height="10" viewBox="0 0 24 28" fill="currentColor" className="shrink-0">
                <path d="M12 0C7.16 0 3.2 3.96 3.2 8.8c0 7.7 8.8 17.6 8.8 17.6s8.8-9.9 8.8-17.6C20.8 3.96 16.84 0 12 0zm0 12a3.2 3.2 0 1 1 0-6.4A3.2 3.2 0 0 1 12 12z"/>
              </svg>
              {item.dispensary_name}
            </a>
          )}
        </div>
      </div>

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

      {item.notes?.trim() && (
        <div className="px-4 pb-3">
          <p className="text-sm text-zinc-300 leading-relaxed italic">&ldquo;{item.notes.trim()}&rdquo;</p>
        </div>
      )}

      {item.nugshot_url && (
        <div className="px-4 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.nugshot_url} alt={`${item.strain_name || 'Product'} nugshot`}
            onClick={() => onImageClick(item.nugshot_url!)}
            className="w-full max-h-64 rounded-xl object-cover border border-zinc-700/60 cursor-zoom-in transition hover:brightness-110" />
        </div>
      )}

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

      <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between gap-2">
        <button onClick={handleVote} disabled={!canVote || voting}
          title={item.is_mine ? 'Your own review' : !item.notes?.trim() ? 'Only reviews with notes can be marked helpful' : localVoted ? 'Remove vote' : 'Mark as helpful'}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${!canVote ? 'text-zinc-600 cursor-default' : localVoted ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={localVoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          Helpful
          {localCount > 0 && <span className={`ml-0.5 ${localVoted ? 'text-emerald-400' : 'text-zinc-500'}`}>{localCount}</span>}
        </button>
        {hasDetails && (
          <button onClick={() => onExpand(expanded ? null : item.id)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${expanded ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}>
            <span className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
            {expanded ? 'Less' : 'Details'}
          </button>
        )}
        <span className={`flex items-center gap-1 text-xs font-medium ${tier.color} ml-auto`}>
          {tier.icon ? <TierIcon name={tier.icon} size={12} /> : tier.emoji} {tier.label}
        </span>
        {item.is_mine && (
          <button onClick={async () => {
            if (!window.confirm('Delete your review?')) return;
            setDeleting(true);
            try {
              const res = await fetch('/api/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review_id: item.id }) });
              if (res.ok) onDelete(item.id);
            } catch {}
            setDeleting(false);
          }} disabled={deleting} className="text-xs text-zinc-600 italic hover:text-rose-400 transition disabled:opacity-50">
            {deleting ? 'Deleting…' : 'Delete review'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/70 px-4 py-5 space-y-5">

          {/* Terpenes */}
          {(item.terpenes?.length ?? 0) > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Terpenes</p>
              <div className="flex flex-wrap gap-2">
                {(item.terpenes ?? []).map(t => {
                  const m = getFeedTerpMeta(t.name);
                  return (
                    <div key={t.name} className={`flex items-center gap-1.5 rounded-xl border ${m.border} ${m.bg} px-3 py-1.5`}>
                      <span className="text-sm leading-none"><img src={m.icon} alt="" className="w-4 h-4 opacity-90" style={{ mixBlendMode: 'screen' }} /></span>
                      <span className={`text-xs font-semibold capitalize ${m.color}`}>{t.name}</span>
                      {t.percent != null && <span className={`text-xs font-bold ${m.color} opacity-80`}>{t.percent}%</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pre-roll / vape quality */}
          {(item.burn_speed || item.canoeing != null || item.clogging != null) && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Smoke Quality</p>
              <div className="flex gap-2 flex-wrap">
                {item.burn_speed && (
                  <div className="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-3 py-2.5 text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">Burn Speed</p>
                    <p className="text-sm font-semibold text-zinc-200 capitalize flex items-center gap-1 justify-center">
                      {item.burn_speed === 'slow' ? <IconTurtle size={14} /> : item.burn_speed === 'medium' ? <IconOkHand size={14} /> : <IconFire size={14} />} {item.burn_speed}
                    </p>
                  </div>
                )}
                {item.canoeing != null && (
                  <div className="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-3 py-2.5 text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">Canoeing</p>
                    <p className={`text-sm font-semibold ${item.canoeing ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.canoeing ? '✗ Yes' : '✓ No'}
                    </p>
                  </div>
                )}
                {item.clogging != null && (
                  <div className="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-3 py-2.5 text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">Clogging</p>
                    <p className={`text-sm font-semibold ${item.clogging ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.clogging ? '✗ Yes' : '✓ No'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full effects + flavors */}
          {((item.effects?.length ?? 0) > 0 || (item.flavors?.length ?? 0) > 0) && (
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Effects &amp; Flavors</p>
              <div className="flex flex-wrap gap-1.5">
                {(item.effects ?? []).map(e => (
                  <span key={e} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">{e}</span>
                ))}
                {(item.flavors ?? []).map(f => (
                  <span key={f} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">{f}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentSection reviewId={item.id} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function UserRow({ user, fromTab }: { user: UserCard; fromTab: string }) {
  const tier = user.tier ?? DEFAULT_TIER;
  return (
    <a href={`/u/${user.username}?from=${fromTab}`}
      className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/60 transition group">
      <div className="relative shrink-0">
        <Avatar username={user.username} userId={user.id} avatarUrl={user.avatar_url} size={11} />
        <span className="absolute -bottom-1 -right-1 leading-none">
          {tier.icon ? <TierIcon name={tier.icon} size={16} /> : tier.emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-400 transition truncate">
            @{user.username}
          </span>
          <span className={`text-xs font-medium ${tier.color}`}>{tier.label}</span>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          <StatPill label="Scans" value={String(user.scan_count)} color="green" />
          <StatPill label="Strains" value={String(user.strain_count)} color="purple" />
          <StatPill label="Weight" value={formatWeight(user.total_grams)} color="yellow" />
          {user.review_count > 0 && (
            <StatPill label="Reviews" value={String(user.review_count)} color="gray" />
          )}
        </div>
      </div>
      <div onClick={e => e.preventDefault()} className="shrink-0">
        <FollowButton userId={user.id} initialFollowing={user.is_following} isSelf={user.is_self} size="sm" />
      </div>
    </a>
  );
}

// ─── Tab views ────────────────────────────────────────────────────────────────

type SortKey = 'scans' | 'weight' | 'reviews' | 'recent';

function UsersView() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('scans');

  const load = useCallback(async (s: SortKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?sort=${s}&limit=50`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(sort); }, [load, sort]);

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'scans', label: 'Most logs' },
    { key: 'reviews', label: 'Most reviews' },
    { key: 'weight', label: 'Most weight' },
    { key: 'recent', label: 'Recently active' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {sorts.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${sort === s.key ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="h-11 w-11 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-zinc-800" />
                <div className="flex gap-2">
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && users.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
          <div className="flex justify-center mb-2 text-zinc-500"><IconPeople size={36} /></div>
          <p className="text-sm text-zinc-400">No users found</p>
        </div>
      )}
      {!loading && users.length > 0 && (
        <div className="space-y-2">
          {users.map(u => <UserRow key={u.id} user={u} fromTab="users" />)}
        </div>
      )}
    </div>
  );
}

function FollowingView() {
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (t: 'following' | 'followers') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follows?type=${t}`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(tab); }, [load, tab]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl bg-zinc-800/60 p-1">
        {(['following', 'followers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${tab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t}
          </button>
        ))}
      </div>
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="h-11 w-11 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-zinc-800" />
                <div className="flex gap-2">
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                  <div className="h-8 w-14 rounded-lg bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && users.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
          <div className="flex justify-center mb-2 text-zinc-500">
            {tab === 'following' ? <IconSearch size={36} /> : <IconPeople size={36} />}
          </div>
          <p className="text-sm text-zinc-400">
            {tab === 'following' ? "You aren't following anyone yet" : "Nobody is following you yet"}
          </p>
          {tab === 'following' && <p className="text-xs text-zinc-600 mt-1">Check the Users tab to find people to follow</p>}
        </div>
      )}
      {!loading && users.length > 0 && (
        <div className="space-y-2">
          {users.map(u => <UserRow key={u.id} user={u} fromTab="following" />)}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabKey = 'feed' | 'users' | 'following';

function CommunityPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as TabKey) ?? 'feed';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/community?tab=${tab}`, { scroll: false });
  };

  // Feed state
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => { document.title = 'Community — CannaBaseAI'; }, []);

  const loadFeed = useCallback(async (cursor?: string) => {
    const url = '/api/community-feed' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : '');
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to load');
    return data;
  }, []);

  useEffect(() => {
    if (feedLoaded) return;
    loadFeed()
      .then(data => { setFeed(data.feed ?? []); setNextCursor(data.next_cursor ?? null); setCurrentUserId(data.current_user_id ?? null); setLoading(false); setFeedLoaded(true); })
      .catch(err => { setError(String(err?.message ?? err)); setLoading(false); });
  }, [loadFeed, feedLoaded]);

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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'users', label: 'Users' },
    { key: 'following', label: 'Following' },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-zinc-100">Community</h1>
        <p className="mt-1 text-sm text-zinc-500">See what others are scanning and smoking. Write reviews to earn helpful votes and level up your rank.</p>
      </div>

      {/* Tab header */}
      <div className="mb-5 flex gap-1 rounded-xl bg-zinc-800/60 p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${activeTab === t.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed tab */}
      {activeTab === 'feed' && (
        <>
          <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 space-y-2">
            <p className="text-xs text-zinc-600">Your rank is based on helpful votes your reviews receive from the community.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                { icon: 'seedling', label: 'Seedling', sub: '0+ votes', color: 'text-zinc-400' },
                { icon: 'grower', label: 'Grower', sub: '5+ votes', color: 'text-lime-400' },
                { icon: 'connoisseur', label: 'Connoisseur', sub: '20+ votes', color: 'text-emerald-400' },
                { icon: 'legend', label: 'Legend', sub: '50+ votes', color: 'text-yellow-400' },
              ].map(t => (
                <div key={t.label} className={`flex items-center gap-1.5 ${t.color}`}>
                  <TierIcon name={t.icon} size={14} />
                  <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>
                  <span className="text-xs text-zinc-600">{t.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-rose-400">{error}</span>
              <button onClick={() => { setError(''); setLoading(true); setFeedLoaded(false); }}
                className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition">Retry</button>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                    <div className="space-y-2 flex-1"><div className="h-3 w-24 rounded bg-zinc-800" /><div className="h-3 w-40 rounded bg-zinc-800" /></div>
                  </div>
                  <div className="h-3 w-full rounded bg-zinc-800" />
                  <div className="h-3 w-4/5 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          )}

          {!loading && feed.length === 0 && !error && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-2">
              <div className="flex justify-center text-emerald-400"><IconLeaf size={40} /></div>
              <p className="text-sm font-medium text-zinc-300">No reviews yet</p>
              <p className="text-sm text-zinc-500">Be the first — scan something and leave a review.</p>
            </div>
          )}

          {!loading && feed.length > 0 && (
            <div className="space-y-4">
              {feed.map(item => <FeedCard key={item.id} item={item} expanded={expandedCardId === item.id} onExpand={setExpandedCardId} onVote={handleVote} onImageClick={setLightboxUrl} onDelete={handleDelete} currentUserId={currentUserId} />)}
              {nextCursor && (
                <button onClick={handleLoadMore} disabled={loadingMore}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700 disabled:opacity-50">
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'users' && <UsersView />}
      {activeTab === 'following' && <FollowingView />}

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-zinc-800/80 p-2 text-zinc-300 hover:text-white transition" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="NugShot full view" onClick={e => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageInner />
    </Suspense>
  );
}
