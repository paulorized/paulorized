'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
          </span>
          <p className="mt-2 text-sm text-zinc-500">Reset your password</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <p className="text-sm font-semibold text-emerald-300">Check your email</p>
              <p className="text-xs text-zinc-400">
                We sent a reset link to <span className="text-zinc-200">{email}</span>. Click it to set a new password.
              </p>
              <Link href="/login" className="block mt-4 text-xs text-emerald-400 hover:underline">Back to sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold text-zinc-100">Forgot password</h2>
              <p className="mb-6 text-xs text-zinc-500">Enter the email you signed up with and we&apos;ll send a reset link.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-zinc-400">Email address</label>
                  <input id="email" type="email" required value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-zinc-500">
                Remember it?{' '}
                <Link href="/login" className="text-emerald-400 hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
