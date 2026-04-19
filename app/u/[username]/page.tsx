'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { FollowButton } from '@/components/follow-button';
import { IconLeaf, TierIcon } from '@/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tier { label: string; emoji: string; icon?: string; color: string; }

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  state: string | null;
  created_at: string;
}

interface Stats {
  totalScans: number;
  totalReviews: number;
  totalGrams: number;
  avgThc: number | null;
  avgRating: number | null;
  wbaPct: number | null;
  topStrains: { name: string; count: number }[];
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
  strainTypeCounts: Record<string, number>;
  productTypeCounts: Record<string, number>;
  tier: Tier;
}

interface FollowInfo {
  followers: number;
  following: number;
  is_following: boolean;
  is_self: boolean;
}

interface Review {
  id: string;
  strain_name: string;
  brand: string;
  thc_percent: number | null;
  strain_type: string;
  product_type: string;
  rating: number | null;
  notes: string | null;
  would_buy_again: boolean | null;
  effects: string[];
  flavors: string[];
  created_at: string;
  dispensary_name: string | null;
  nugshot_url: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BUBBLE_COLORS = ['bg-emerald-600','bg-purple-600','bg-yellow-500','bg-sky-600','bg-rose-600','bg-orange-500','bg-teal-600','bg-indigo-600'];
function getBubbleColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}

function formatWeight(g: number): string {
  if (g <= 0) return '0g';
  const oz = g / 28.3495;
  if (oz >= 16) return (oz / 16).toFixed(1) + ' lbs';
  if (oz >= 1) return oz.toFixed(1) + ' oz';
  return g.toFixed(0) + 'g';
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

const strainColors: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sativa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
};

const STRAIN_TYPE_COLORS: Record<string, string> = {
  sativa: '#f59e0b',
  indica: '#8b5cf6',
  hybrid: '#10b981',
  cbd: '#38bdf8',
  other: '#71717a',
};

