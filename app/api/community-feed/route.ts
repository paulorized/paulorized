import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

// Tier logic - shared with profile page
export function getTier(helpfulCount: number): { label: string; emoji: string; color: string } {
  if (helpfulCount >= 50) return { label: 'Legend',      emoji: '🌳', color: 'text-yellow-400' };
  if (helpfulCount >= 20) return { label: 'Connoisseur', emoji: '🍃', color: 'text-emerald-400' };
  if (helpfulCount >= 5)  return { label: 'Grower',      emoji: '🌱', color: 'text-lime-400' };
  return                          { label: 'Seedling',   emoji: '🌿', color: 'text-zinc-400' };
}

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

    // Fetch reviews joined with product_logs and profiles
    // Only show reviews - but include ones without notes too
    let query = db
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
          thc_mg
        ),
        profiles!inner (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = reviews ?? [];

    // Get helpful_count totals per author (for tier calculation)
    // We need sum of helpful_count across all their reviews
    const authorIds = [...new Set(rows.map(r => r.user_id))];
    let authorPoints: Record<string, number> = {};
    if (authorIds.length > 0) {
      const { data: pointRows } = await db
        .from('reviews')
        .select('user_id, helpful_count')
        .in('user_id', authorIds);
      for (const row of pointRows ?? []) {
        authorPoints[row.user_id] = (authorPoints[row.user_id] ?? 0) + (row.helpful_count ?? 0);
      }
    }

    // Get which reviews current user has voted on
    let myVotes = new Set<string>();
    if (currentUserId && rows.length > 0) {
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
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const totalPoints = authorPoints[r.user_id] ?? 0;
      const tier = getTier(totalPoints);
      return {
        id: r.id,
        user_id: r.user_id, // needed for vote dedup only, not shown in UI
        username: profile?.username ?? 'Anonymous',
        avatar_url: profile?.avatar_url ?? null,
        tier,
        brand: log?.brand ?? '',
        strain_name: log?.strain_name ?? '',
        strain_type: log?.strain_type ?? 'unknown',
        product_type: log?.product_type ?? '',
        thc_percent: log?.thc_percent ?? null,
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
