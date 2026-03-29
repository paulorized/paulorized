import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be 1000 characters or fewer.' }, { status: 400 });
    }

    // Get current user (optional)
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const supabase = await createAuthServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
    } catch {
      // Not logged in - still allow feedback
    }

    const db = createServerSupabaseClient();
    const { error } = await db.from('feedback').insert({
      user_id: userId,
      message: message.trim(),
      type: type ?? 'general',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'CannaBaseAI <onboarding@resend.dev>',
          to: 'pvalerio862@gmail.com',
          subject: 'New feedback on CannaBaseAI',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
              <h2 style="color:#10b981;margin-bottom:4px;">New Feedback</h2>
              <p style="color:#6b7280;font-size:14px;margin-top:0;">Someone left a note on CannaBaseAI</p>
              <div style="background:#18181b;border-radius:12px;padding:20px;margin:20px 0;">
                <p style="color:#f4f4f5;font-size:15px;margin:0;white-space:pre-wrap;">${message.trim()}</p>
              </div>
              ${userEmail ? `<p style="color:#6b7280;font-size:13px;">From: ${userEmail}</p>` : '<p style="color:#6b7280;font-size:13px;">From: anonymous user</p>'}
              <p style="color:#6b7280;font-size:13px;">Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
            </div>
          `,
        }),
      }).catch(() => {
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
