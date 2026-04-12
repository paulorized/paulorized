import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'CannaBaseAI <notifications@cannabaseai.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cannabaseai.com';

// Map notification types to preference column names
const TYPE_TO_PREF: Record<string, string> = {
  comment: 'email_comments',
  reply: 'email_replies',
  follow: 'email_follows',
  helpful: 'email_helpful',
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[send-notification] RESEND_API_KEY not set, skipping email');
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
}

function emailTemplate(heading: string, body: string, ctaUrl: string, ctaLabel: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
  <div style="margin-bottom:24px">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">
      <span style="color:#34d399">Canna</span><span style="color:#a78bfa">Base</span><span style="color:#fde047">AI</span>
    </span>
  </div>
  <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px">
    <h2 style="color:#f4f4f5;font-size:16px;margin:0 0 12px">${heading}</h2>
    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px">${body}</p>
    <a href="${ctaUrl}" style="display:inline-block;background:#34d399;color:#09090b;font-weight:600;font-size:14px;padding:10px 24px;border-radius:12px;text-decoration:none">${ctaLabel}</a>
  </div>
  <p style="color:#52525b;font-size:11px;margin-top:20px;text-align:center">
    You can manage your email preferences in your <a href="${APP_URL}/profile?tab=settings" style="color:#34d399">profile settings</a>.
  </p>
</div>
</body></html>`;
}

// POST — internal endpoint to send email notifications
// Called fire-and-forget from other API routes
export async function POST(request: NextRequest) {
  try {
    const { type, actor_id, review_id } = await request.json();
    if (!type || !actor_id) return NextResponse.json({ error: 'type and actor_id required' }, { status: 400 });

    const db = createServerSupabaseClient();

    // Get actor profile
    const { data: actor } = await db.from('profiles').select('username').eq('id', actor_id).single();
    const actorName = actor?.username ?? 'Someone';

    // Determine who to notify based on type
    let targetUserId: string | null = null;

    if ((type === 'comment' || type === 'reply') && review_id) {
      const { data: review } = await db.from('reviews').select('user_id').eq('id', review_id).single();
      targetUserId = review?.user_id ?? null;
    } else if (type === 'follow') {
      // For follows, the target is passed directly
      const body = await request.clone().json();
      targetUserId = body.target_user_id ?? null;
    } else if (type === 'helpful' && review_id) {
      const { data: review } = await db.from('reviews').select('user_id').eq('id', review_id).single();
      targetUserId = review?.user_id ?? null;
    }

    if (!targetUserId || targetUserId === actor_id) {
      return NextResponse.json({ skipped: true, reason: 'No target or self-action' });
    }

    // Check user's notification preferences
    const prefCol = TYPE_TO_PREF[type];
    if (prefCol) {
      const { data: prefs } = await db.from('notification_preferences').select('*').eq('user_id', targetUserId).single();
      if (prefs && (prefs as unknown as Record<string, boolean>)[prefCol] === false) {
        return NextResponse.json({ skipped: true, reason: 'User opted out' });
      }
    }

    // Get target user's email from auth.users
    const { data: { users }, error: listErr } = await db.auth.admin.listUsers({ filter: `id:eq:${targetUserId}` });
    if (listErr || !users?.length) {
      // Fallback: try getting email via raw query
      const { data: authUser } = await db.rpc('get_user_email', { uid: targetUserId }).single();
      if (!authUser?.email) return NextResponse.json({ skipped: true, reason: 'No email found' });
    }

    const targetEmail = users?.[0]?.email;
    if (!targetEmail) return NextResponse.json({ skipped: true, reason: 'No email' });

    // Build email content based on type
    let subject = '';
    let heading = '';
    let body = '';
    let ctaUrl = `${APP_URL}/community`;
    const ctaLabel = 'View on CannaBaseAI';

    switch (type) {
      case 'comment':
        subject = `${actorName} commented on your review`;
        heading = 'New comment on your review';
        body = `${actorName} left a comment on one of your reviews. Check it out!`;
        break;
      case 'reply':
        subject = `${actorName} replied to your comment`;
        heading = 'New reply to your comment';
        body = `${actorName} replied to a comment you left. Join the conversation!`;
        break;
      case 'follow':
        subject = `${actorName} started following you`;
        heading = 'New follower!';
        body = `${actorName} is now following you on CannaBaseAI.`;
        ctaUrl = `${APP_URL}/u/${actorName}`;
        break;
      case 'helpful':
        subject = `${actorName} found your review helpful`;
        heading = 'Your review was helpful!';
        body = `${actorName} marked one of your reviews as helpful. Keep sharing your experiences!`;
        break;
    }

    await sendEmail(targetEmail, subject, emailTemplate(heading, body, ctaUrl, ctaLabel));

    // Mark the notification as emailed
    await db.from('notifications')
      .update({ emailed: true })
      .eq('user_id', targetUserId)
      .eq('actor_id', actor_id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-notification] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
