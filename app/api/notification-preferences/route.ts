import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getCurrentUser() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

// GET — fetch user's notification preferences (creates defaults if none exist)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = createServerSupabaseClient();
  let { data } = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Auto-create defaults if no row exists
  if (!data) {
    const { data: created } = await db
      .from('notification_preferences')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    data = created;
  }

  return NextResponse.json({ preferences: data });
}

// POST — update notification preferences
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const allowed = ['email_comments', 'email_replies', 'email_follows', 'email_helpful', 'email_digest'];
  const updates: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === 'boolean') updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const db = createServerSupabaseClient();

  // Upsert: create row if it doesn't exist, update if it does
  const { data, error } = await db
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
