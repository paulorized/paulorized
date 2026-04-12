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

  // Create notification for the followed user
  const { data: followerProfile } = await db.from('profiles').select('username').eq('id', user.id).single();
  const actorName = followerProfile?.username ?? 'Someone';
  await db.from('notifications').insert({
    user_id: user_id,
    type: 'follow',
    actor_id: user.id,
    reference_id: user.id,
    message: `${actorName} started following you`,
  });

  // Send email inline (fire-and-forget fetch doesn't survive Vercel serverless lifecycle)
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      const { data: prefs } = await db.from('notification_preferences').select('*').eq('user_id', user_id).single();
      if (!prefs || (prefs as unknown as Record<string, boolean>)['email_follows'] !== false) {
        const { data: { user: targetUser } } = await db.auth.admin.getUserById(user_id);
        if (targetUser?.email) {
          const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'CannaBaseAI <notifications@cannabaseai.com>';
          const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cannabaseai.com';
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,sans-serif"><div style="max-width:480px;margin:0 auto;padding:32px 24px"><div style="margin-bottom:24px"><span style="font-size:20px;font-weight:800;letter-spacing:-0.5px"><span style="color:#34d399">Canna</span><span style="color:#a78bfa">Base</span><span style="color:#fde047">AI</span></span></div><div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px"><h2 style="color:#f4f4f5;font-size:16px;margin:0 0 12px">New follower!</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px">${actorName} is now following you on CannaBaseAI.</p><a href="${APP_URL}/u/${actorName}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:600;font-size:14px;padding:10px 24px;border-radius:12px;text-decoration:none">View on CannaBaseAI</a></div><p style="color:#52525b;font-size:11px;margin-top:20px;text-align:center">You can manage your email preferences in your <a href="${APP_URL}/profile?tab=settings" style="color:#34d399">profile settings</a>.</p></div></body></html>`;
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to: [targetUser.email], subject: `${actorName} started following you`, html }),
          });
          await db.from('notifications').update({ emailed: true }).eq('user_id', user_id).eq('actor_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(1);
        }
      }
    }
  } catch (e) { console.error('[follow-email]', e); }

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
