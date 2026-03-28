import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export const metadata: Metadata = {
  title: 'CannaBaseAI',
  description: 'Scan cannabis product labels, track your collection, and log your experience.',
};

const BUBBLE_COLORS = [
  'bg-emerald-600', 'bg-purple-600', 'bg-yellow-500', 'bg-sky-600',
  'bg-rose-600', 'bg-orange-500', 'bg-teal-600', 'bg-indigo-600',
];

function getBubbleColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}

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

  const bubbleColor = userId ? getBubbleColor(userId) : 'bg-zinc-700';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/?reset=1" className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
              </span>
            </Link>
            <nav className="flex items-center gap-0.5">
              {userId ? (
                <>
                  <Link href="/" className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">
                    Scan
                  </Link>
                  <Link href="/history" className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">
                    History
                  </Link>
                  <Link href="/dashboard" className="rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">
                    Stats
                  </Link>
                  <Link href="/strain-search" className="rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-zinc-800 whitespace-nowrap">
                    <span className="text-yellow-300 font-semibold">StrainAI</span>
                  </Link>
                  <Link href="/profile" className="ml-1 flex shrink-0 items-center rounded-full transition hover:opacity-80">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={username ?? 'avatar'}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full bg-zinc-800 object-cover ring-2 ring-zinc-700 hover:ring-emerald-500 transition"
                      />
                    ) : (
                      <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-zinc-700 hover:ring-emerald-500 transition " + bubbleColor}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                          <path d="M12 2C9.5 2 7.5 3.5 6.8 5.7 5.2 5.3 3.5 6.2 2.8 7.8c-.8 1.8 0 3.9 1.7 4.8C3.8 14.8 5.2 16 7 16h1v4a1 1 0 0 0 2 0v-4h2v4a1 1 0 0 0 2 0v-4h1c1.8 0 3.2-1.2 3.5-3.4 1.7-.9 2.5-3 1.7-4.8-.7-1.6-2.4-2.5-4-2.1C15.5 3.5 13.8 2 12 2z"/>
                        </svg>
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <div className="w-full">
          {children}
        </div>
      </body>
    </html>
  );
}