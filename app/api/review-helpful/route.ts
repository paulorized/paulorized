import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getCurrentUser() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

// POST — mark a review as helpful
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { review_id } = await request.json();
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const db = createServerSupabaseClient();

  // Can't vote on your own review
  const { data: review } = await db.from('reviews').select('user_id, notes').eq('id', review_id).single();
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  if (review.user_id === user.id) return NextResponse.json({ error: 'Cannot vote on your own review' }, { status: 400 });
  if (!review.notes?.trim()) return NextResponse.json({ error: 'Can only vote on reviews with notes' }, { status: 400 });

  const { error } = await db.from('review_helpful').insert({
    review_id,
    voter_user_id: user.id,
  });

  if (error?.code === '23505') return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return new count
  const { data: updated } = await db.from('reviews').select('helpful_count').eq('id', review_id).single();
  return NextResponse.json({ success: true, helpful_count: updated?.helpful_count ?? 0 });
}

// DELETE — remove helpful vote
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { review_id } = await request.json();
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const db = createServerSupabaseClient();
  await db.from('review_helpful').delete()
    .eq('review_id', review_id)
    .eq('voter_user_id', user.id);

  const { data: updated } = await db.from('reviews').select('helpful_count').eq('id', review_id).single();
  return NextResponse.json({ success: true, helpful_count: updated?.helpful_count ?? 0 });
}
