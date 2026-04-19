'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { IconCheck, IconLink } from '@/components/icons';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase sets the session from the URL hash when the page loads
    const supabase = createBrowserSupabaseClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.replace('/'), 2500);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
          </span>
          <p className="mt-2 text-sm text-zinc-500">Set a new password</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
          {done ? (
            <div className="text-center space-y-3">
              <div className="flex justify-center text-emerald-400"><IconCheck size={40} /></div>
              <p className="text-sm font-semibold text-emerald-300">Password updated!</p>
              <p className="text-xs text-zinc-400">Redirecting you to the app…</p>
            </div>
          ) : !ready ? (
            <div className="text-center space-y-3">
              <div className="flex justify-center text-zinc-400"><IconLink size={40} /></div>
              <p className="text-sm font-semibold text-zinc-300">Verifying reset link…</p>
              <p className="text-xs text-zinc-500">Make sure you clicked the link from your email.</p>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-lg font-semibold text-zinc-100">New password</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">New password</label>
                  <input type="password" required minLength={6} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Confirm password</label>
                  <input type="password" required minLength={6} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Same as above"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50">
                  {loading ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
