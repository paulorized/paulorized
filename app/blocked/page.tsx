'use client';

import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function BlockedPage() {
  useEffect(() => {
    // Sign them out so they can't navigate around the block
    const supabase = createBrowserSupabaseClient();
    supabase.auth.signOut();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="mb-6 text-6xl">🚫</div>
        <h1 className="mb-3 text-2xl font-bold text-zinc-100">Age Requirement Not Met</h1>
        <p className="mb-2 text-zinc-400">
          CannaBaseAI is only available to users who are <span className="text-white font-semibold">21 years of age or older.</span>
        </p>
        <p className="text-sm text-zinc-600">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </main>
  );
}
