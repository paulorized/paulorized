'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) return;

    // iOS detection — Safari doesn't support beforeinstallprompt
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android / Chrome — capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1');
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-zinc-900 px-4 py-4 shadow-xl shadow-zinc-950/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
            <span className="text-xl font-black">
              <span className="text-emerald-400">C</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-100">Add to Home Screen</p>
            {isIOS ? (
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Tap <span className="text-zinc-200">Share</span> <span className="text-zinc-500">⬆</span> then <span className="text-zinc-200">Add to Home Screen</span> to install CannaBaseAI.
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-0.5">
                Install the app for a faster, full-screen experience.
              </p>
            )}
          </div>
          <button onClick={handleDismiss} className="shrink-0 text-zinc-600 hover:text-zinc-400 transition p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {!isIOS && (
          <div className="mt-3 flex gap-2">
            <button onClick={handleInstall}
              className="flex-1 rounded-xl bg-emerald-400 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
              Install
            </button>
            <button onClick={handleDismiss}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700">
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
