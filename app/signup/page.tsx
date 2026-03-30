'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (data.session) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });
      window.location.href = '/profile?setup=1';
      return;
    }

    window.location.href = '/login?message=check-email';
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight text-emerald-400">CannaBaseAI</span>
          <p className="mt-2 text-sm text-zinc-500">Track what you love</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
          <h2 className="mb-6 text-lg font-semibold text-zinc-100">Create account</h2>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-400">Email address</label>
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-400">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
              disabled={loading}
              className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