const BAR_COLORS = ['#34d399','#a78bfa','#fde047','#38bdf8','#f97316','#ec4899'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function MiniBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 truncate text-xs text-zinc-400">{label}</div>
      <div className="flex-1 h-4 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-6 text-right text-xs text-zinc-500">{count}</div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const strainType = (review.strain_type ?? 'unknown').toLowerCase();
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-zinc-200">{review.strain_name || review.brand || 'Unknown'}</span>
            {review.brand && review.strain_name && <span className="text-xs text-zinc-500">{review.brand}</span>}
            {strainType && strainType !== 'unknown' && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${strainColors[strainType] ?? strainColors.unknown}`}>{strainType}</span>
            )}
            {review.product_type && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 capitalize">{review.product_type}</span>}
          </div>
          {review.thc_percent && <div className="text-xs text-emerald-500 font-medium mt-0.5">THC {review.thc_percent}%</div>}
        </div>
        <div className="text-xs text-zinc-600 shrink-0">{timeAgo(review.created_at)}</div>
      </div>

      {(review.rating != null || review.would_buy_again != null) && (
        <div className="flex items-center gap-3">
          {review.rating != null && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                  fill={i <= review.rating! ? '#f59e0b' : 'none'} stroke={i <= review.rating! ? '#f59e0b' : '#52525b'} strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          )}
          {review.would_buy_again != null && (
            <span className={`text-xs font-medium ${review.would_buy_again ? 'text-emerald-400' : 'text-rose-400'}`}>
              {review.would_buy_again ? '&#10003; Would buy again' : '&#10007; Would not buy again'}
            </span>
          )}
        </div>
      )}

      {review.notes?.trim() && (
        <p className="text-sm text-zinc-300 italic leading-relaxed">&ldquo;{review.notes.trim()}&rdquo;</p>
      )}

      {review.nugshot_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={review.nugshot_url} alt="NugShot"
          className="w-full max-h-48 rounded-xl object-cover border border-zinc-700/60" />
      )}

      {((review.effects?.length ?? 0) > 0 || (review.flavors?.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {(review.effects ?? []).slice(0,4).map(e => (
            <span key={e} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{e}</span>
          ))}
          {(review.flavors ?? []).slice(0,3).map(f => (
            <span key={f} className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{f}</span>
          ))}
        </div>
      )}

      {review.dispensary_name && (
        <a href={`https://www.google.com/maps/search/${encodeURIComponent(review.dispensary_name + ' dispensary')}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition">
          <svg width="8" height="10" viewBox="0 0 24 28" fill="currentColor">
            <path d="M12 0C7.16 0 3.2 3.96 3.2 8.8c0 7.7 8.8 17.6 8.8 17.6s8.8-9.9 8.8-17.6C20.8 3.96 16.84 0 12 0zm0 12a3.2 3.2 0 1 1 0-6.4A3.2 3.2 0 0 1 12 12z"/>
          </svg>
          {review.dispensary_name}
        </a>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const searchParams = useSearchParams();
  const from = searchParams.get('from'); // 'users' | 'following' | 'feed' | null

  // Build the back link: preserve the originating tab
  const backHref = from && from !== 'feed'
    ? `/community?tab=${from}`
    : '/community';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [followInfo, setFollowInfo] = useState<FollowInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    document.title = `@${username} — CannaBaseAI`;
    fetch(`/api/user/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(async res => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        setProfile(data.profile ?? null);
        setStats(data.stats ?? null);
        setFollowInfo(data.follow ?? null);
        setReviews(data.recentReviews ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-zinc-800" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 rounded bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-zinc-800" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-zinc-800" />)}
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center space-y-3">
        <div className="flex justify-center text-emerald-400"><IconLeaf size={48} /></div>
        <h1 className="text-xl font-bold text-zinc-100">User not found</h1>
        <p className="text-sm text-zinc-500">@{username} doesn&apos;t exist or has a private profile.</p>
        <a href={backHref} className="inline-block mt-4 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300 transition">
          Back to Community
        </a>
      </div>
    );
  }

  const tier = stats?.tier ?? { label: 'Seedling', emoji: '🌿', icon: 'seedling', color: 'text-zinc-400' };
  const bubbleColor = getBubbleColor(profile.id);
  const strainTypeEntries = Object.entries(stats?.strainTypeCounts ?? {}).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a);
  const strainTotal = strainTypeEntries.reduce((s,[,v]) => s + v, 0);
  const productEntries = Object.entries(stats?.productTypeCounts ?? {}).filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a).slice(0, 6);
  const productMax = productEntries[0]?.[1] ?? 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-5">

      {/* Back */}
      <a href={backHref} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Community
      </a>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.username} referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-full object-cover border-2 border-emerald-500/40" />
            ) : (
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-zinc-700 ${bubbleColor}`}>
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 leading-none" title={tier.label}>
              {tier.icon ? <TierIcon name={tier.icon} size={18} /> : tier.emoji}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-zinc-100">@{profile.username}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
                  {profile.state && <span className="text-xs text-zinc-500">{profile.state}</span>}
                </div>
              </div>
              {followInfo && (
                <FollowButton
                  userId={profile.id}
                  initialFollowing={followInfo.is_following}
                  isSelf={followInfo.is_self}
                  size="md"
                />
              )}
            </div>
            {followInfo && (
              <div className="mt-3 flex gap-4 text-xs text-zinc-400">
                <span><strong className="text-zinc-200">{followInfo.followers}</strong> followers</span>
                <span><strong className="text-zinc-200">{followInfo.following}</strong> following</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats tiles */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatTile label="Logs" value={String(stats.totalScans)} color="#34d399" />
          <StatTile label="Reviews" value={String(stats.totalReviews)} color="#38bdf8" />
          <StatTile label="Weight" value={formatWeight(stats.totalGrams)} color="#fde047" />
          <StatTile label="Avg THC" value={stats.avgThc != null ? `${stats.avgThc.toFixed(1)}%` : '—'} color="#a78bfa" />
          <StatTile label="Avg Rating" value={stats.avgRating != null ? `${stats.avgRating.toFixed(1)}/5` : '—'} color="#f59e0b" />
          <StatTile label="Buy Again" value={stats.wbaPct != null ? `${stats.wbaPct.toFixed(0)}%` : '—'} color="#34d399" />
        </div>
      )}

      {/* Top strains */}
      {(stats?.topStrains?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Top Strains</h2>
          <div className="space-y-2">
            {stats!.topStrains.map((s, i) => (
              <MiniBar key={s.name} label={s.name} count={s.count} max={stats!.topStrains[0].count} color={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {/* Strain types */}
      {strainTotal > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Strain Types</h2>
          <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
            {strainTypeEntries.map(([type, count]) => (
              <div key={type} className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                style={{ width: `${(count / strainTotal) * 100}%`, backgroundColor: STRAIN_TYPE_COLORS[type] ?? '#71717a' }}
                title={`${type}: ${count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {strainTypeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STRAIN_TYPE_COLORS[type] ?? '#71717a' }} />
                <span className="text-xs text-zinc-400 capitalize">{type}</span>
                <span className="text-xs text-zinc-600">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product types */}
      {productEntries.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Types</h2>
          <div className="space-y-2">
            {productEntries.map(([name, count], i) => (
              <MiniBar key={name} label={name.charAt(0).toUpperCase() + name.slice(1)} count={count} max={productMax} color={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </div>
        </div>
      )}

      {/* Top effects + flavors */}
      {((stats?.topEffects?.length ?? 0) > 0 || (stats?.topFlavors?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(stats?.topEffects?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-2">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Top Effects</h2>
              <div className="flex flex-wrap gap-1.5">
                {stats!.topEffects.map(e => (
                  <span key={e.name} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">{e.name}</span>
                ))}
              </div>
            </div>
          )}
          {(stats?.topFlavors?.length ?? 0) > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 space-y-2">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Top Flavors</h2>
              <div className="flex flex-wrap gap-1.5">
                {stats!.topFlavors.map(f => (
                  <span key={f.name} className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">{f.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent Reviews</h2>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {reviews.length === 0 && stats && stats.totalScans > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <p className="text-sm text-zinc-500">No reviews yet</p>
        </div>
      )}
    </div>
  );
}
