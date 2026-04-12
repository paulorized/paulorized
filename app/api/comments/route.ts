import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getCurrentUser() {
  const auth = await createAuthServerClient();
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

interface RawComment {
  id: string;
  review_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface CommentNode extends Omit<RawComment, 'profiles'> {
  username: string;
  avatar_url: string | null;
  children: CommentNode[];
}

function buildTree(flat: RawComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of flat) {
    map.set(c.id, {
      id: c.id,
      review_id: c.review_id,
      user_id: c.user_id,
      parent_comment_id: c.parent_comment_id,
      body: c.body,
      created_at: c.created_at,
      updated_at: c.updated_at,
      username: c.profiles?.username ?? 'Unknown',
      avatar_url: c.profiles?.avatar_url ?? null,
      children: [],
    });
  }

  for (const node of map.values()) {
    if (node.parent_comment_id && map.has(node.parent_comment_id)) {
      map.get(node.parent_comment_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// GET — fetch threaded comments for a review
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get('review_id');
  if (!reviewId) return NextResponse.json({ error: 'review_id required' }, { status: 400 });

  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from('comments')
    .select('id, review_id, user_id, parent_comment_id, body, created_at, updated_at, profiles!comments_user_id_profiles_fkey(username, avatar_url)')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tree = buildTree((data ?? []) as unknown as RawComment[]);
  return NextResponse.json({ comments: tree, count: data?.length ?? 0 });
}

// POST — create a comment (or reply)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { review_id, parent_comment_id, body } = await request.json();
  if (!review_id) return NextResponse.json({ error: 'review_id required' }, { status: 400 });
  if (!body?.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 });
  if (body.length > 2000) return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });

  const db = createServerSupabaseClient();

  // Verify review exists
  const { data: review } = await db.from('reviews').select('id, user_id').eq('id', review_id).single();
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  // If replying, verify parent comment exists and belongs to same review
  if (parent_comment_id) {
    const { data: parent } = await db.from('comments').select('id, review_id').eq('id', parent_comment_id).single();
    if (!parent) return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    if (parent.review_id !== review_id) return NextResponse.json({ error: 'Parent comment belongs to different review' }, { status: 400 });
  }

  const { data: comment, error } = await db
    .from('comments')
    .insert({ review_id, user_id: user.id, parent_comment_id: parent_comment_id ?? null, body: body.trim() })
    .select('id, review_id, user_id, parent_comment_id, body, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get commenter's profile info
  const { data: profile } = await db.from('profiles').select('username, avatar_url').eq('id', user.id).single();

  // Create notification for the review owner (if not self-commenting)
  if (review.user_id && review.user_id !== user.id) {
    const notifType = parent_comment_id ? 'reply' : 'comment';
    const actorName = profile?.username ?? 'Someone';
    const message = parent_comment_id
      ? `${actorName} replied to a comment on your review`
      : `${actorName} commented on your review`;

    await db.from('notifications').insert({
      user_id: review.user_id,
      type: notifType,
      actor_id: user.id,
      reference_id: comment.id,
      message,
    });
  }

  // If replying, also notify the parent comment author (if different from review owner and self)
  if (parent_comment_id) {
    const { data: parentComment } = await db.from('comments').select('user_id').eq('id', parent_comment_id).single();
    if (parentComment?.user_id && parentComment.user_id !== user.id && parentComment.user_id !== review.user_id) {
      const actorName = profile?.username ?? 'Someone';
      await db.from('notifications').insert({
        user_id: parentComment.user_id,
        type: 'reply',
        actor_id: user.id,
        reference_id: comment.id,
        message: `${actorName} replied to your comment`,
      });
    }
  }

  // Trigger email notification asynchronously (fire-and-forget)
  const origin = new URL(request.url).origin;
  fetch(`${origin}/api/send-notification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: parent_comment_id ? 'reply' : 'comment', actor_id: user.id, review_id, comment_id: comment.id }),
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    comment: { ...comment, username: profile?.username ?? 'Unknown', avatar_url: profile?.avatar_url ?? null, children: [] },
  });
}

// DELETE — delete own comment
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { comment_id } = await request.json();
  if (!comment_id) return NextResponse.json({ error: 'comment_id required' }, { status: 400 });

  const db = createServerSupabaseClient();

  // Verify ownership
  const { data: comment } = await db.from('comments').select('id, user_id').eq('id', comment_id).single();
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  if (comment.user_id !== user.id) return NextResponse.json({ error: 'Not your comment' }, { status: 403 });

  // Cascade delete handles children
  const { error } = await db.from('comments').delete().eq('id', comment_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
