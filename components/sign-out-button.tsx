'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut({ scope: 'global' });
    // Hard navigate to clear all server-side session state
    window.location.replace('/login');
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
    >
      Sign out
    </button>
  );
}
