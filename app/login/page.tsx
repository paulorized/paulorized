'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight text-emerald-400">CannaBase</span>
          <p className="mt-2 text-sm text-zinc-500">Track what you love</p>
        </div>

        {sent ? (
          /* Success state */
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8 text-center">
            <div className="mb-3 text-4xl">📬</div>
            <h2 className="font-semibold text-zinc-100">Check your email</h2>
            <p className="mt-2 text-sm text-zinc-400">
              We sent a magic link to <span className="text-zinc-200">{email}</span>.
              Click the link in the email to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="mt-5 text-sm text-zinc-500 underline hover:text-zinc-300"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Login form */
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
            <h2 className="mb-1 text-lg font-semibold text-zinc-100">Sign in</h2>
            <p className="mb-6 text-sm text-zinc-500">
              Enter your email and we&apos;ll send you a link to sign in.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-400">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
