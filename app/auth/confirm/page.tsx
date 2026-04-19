'use client';

import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { IconLeaf } from '@/components/icons';

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
        <div className="mb-3 flex justify-center text-emerald-400 animate-pulse"><IconLeaf size={36} /></div>
        <p className="text-sm text-zinc-400">Signing you in…</p>
      </div>
    </main>
  );
}
