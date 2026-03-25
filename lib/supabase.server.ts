// This file uses next/headers and can ONLY be imported in Server Components or API routes.
// Never import this in a 'use client' file.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env as clientEnv } from '@/lib/env.client';

export const createAuthServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    clientEnv.nextPublicSupabaseUrl,
    clientEnv.nextPublicSupabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set here, that's fine
          }
        },
      },
    }
  );
};
