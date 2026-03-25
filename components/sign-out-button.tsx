'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
