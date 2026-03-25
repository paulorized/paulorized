'use client';

import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function AuthConfirmPage() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe();
        window.location.replace('/');
      }
    });

    // Also check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-3 text-3xl animate-pulse">🌿</div>
        <p className="text-sm text-zinc-400">Signing you in…</p>
      </div>
    </main>
  );
}
