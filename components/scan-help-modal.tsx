'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'cbai_hide_scan_tutorial';

/**
 * Returns true if the tutorial should be auto-shown on first visit.
 * False if the user has already clicked "Don't show again".
 */
export function shouldAutoShowScanTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

function suppressScanTutorial() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** When true, shows the "Don't show again" button (first-time auto-pop). */
  allowSuppress?: boolean;
};

export function ScanHelpModal({ open, onClose, allowSuppress = true }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleNeverShow = () => {
    suppressScanTutorial();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to scan"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-zinc-300">How to scan</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Guide image */}
        <div className="px-3 pb-3">
          <img
            src="/scan-guide.jpg"
            alt="How to scan: take photos of the factory label, THC/CBD percent, ingredients, and any extra details"
            className="w-full rounded-xl border border-zinc-800"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 px-5 pb-5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition active:bg-emerald-300"
          >
            Got it
          </button>
          {allowSuppress && (
            <button
              type="button"
              onClick={handleNeverShow}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Don&apos;t show again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
