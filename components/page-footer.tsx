'use client';

import { useState } from 'react';

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type: 'general' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-100 text-base">Leave feedback</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Your note goes straight to the developer</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition text-sm">
            ✕
          </button>
        </div>
        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-center space-y-1">
            <p className="text-2xl">🙏</p>
            <p className="font-medium text-emerald-400 text-sm">Thanks for the feedback!</p>
            <p className="text-xs text-zinc-500">It really helps improve the app.</p>
            <button type="button" onClick={onClose}
              className="mt-3 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none resize-none min-h-28"
              placeholder="Bug reports, feature ideas, general thoughts…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={1000}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{message.length}/1000</span>
              {error && <span className="text-xs text-rose-400">{error}</span>}
            </div>
            <button type="submit" disabled={sending || !message.trim()}
              className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {sending ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function PageFooter() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <div className="mt-2 flex flex-col gap-2">
        {/* Discord */}
        <a
          href="https://discord.gg/MTNvDM4MS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
        >
          <span>💬</span>
          <div>
            <p className="text-xs font-medium text-indigo-300">Enjoying CannaBaseAI? Join our Discord</p>
            <p className="text-xs text-zinc-600">Share feedback &amp; chat with the community</p>
          </div>
          <span className="ml-auto text-indigo-500 text-sm">›</span>
        </a>

        {/* Feedback */}
        <button
          type="button"
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 px-5 py-3 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
        >
          <span>✏️</span>
          <span>Leave feedback for the developer</span>
        </button>

      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
}