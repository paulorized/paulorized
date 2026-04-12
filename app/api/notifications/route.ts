import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getCurrentUser() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

// GET — fetch user's notifications (latest 50, with unread count)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const db = createServerSupabaseClient();

  const [notifResult, countResult] = await Promise.all([
    db.from('notifications')
      .select('id, type, actor_id, reference_id, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ]);

  if (notifResult.error) return NextResponse.json({ error: notifResult.error.message }, { status: 500 });

  // Enrich with actor profile info
  const actorIds = [...new Set((notifResult.data ?? []).map(n => n.actor_id).filter(Boolean))];
  let actorMap: Record<string, { username: string; avatar_url: string | null }> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, username, avatar_url').in('id', actorIds);
    for (const p of profiles ?? []) {
      actorMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
    }
  }

  const notifications = (notifResult.data ?? []).map(n => ({
    ...n,
    actor_username: n.actor_id ? actorMap[n.actor_id]?.username ?? null : null,
    actor_avatar_url: n.actor_id ? actorMap[n.actor_id]?.avatar_url ?? null : null,
  }));

  return NextResponse.json({
    notifications,
    unread_count: countResult.count ?? 0,
  });
}

// PATCH — mark notifications as read
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { notification_ids, mark_all } = await request.json();
  const db = createServerSupabaseClient();

  if (mark_all) {
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (notification_ids?.length) {
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .in('id', notification_ids)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
