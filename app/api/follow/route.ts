import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getCurrentUser() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

// POST — follow a user
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  if (user_id === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  const db = createServerSupabaseClient();

  // Verify target user exists
  const { data: target } = await db.from('profiles').select('id').eq('id', user_id).single();
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { error } = await db.from('follows').insert({
    follower_id: user.id,
    following_id: user_id,
  });

  if (error?.code === '23505') {
    // Already following — treat as idempotent success
    return NextResponse.json({ success: true, following: true });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, following: true });
}

// DELETE — unfollow a user
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { user_id } = await request.json();
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const db = createServerSupabaseClient();
  const { error } = await db.from('follows').delete()
    .eq('follower_id', user.id)
    .eq('following_id', user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, following: false });
}
