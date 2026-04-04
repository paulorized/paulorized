import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});
import { ThemeProvider } from '@/components/theme-provider';
import { PWAPrompt } from '@/components/pwa-prompt';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
      avatarUrl = profile?.avatar_url ?? null;
    }
  } catch {}

  const bubbleColor = userId ? getBubbleColor(userId) : 'bg-zinc-700';

  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CannaBase" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <ThemeProvider>
          <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
            <div className="mx-auto w-full max-w-2xl px-4">
              {/* Row 1: Logo + Avatar */}
              <div className="flex items-center justify-between py-2.5">
                <Link href="/?reset=1" className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-montserrat)]">
                    <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
                  </span>
                </Link>
                {userId ? (
                  <Link href="/profile" className="flex shrink-0 items-center rounded-full transition hover:opacity-80">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full object-cover border border-zinc-700" />
                    ) : (
                      <div className={'h-8 w-8 rounded-full flex items-center justify-center ' + bubbleColor}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white opacity-90">
                          <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 8c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3zm9 11v-1c0-3.859-3.141-7-7-7h-4c-3.859 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1h2z"/>
                        </svg>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">Sign in</Link>
                    <Link href="/signup" className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">Create account</Link>
                  </div>
                )}
              </div>
              {/* Row 2: Nav links (only when logged in) */}
              {userId && (
                <nav className="flex items-center justify-between border-t border-zinc-800/40 pb-1.5 pt-1">
                  <Link href="/" className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">Scan</Link>
                  <Link href="/history" className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">History</Link>
                  <Link href="/dashboard" className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 whitespace-nowrap">Stats</Link>
                  <Link href="/community" className="rounded-lg px-2 py-1 text-xs transition hover:bg-zinc-800 whitespace-nowrap">
                    <span className="text-teal-400 font-semibold">Community</span>
                  </Link>
                  <Link href="/wishlist" className="rounded-lg px-2 py-1 text-xs transition hover:bg-zinc-800 whitespace-nowrap">
                    <span className="text-purple-400 font-semibold">Wishlist</span>
                  </Link>
                  <Link href="/strains" className="rounded-lg px-2 py-1 text-xs transition hover:bg-zinc-800 whitespace-nowrap">
                    <span className="text-yellow-300 font-semibold">StrainAI</span>
                  </Link>
                </nav>
              )}
            </div>
          </header>
          <div className="w-full">{children}</div>
          <PWAPrompt />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
