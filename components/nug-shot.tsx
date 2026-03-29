'use client';

import { useRef, useState } from 'react';

type Props = {
  logId: string;
  initialUrl: string | null;
};

export function NugShot({ logId, initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('log_id', logId);
      const res = await fetch('/api/headshot', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed.');
      // Cache-bust so the browser shows the new image
      setUrl(data.url + '?t=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await fetch(`/api/headshot?log_id=${logId}`, { method: 'DELETE' });
      setUrl(null);
      setConfirmRemove(false);
    } catch {}
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {url && !confirmRemove && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="text-xs text-zinc-600 hover:text-rose-400 transition"
          >
            Remove
          </button>
        )}
        {confirmRemove && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Remove photo?</span>
            <button onClick={handleRemove} className="text-xs text-rose-400 hover:text-rose-300 transition">Yes</button>
            <button onClick={() => setConfirmRemove(false)} className="text-xs text-zinc-500 hover:text-zinc-300 transition">No</button>
          </div>
        )}
      </div>

      {url ? (
        /* Thumbnail — click to open lightbox */
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group relative w-full overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950"
        >
          <img
            src={url}
            alt="Nug headshot"
            className="w-full object-cover transition group-hover:brightness-90"
            style={{ maxHeight: '280px', objectFit: 'cover' }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <span className="rounded-full bg-zinc-950/70 px-3 py-1 text-xs text-zinc-200 backdrop-blur-sm">
              View full size
            </span>
          </div>
        </button>
      ) : (
        /* Upload prompt */
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-600">Snap your product for your records — stored privately, never used for scanning.</p>
          <div className="flex gap-2">
            {/* Camera capture */}
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition hover:border-yellow-500/40 hover:bg-zinc-800/60 active:scale-[0.99] disabled:opacity-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-100">Take photo</p>
                <p className="text-xs text-zinc-500">Use your camera</p>
              </div>
            </button>
            {/* Gallery upload */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition hover:border-emerald-500/40 hover:bg-zinc-800/60 active:scale-[0.99] disabled:opacity-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-100">Upload</p>
                <p className="text-xs text-zinc-500">From your gallery</p>
              </div>
            </button>
          </div>
          {uploading && <p className="text-xs text-emerald-400 text-center">Uploading…</p>}
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      )}

      {/* Replace button when photo exists */}
      {url && !confirmRemove && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs text-zinc-500 transition hover:border-yellow-500/30 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
          >
            📷 Retake
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs text-zinc-500 transition hover:border-emerald-500/30 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
          >
            🖼️ Replace
          </button>
        </div>
      )}
      {uploading && url && <p className="text-xs text-emerald-400">Uploading…</p>}
      {error && url && <p className="text-xs text-rose-400">{error}</p>}

      {/* Hidden file inputs */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {/* Fullscreen lightbox */}
      {lightbox && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition text-lg z-10"
          >
            ✕
          </button>
          <img
            src={url}
            alt="Nug headshot full size"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}