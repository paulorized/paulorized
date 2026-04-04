import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

function parseWeightToGrams(raw: string | null | undefined): number {
  if (!raw) return 0;
  const w = String(raw).toLowerCase().trim();
  if (!w) return 0;
  const ozMatch = w.match(/([\d.]+)\s*oz/);
  const gMatch = w.match(/([\d.]+)\s*g/);
  const bareMatch = w.match(/^([\d.]+)$/);
  if (ozMatch) return parseFloat(ozMatch[1]) * 28.3495;
  if (gMatch) return parseFloat(gMatch[1]);
  if (bareMatch) return parseFloat(bareMatch[1]);
  return 0;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const db = createServerSupabaseClient();

  // Look up profile by username (case-insensitive)
  const { data: profile } = await db
    .from('profiles')
    .select('id, username, avatar_url, state, created_at, hidden_from_directory')
    .ilike('username', username)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Viewer (may be null if not logged in)
  const auth = await createAuthServerClient();
  const { data: { user: viewer } } = await auth.auth.getUser();
  const isSelf = viewer?.id === profile.id;

  // If hidden, only the user themselves can see their profile
  if (profile.hidden_from_directory && !isSelf) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Load logs, reviews, follow counts in parallel
  const [logsRes, reviewsRes, followersRes, followingRes, amFollowingRes] = await Promise.all([
    db.from('product_logs')
      .select('id, brand, product_type, strain_type, strain_name, thc_percent, dispensary_name, created_at, weight')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true }),
    db.from('reviews')
      .select('id, product_log_id, rating, would_buy_again, notes, effects, flavors, helpful_count, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    db.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    viewer
      ? db.from('follows').select('following_id').eq('follower_id', viewer.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const logs = logsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  // Aggregate stats
  const totalScans = logs.length;
  const totalReviews = reviews.length;

  let totalGrams = 0;
  for (const l of logs) totalGrams += parseWeightToGrams(l.weight);
  totalGrams = Math.round(totalGrams * 10) / 10;

  const thcValues = logs.map(l => l.thc_percent).filter((v): v is number => v != null && (v as number) > 0);
  const avgThc = thcValues.length > 0
    ? Math.round((thcValues.reduce((a, b) => a + b, 0) / thcValues.length) * 10) / 10
    : null;

  const ratingValues = reviews.map(r => r.rating).filter((v): v is number => v != null);
  const avgRating = ratingValues.length > 0
    ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
    : null;

  const wbaRows = reviews.filter(r => r.would_buy_again != null);
  const wbaPct = wbaRows.length > 0
    ? Math.round((wbaRows.filter(r => r.would_buy_again).length / wbaRows.length) * 100)
    : null;

  const strainTypeCounts: Record<string, number> = { sativa: 0, indica: 0, hybrid: 0, unknown: 0 };
  for (const l of logs) {
    const t = (l.strain_type ?? 'unknown').toLowerCase();
    const key = ['sativa', 'indica', 'hybrid'].includes(t) ? t : 'unknown';
    strainTypeCounts[key]++;
  }

  const productTypeCounts: Record<string, number> = {};
  for (const l of logs) {
    const p = (l.product_type ?? '').toLowerCase().trim();
    if (!p) continue;
    productTypeCounts[p] = (productTypeCounts[p] ?? 0) + 1;
  }

  // THC distribution buckets
  const thcBuckets = ['0-15','15-20','20-25','25-30','30+'];
  const thcDistribution = thcBuckets.map(range => ({ range, count: 0 }));
  for (const v of thcValues) {
    let idx = 0;
    if (v >= 30) idx = 4;
    else if (v >= 25) idx = 3;
    else if (v >= 20) idx = 2;
    else if (v >= 15) idx = 1;
    thcDistribution[idx].count++;
  }

  // Top strains / effects / flavors
  const countBy = (arr: { name: string }[], field: 'name') => {
    const m = new Map<string, number>();
    for (const r of arr) {
      const k = String(r[field] ?? '').trim();
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };

  const topStrains = countBy(logs.map(l => ({ name: l.strain_name ?? '' })), 'name').slice(0, 5);
  const effectMap = new Map<string, number>();
  const flavorMap = new Map<string, number>();
  for (const r of reviews) {
    for (const e of r.effects ?? []) effectMap.set(e, (effectMap.get(e) ?? 0) + 1);
    for (const f of r.flavors ?? []) flavorMap.set(f, (flavorMap.get(f) ?? 0) + 1);
  }
  const topEffects = Array.from(effectMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const topFlavors = Array.from(flavorMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Scans over time (for chart) — last 30 days daily
  const scansOverTime: { date: string; count: number }[] = [];
  const byDay = new Map<string, number>();
  for (const l of logs) {
    if (!l.created_at) continue;
    const d = new Date(l.created_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [date, count] of sortedDays) scansOverTime.push({ date, count });

  // Hydrate reviews with log info for display
  const logById = new Map(logs.map(l => [l.id, l]));
  const recentReviews = reviews.map(r => {
    const log = r.product_log_id ? logById.get(r.product_log_id) : null;
    return {
      id: r.id,
      rating: r.rating,
      notes: r.notes,
      would_buy_again: r.would_buy_again,
      effects: r.effects,
      flavors: r.flavors,
      helpful_count: r.helpful_count,
      created_at: r.created_at,
      strain_name: log?.strain_name ?? null,
      brand: log?.brand ?? null,
      strain_type: log?.strain_type ?? null,
      product_type: log?.product_type ?? null,
      thc_percent: log?.thc_percent ?? null,
      dispensary_name: log?.dispensary_name ?? null,
    };
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      state: profile.state,
      created_at: profile.created_at,
    },
    stats: {
      totalScans, totalReviews, totalGrams, avgThc, avgRating, wbaPct,
      strainTypeCounts, productTypeCounts, thcDistribution,
      topStrains, topEffects, topFlavors,
      scansOverTime,
    },
    follow: {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
      is_following: !!amFollowingRes.data,
      is_self: isSelf,
    },
    recentReviews,
  });
}
