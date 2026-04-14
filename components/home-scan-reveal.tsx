'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Wraps the scan form for logged-out visitors with a "peek then expand"
 * pattern. Starts collapsed showing a medium peek (~180px) of the scan
 * card with a fade-to-black gradient + a "Try it out first" teaser.
 * Expands to full height when:
 *   - the hash `#scan-section-reveal` is set (clicking the hero cta2 link)
 *   - the user clicks anywhere inside the peeked area
 *   - the `home-scan-reveal:open` window event fires
 */
export function HomeScanReveal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  // Open via hash (#scan-section-reveal) or custom event
  useEffect(() => {
    const openAndScroll = () => {
      setOpen(true);
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    const onHash = () => {
      if (window.location.hash === '#scan-section-reveal') openAndScroll();
    };
    const onEvent = () => openAndScroll();
    onHash();
    window.addEventListener('hashchange', onHash);
    window.addEventListener('home-scan-reveal:open', onEvent);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('home-scan-reveal:open', onEvent);
    };
  }, []);

  const handlePeekClick = () => {
    if (!open) setOpen(true);
  };

  return (
    <div
      id="scan-section-reveal"
      ref={sectionRef}
      className="relative transition-[max-height] duration-500 ease-out"
      style={{ maxHeight: open ? 4000 : 180, overflow: 'hidden' }}
    >
      {/* Click-anywhere-to-expand overlay (only active while collapsed) */}
      {!open && (
        <button
          type="button"
          aria-label="Reveal scan tools"
          onClick={handlePeekClick}
          className="absolute inset-0 z-20 cursor-pointer bg-transparent"
        />
      )}
      {children}

      {/* Fade + reveal prompt (only while collapsed) */}
      {!open && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-32 items-end justify-center bg-gradient-to-t from-black via-black/85 to-transparent pb-3">
          <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-500/10 transition hover:border-emerald-400 hover:text-emerald-200">
            <button
              type="button"
              onClick={handlePeekClick}
              className="cursor-pointer"
            >
              Try it out — tap to reveal ↓
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
