import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createAuthServerClient } from '@/lib/supabase.server';
import SignOutButton from '@/components/sign-out-button';

export const metadata: Metadata = {
  title: 'CannaBase',
  description: 'Scan cannabis product labels, track your collection, and log your experience.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Get the logged-in user (if any) to show in the nav
  let userEmail: string | null = null;
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Not logged in or middleware hasn't run yet — that's fine
  }

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-emerald-400">CannaBase</span>
            </Link>
            <nav className="flex items-center gap-1">
              {userEmail ? (
                <>
                  <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    Scan
                  </Link>
                  <Link href="/history" className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
                    My Log
                  </Link>
                  <SignOutButton />
                </>
              ) : null}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
