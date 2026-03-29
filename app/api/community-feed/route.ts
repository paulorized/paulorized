import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { getTier } from '@/lib/tiers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor'); // created_at of last item for pagination
    const limit = 20;

    // Get current user id (to know which items they've voted on)
    let currentUserId: string | null = null;
    try {
      const auth = await createAuthServerClient();
      const { data: { user } } = await auth.auth.getUser();
      currentUserId = user?.id ?? null;
    } catch {}

    const db = createServerSupabaseClient();

    // Step 1: fetch reviews with product_log join (FK exists)
    let reviewQuery = db
      .from('reviews')
      .select(`
        id,
        notes,
        rating,
        would_buy_again,
        effects,
        flavors,
        helpful_count,
        created_at,
        user_id,
        product_log_id,
        product_logs!inner (
          brand,
          strain_name,
          strain_type,
          product_type,
          thc_percent,
          headshot_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      reviewQuery = reviewQuery.lt('created_at', cursor);
    }

    const { data: reviews, error } = await reviewQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = reviews ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ feed: [], next_cursor: null });
    }

    // Step 2: fetch profiles separately by user_id list (no FK, manual join)
    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: profileRows } = await db
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);
    const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
    for (const p of profileRows ?? []) {
      profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
    }

    // Step 3: total helpful points per author for tier
    const { data: pointRows } = await db
      .from('reviews')
      .select('user_id, helpful_count')
      .in('user_id', userIds);
    const authorPoints: Record<string, number> = {};
    for (const row of pointRows ?? []) {
      authorPoints[row.user_id] = (authorPoints[row.user_id] ?? 0) + (row.helpful_count ?? 0);
    }

    // Step 3b: scan count per author
    const { data: logCountRows } = await db
      .from('product_logs')
      .select('user_id')
      .in('user_id', userIds);
    const scanCounts: Record<string, number> = {};
    for (const row of logCountRows ?? []) {
      scanCounts[row.user_id] = (scanCounts[row.user_id] ?? 0) + 1;
    }

    // Step 4: which reviews has current user voted on
    let myVotes = new Set<string>();
    if (currentUserId) {
      const reviewIds = rows.map(r => r.id);
      const { data: votes } = await db
        .from('review_helpful')
        .select('review_id')
        .eq('voter_user_id', currentUserId)
        .in('review_id', reviewIds);
      myVotes = new Set((votes ?? []).map(v => v.review_id));
    }

    const feed = rows.map(r => {
      const log = Array.isArray(r.product_logs) ? r.product_logs[0] : r.product_logs;
      const profile = profileMap[r.user_id];
      const totalPoints = authorPoints[r.user_id] ?? 0;
      return {
        id: r.id,
        user_id: r.user_id,
        username: profile?.username ?? 'Anonymous',
        avatar_url: profile?.avatar_url ?? null,
        tier: getTier(totalPoints),
        scan_count: scanCounts[r.user_id] ?? 0,
        brand: log?.brand ?? '',
        strain_name: log?.strain_name ?? '',
        strain_type: log?.strain_type ?? 'unknown',
        product_type: log?.product_type ?? '',
        thc_percent: log?.thc_percent ?? null,
        nugshot_url: log?.headshot_url ?? null,
        rating: r.rating,
        notes: r.notes ?? null,
        effects: r.effects ?? [],
        flavors: r.flavors ?? [],
        would_buy_again: r.would_buy_again,
        helpful_count: r.helpful_count ?? 0,
        i_voted: myVotes.has(r.id),
        created_at: r.created_at,
        is_mine: r.user_id === currentUserId,
      };
    });

    return NextResponse.json({
      feed,
      next_cursor: rows.length === limit ? rows[rows.length - 1].created_at : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
