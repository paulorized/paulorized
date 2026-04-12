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

  // Create notification for the review author
  if (review.user_id && review.user_id !== user.id) {
    const { data: voterProfile } = await db.from('profiles').select('username').eq('id', user.id).single();
    const actorName = voterProfile?.username ?? 'Someone';
    await db.from('notifications').insert({
      user_id: review.user_id,
      type: 'helpful',
      actor_id: user.id,
      reference_id: review_id,
      message: `${actorName} found your review helpful`,
    });

    // Send email inline (fire-and-forget fetch doesn't survive Vercel serverless lifecycle)
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        const { data: prefs } = await db.from('notification_preferences').select('*').eq('user_id', review.user_id).single();
        if (!prefs || (prefs as unknown as Record<string, boolean>)['email_helpful'] !== false) {
          const { data: { user: targetUser } } = await db.auth.admin.getUserById(review.user_id);
          if (targetUser?.email) {
            const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'CannaBaseAI <notifications@cannabaseai.com>';
            const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cannabaseai.com';
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,sans-serif"><div style="max-width:480px;margin:0 auto;padding:32px 24px"><div style="margin-bottom:24px"><span style="font-size:20px;font-weight:800;letter-spacing:-0.5px"><span style="color:#34d399">Canna</span><span style="color:#a78bfa">Base</span><span style="color:#fde047">AI</span></span></div><div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px"><h2 style="color:#f4f4f5;font-size:16px;margin:0 0 12px">Your review was helpful!</h2><p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px">${actorName} marked one of your reviews as helpful. Keep sharing your experiences!</p><a href="${APP_URL}/community" style="display:inline-block;background:#34d399;color:#09090b;font-weight:600;font-size:14px;padding:10px 24px;border-radius:12px;text-decoration:none">View on CannaBaseAI</a></div><p style="color:#52525b;font-size:11px;margin-top:20px;text-align:center">You can manage your email preferences in your <a href="${APP_URL}/profile?tab=settings" style="color:#34d399">profile settings</a>.</p></div></body></html>`;
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: FROM_EMAIL, to: [targetUser.email], subject: `${actorName} found your review helpful`, html }),
            });
            await db.from('notifications').update({ emailed: true }).eq('user_id', review.user_id).eq('actor_id', user.id).eq('read', false).order('created_at', { ascending: false }).limit(1);
          }
        }
      }
    } catch (e) { console.error('[helpful-email]', e); }
  }

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
