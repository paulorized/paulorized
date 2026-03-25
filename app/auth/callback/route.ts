import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const response = NextResponse.redirect(`${origin}/`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Sync session via the session API route so cookies are properly stored
      const sessionResponse = await fetch(`${origin}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      // Copy the session cookies from the API response onto our redirect
      const finalResponse = NextResponse.redirect(`${origin}/`);
      sessionResponse.headers.getSetCookie?.().forEach((cookie) => {
        finalResponse.headers.append('Set-Cookie', cookie);
      });
      return finalResponse;
    }

    console.error('exchangeCodeForSession error:', error?.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
