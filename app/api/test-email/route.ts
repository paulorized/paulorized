import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || 'CannaBaseAI <notifications@cannabaseai.com>';

  const diagnostics: Record<string, unknown> = {
    has_resend_key: !!RESEND_API_KEY,
    resend_key_prefix: RESEND_API_KEY?.slice(0, 8) + '...',
    from_email: FROM_EMAIL,
  };

  try {
    const db = createServerSupabaseClient();
    const { data, error } = await db.auth.admin.getUserById('21607455-cdec-420a-9f23-a7b91c454eae');
    diagnostics.getUserById_ok = !error;
    diagnostics.getUserById_email = data?.user?.email ?? null;
    if (error) diagnostics.getUserById_error = error.message;
  } catch (e) {
    diagnostics.getUserById_error = String(e);
  }

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ['paul@paulorized.com'],
          subject: 'CannaBaseAI Diagnostic Test',
          html: '<p>This was sent from /api/test-email on Vercel.</p>',
        }),
      });
      const resBody = await res.json();
      diagnostics.resend_status = res.status;
      diagnostics.resend_response = resBody;
    } catch (e) {
      diagnostics.resend_error = String(e);
    }
  }

  return NextResponse.json(diagnostics);
}
