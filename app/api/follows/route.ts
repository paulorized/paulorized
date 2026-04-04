import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

// GET /api/follows?type=followers|following&user=<uuid|username>
// Returns the follower or following list for the given user.
// If no user is specified, defaults to the viewer.
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
    // Try uuid first, fallback to username lookup
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

  // Get viewer so we can mark is_following on each row
  const auth = await createAuthServerClient();
  const { data: { user: viewer } } = await auth.auth.getUser();

  // Fetch the raw follow rows
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

  // Load profile data for each
  const { data: profiles } = await db
    .from('profiles')
    .select('id, username, avatar_url, hidden_from_directory')
    .in('id', ids);

  // Load scan counts so we can show a minimal stat on each row
  const { data: logs } = await db
    .from('product_logs')
    .select('user_id')
    .in('user_id', ids);

  const scanCounts = new Map<string, number>();
  for (const l of logs ?? []) {
    if (!l.user_id) continue;
    scanCounts.set(l.user_id, (scanCounts.get(l.user_id) ?? 0) + 1);
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

  const profileById = new Map((profiles ?? []).map(p => [p.id, p]));
  const users = ids
    .map(id => {
      const p = profileById.get(id);
      if (!p || !p.username) return null;
      // Respect opt-out on follower/following lists too
      if (p.hidden_from_directory && viewer?.id !== id) return null;
      return {
        id,
        username: p.username,
        avatar_url: p.avatar_url,
        scan_count: scanCounts.get(id) ?? 0,
        is_following: followingSet.has(id),
        is_self: viewer?.id === id,
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);

  return NextResponse.json({ users, type, target_user_id: targetId });
}
