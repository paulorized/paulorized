'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MAX_SCANS = 10;
const STORAGE_KEY = 'cbai_guest_scans';

export function getGuestScanCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
}

export function incrementGuestScanCount(): number {
  const next = getGuestScanCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function isGuestLimitReached(): boolean {
  return getGuestScanCount() >= MAX_SCANS;
}

export function GuestBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getGuestScanCount());
    const handler = () => setCount(getGuestScanCount());
    window.addEventListener('cbai_scan_used', handler);
    return () => window.removeEventListener('cbai_scan_used', handler);
  }, []);

  const remaining = Math.max(0, MAX_SCANS - count);
  const pct = Math.round((count / MAX_SCANS) * 100);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-300">
          {remaining > 0
            ? `${remaining} free scan${remaining === 1 ? '' : 's'} remaining`
            : 'Free scans used up'}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Create a free account to save your scans and unlock everything
        </p>
      </div>
      <Link
        href="/signup"
        className="shrink-0 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-300 transition"
      >
        Sign up free
      </Link>
    </div>
  );
}
