'use client';

import { IconRefresh } from '@/components/icons';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="space-y-4">
        <div className="flex justify-center text-zinc-600"><IconRefresh size={48} /></div>
        <h1 className="text-xl font-bold text-zinc-100">You&apos;re offline</h1>
        <p className="text-sm text-zinc-500">Check your connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
          Try again
        </button>
      </div>
    </main>
  );
}
