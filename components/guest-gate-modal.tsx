'use client';

import Link from 'next/link';
import { IconLeaf } from '@/components/icons';

type Props = {
  reason: 'limit' | 'save';
  onClose: () => void;
};

export function GuestGateModal({ reason, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-900 p-6 space-y-5 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <IconLeaf size={28} />
          </span>
        </div>

        {/* Copy */}
        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-bold text-zinc-100">
            {reason === 'limit'
              ? "You've used all 10 free scans"
              : 'Save your scan'}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {reason === 'limit'
              ? 'Create a free account to keep scanning and save your full history.'
              : 'Create a free account to log this product and track your cannabis journey.'}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <Link
            href="/signup"
            className="w-full rounded-2xl bg-emerald-400 py-3.5 text-center text-base font-bold text-zinc-950 hover:bg-emerald-300 transition active:scale-[0.98]"
          >
            Create free account →
          </Link>
          <Link
            href="/login"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 py-3 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition"
          >
            Already have an account? Sign in
          </Link>
          {reason === 'save' && (
            <button
              onClick={onClose}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition pt-1"
            >
              Keep browsing without saving
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
