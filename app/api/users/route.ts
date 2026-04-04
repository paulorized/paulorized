import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

type SortKey = 'scans' | 'weight' | 'reviews' | 'recent';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get('sort') ?? 'scans') as SortKey;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const db = createServerSupabaseClient();

  // Load all visible profiles
  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .eq('hidden_from_directory', false);

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
  if (!profiles || profiles.length === 0) return NextResponse.json({ users: [], total: 0 });

  // Aggregate per-user stats from logs + reviews
  const [logsRes, reviewsRes] = await Promise.all([
    db.from('product_logs').select('user_id, weight, created_at'),
    db.from('reviews').select('user_id, created_at'),
  ]);
  const logs = logsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  type Stats = { scans: number; weightG: number; reviews: number; lastActive: number };
  const stats = new Map<string, Stats>();
  const ensure = (id: string): Stats => {
    let s = stats.get(id);
    if (!s) { s = { scans: 0, weightG: 0, reviews: 0, lastActive: 0 }; stats.set(id, s); }
    return s;
  };

  for (const log of logs) {
    if (!log.user_id) continue;
    const s = ensure(log.user_id);
    s.scans += 1;
    s.weightG += parseWeightToGrams(log.weight);
    const ts = log.created_at ? new Date(log.created_at).getTime() : 0;
    if (ts > s.lastActive) s.lastActive = ts;
  }
  for (const r of reviews) {
    if (!r.user_id) continue;
    const s = ensure(r.user_id);
    s.reviews += 1;
    const ts = r.created_at ? new Date(r.created_at).getTime() : 0;
    if (ts > s.lastActive) s.lastActive = ts;
  }

  // Get the viewer's follows so we can mark is_following
  const auth = await createAuthServerClient();
  const { data: { user: viewer } } = await auth.auth.getUser();
  let followingSet = new Set<string>();
  if (viewer) {
    const { data: myFollows } = await db
      .from('follows')
      .select('following_id')
      .eq('follower_id', viewer.id);
    followingSet = new Set((myFollows ?? []).map(f => f.following_id));
  }

  // Merge + filter to users with at least one scan or review
  const rows = profiles
    .map(p => {
      const s = stats.get(p.id) ?? { scans: 0, weightG: 0, reviews: 0, lastActive: 0 };
      return {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        scan_count: s.scans,
        total_grams: Math.round(s.weightG * 10) / 10,
        review_count: s.reviews,
        last_active: s.lastActive || (p.created_at ? new Date(p.created_at).getTime() : 0),
        is_following: followingSet.has(p.id),
        is_self: viewer?.id === p.id,
      };
    })
    .filter(u => u.username && (u.scan_count > 0 || u.review_count > 0));

  // Sort
  rows.sort((a, b) => {
    switch (sort) {
      case 'weight':  return b.total_grams - a.total_grams;
      case 'reviews': return b.review_count - a.review_count;
      case 'recent':  return b.last_active - a.last_active;
      case 'scans':
      default:        return b.scan_count - a.scan_count;
    }
  });

  const total = rows.length;
  const paged = rows.slice(offset, offset + limit);

  return NextResponse.json({ users: paged, total, sort, limit, offset });
}
