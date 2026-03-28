import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

function getTier(helpfulCount: number) {
  if (helpfulCount >= 50) return { label: 'Legend',      emoji: '🌳', color: 'text-yellow-400' };
  if (helpfulCount >= 20) return { label: 'Connoisseur', emoji: '🍃', color: 'text-emerald-400' };
  if (helpfulCount >= 5)  return { label: 'Grower',      emoji: '🌱', color: 'text-lime-400' };
  return                          { label: 'Seedling',   emoji: '🌿', color: 'text-zinc-400' };
}

export async function GET() {
  try {
    const auth = await createAuthServerClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const db = createServerSupabaseClient();
    const { data } = await db
      .from('reviews')
      .select('helpful_count')
      .eq('user_id', user.id);

    const total = (data ?? []).reduce((sum, r) => sum + (r.helpful_count ?? 0), 0);
    return NextResponse.json({ tier: getTier(total), total_helpful: total });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
