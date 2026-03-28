import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';
import SignOutButton from '@/components/sign-out-button';

export const metadata: Metadata = {
  title: 'CannaBaseAI',
  description: 'Scan cannabis product labels, track your collection, and log your experience.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let userId: string | null = null;
  let username: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (userId) {
      const db = createServerSupabaseClient();
      const { data: profile } = await db
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      username = profile?.username ?? null;
      avatarUrl = profile?.avatar_url ?? null;
    }
  } catch {
    // Not logged in
  }

  const displayName = username ? ('@' + username) : 'Profile';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/?reset=1" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {userId ? (
                <>
                  <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    Scan
                  </Link>
                  <Link href="/history" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    History
                  </Link>
                  <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    Stats
                  </Link>
                  <Link href="/strain-search" className="rounded-lg px-3 py-1.5 text-sm transition hover:bg-zinc-800">
                    <span className="text-yellow-300 font-semibold">StrainAI</span>
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username ?? 'avatar'}
                        className="h-6 w-6 rounded-full bg-zinc-800 object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs">??</span>
                    )}
                    <span className="hidden sm:inline">{displayName}</span>
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}