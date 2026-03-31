'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Registers the service worker silently — no banner shown automatically.
// The install trigger is exposed via the global `window.__pwaInstall` function
// so other components (e.g. profile menu) can call it on demand.
export function PWAPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Register service worker silently
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (ios) {
      setIsIOS(true);
    }

    // Capture Android/Chrome install prompt for later use
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Expose trigger so other components can call window.__pwaInstall?.()
  useEffect(() => {
    (window as Window & { __pwaInstall?: () => void; __pwaIsIOS?: boolean }).__pwaIsIOS = isIOS;
    (window as Window & { __pwaInstall?: () => void }).__pwaInstall = async () => {
      if (isIOS) {
        setShowIOSHint(true);
        return;
      }
      if (installEvent) {
        await installEvent.prompt();
      }
    };
  }, [installEvent, isIOS]);

  if (!showIOSHint) return null;

  // iOS-only: show a small hint overlay when triggered manually
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-safe bg-zinc-950/70 backdrop-blur-sm"
      onClick={() => setShowIOSHint(false)}>
      <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-zinc-900 p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold text-zinc-100">Add to Home Screen</p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Tap <span className="text-zinc-200 font-medium">Share</span> <span className="text-zinc-500">⬆</span> at the bottom of Safari, then tap <span className="text-zinc-200 font-medium">Add to Home Screen</span>.
        </p>
        <button onClick={() => setShowIOSHint(false)}
          className="w-full rounded-xl bg-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition">
          Got it
        </button>
      </div>
    </div>
  );
}
