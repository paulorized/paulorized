import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { getTier } from '@/lib/tiers';

// GET /api/follows?type=followers|following&user=<uuid|username>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') ?? 'following') as 'followers' | 'following';
  if (type !== 'followers' && type !== 'following') {
    return NextResponse.json({ error: 'type must be followers or following' }, { status: 400 });
  }
  const userParam = searchParams.get('user');

  const db = createServerSupabaseClient();

  // Resolve target user (viewer by default)
  let targetId: string | null = null;
  if (userParam) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userParam);
    if (isUuid) {
      targetId = userParam;
    } else {
      const { data: p } = await db.from('profiles').select('id').ilike('username', userParam).maybeSingle();
      targetId = p?.id ?? null;
    }
  } else {
    const auth = await createAuthServerClient();
    const { data: { user } } = await auth.auth.getUser();
    targetId = user?.id ?? null;
  }
  if (!targetId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const auth = await createAuthServerClient();
  const { data: { user: viewer } } = await auth.auth.getUser();

  // Fetch follow rows
  const col = type === 'followers' ? 'following_id' : 'follower_id';
  const otherCol = type === 'followers' ? 'follower_id' : 'following_id';
  const { data: rows, error } = await db
    .from('follows')
    .select(`${otherCol}, created_at`)
    .eq(col, targetId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (rows ?? []).map(r => (r as Record<string, unknown>)[otherCol] as string);
  if (ids.length === 0) return NextResponse.json({ users: [] });

  // Load profiles, logs (for scan/weight/strain counts), and reviews (for tier)
  const [profilesRes, logsRes, reviewsRes] = await Promise.all([
    db.from('profiles').select('id, username, avatar_url, hidden_from_directory').in('id', ids),
    db.from('product_logs').select('user_id, weight, strain_name').in('user_id', ids),
    db.from('reviews').select('user_id, helpful_count').in('user_id', ids),
  ]);

  // Aggregate stats
  type Stats = { scans: number; weightG: number; strains: Set<string>; reviews: number; helpfulTotal: number };
  const statsMap = new Map<string, Stats>();
  const ensure = (id: string): Stats => {
    let s = statsMap.get(id);
    if (!s) { s = { scans: 0, weightG: 0, strains: new Set(), reviews: 0, helpfulTotal: 0 }; statsMap.set(id, s); }
    return s;
  };

  for (const log of logsRes.data ?? []) {
    if (!log.user_id) continue;
    const s = ensure(log.user_id);
    s.scans += 1;
    const w = String(log.weight ?? '').toLowerCase().trim();
    const oz = w.match(/([\d.]+)\s*oz/);
    const g = w.match(/([\d.]+)\s*g/);
    const bare = w.match(/^([\d.]+)$/);
    if (oz) s.weightG += parseFloat(oz[1]) * 28.3495;
    else if (g) s.weightG += parseFloat(g[1]);
    else if (bare) s.weightG += parseFloat(bare[1]);
    if (log.strain_name?.trim()) s.strains.add(log.strain_name.trim().toLowerCase());
  }
  for (const r of reviewsRes.data ?? []) {
    if (!r.user_id) continue;
    const s = ensure(r.user_id);
    s.reviews += 1;
    s.helpfulTotal += r.helpful_count ?? 0;
  }

  // Viewer's own follows for is_following flag
  let followingSet = new Set<string>();
  if (viewer) {
    const { data: myFollows } = await db
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewer.id)
      .in('following_id', ids);
    followingSet = new Set((myFollows ?? []).map(f => f.following_id));
  }

  const profileById = new Map((profilesRes.data ?? []).map(p => [p.id, p]));
  const users = ids
    .map(id => {
      const p = profileById.get(id);
      if (!p || !p.username) return null;
      if (p.hidden_from_directory && viewer?.id !== id) return null;
      const s = statsMap.get(id) ?? { scans: 0, weightG: 0, strains: new Set<string>(), reviews: 0, helpfulTotal: 0 };
      return {
        id,
        username: p.username,
        avatar_url: p.avatar_url,
        scan_count: s.scans,
        total_grams: Math.round(s.weightG * 10) / 10,
        strain_count: s.strains.size,
        review_count: s.reviews,
        is_following: followingSet.has(id),
        is_self: viewer?.id === id,
        tier: getTier(s.helpfulTotal),
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);

  return NextResponse.json({ users, type, target_user_id: targetId });
}
