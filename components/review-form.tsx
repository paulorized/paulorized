'use client';

import { useState, useEffect } from 'react';

const EFFECTS = ['Relaxed', 'Euphoric', 'Creative', 'Focused', 'Sleepy', 'Happy', 'Hungry', 'Energetic', 'Pain Relief', 'Anxious'];
const FLAVORS = ['Earthy', 'Citrus', 'Pine', 'Sweet', 'Diesel', 'Floral', 'Berry', 'Spicy'];

export type Review = {
  rating: number;
  would_buy_again: boolean | null;
  notes: string;
  effects: string[];
  flavors: string[];
  burn_speed: 'slow' | 'medium' | 'fast' | null;
  canoeing: boolean | null;
  clogging: boolean | null;
};

const emptyReview: Review = {
  rating: 0,
  would_buy_again: null,
  notes: '',
  effects: [],
  flavors: [],
  burn_speed: null,
  canoeing: null,
  clogging: null,
};

type Props = {
  productLogId: string;
  productType?: string;
  userId?: string;
};

export function ReviewForm({ productLogId, productType, userId }: Props) {
  const [review, setReview] = useState<Review>(emptyReview);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isPreroll = (productType ?? '').toLowerCase().includes('pre');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reviews?product_log_id=${productLogId}`);
        const data = await res.json();
        if (data.review) {
          setReview({
            rating: data.review.rating ?? 0,
            would_buy_again: data.review.would_buy_again ?? null,
            notes: data.review.notes ?? '',
            effects: data.review.effects ?? [],
            flavors: data.review.flavors ?? [],
            burn_speed: data.review.burn_speed ?? null,
            canoeing: data.review.canoeing ?? null,
            clogging: data.review.clogging ?? null,
          });
        }
      } catch {
        // No existing review
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [productLogId]);

  const toggleTag = (list: 'effects' | 'flavors', tag: string) => {
    setReview((prev) => ({
      ...prev,
      [list]: prev[list].includes(tag)
        ? prev[list].filter((t) => t !== tag)
        : [...prev[list], tag],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_log_id: productLogId, user_id: userId, ...review }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save review.');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading review…</p>;
  }

  return (
    <div className="space-y-5">

      {/* Star rating */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => { setReview((p) => ({ ...p, rating: star })); setSaved(false); }}
              className={`text-2xl transition ${star <= review.rating ? 'text-yellow-400' : 'text-zinc-700 hover:text-yellow-400/50'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Effects */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Effects</p>
        <div className="flex flex-wrap gap-2">
          {EFFECTS.map((effect) => (
            <button
              key={effect}
              type="button"
              onClick={() => toggleTag('effects', effect)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review.effects.includes(effect)
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {effect}
            </button>
          ))}
        </div>
      </div>

      {/* Flavors */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Flavors</p>
        <div className="flex flex-wrap gap-2">
          {FLAVORS.map((flavor) => (
            <button
              key={flavor}
              type="button"
              onClick={() => toggleTag('flavors', flavor)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                review.flavors.includes(flavor)
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {flavor}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-roll specific section */}
      {isPreroll && (
        <div className="space-y-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pre-roll</p>

          {/* Burn speed */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Burn speed</p>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => { setReview((p) => ({ ...p, burn_speed: p.burn_speed === speed ? null : speed })); setSaved(false); }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                    review.burn_speed === speed
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {speed === 'slow' ? '🐢 Slow' : speed === 'medium' ? '👌 Medium' : '🔥 Fast'}
                </button>
              ))}
            </div>
          </div>

          {/* Canoeing */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Did it canoe?</p>
            <div className="flex gap-2">
              {[{ label: '✅ Yes', value: true }, { label: '❌ No', value: false }].map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setReview((p) => ({ ...p, canoeing: p.canoeing === value ? null : value })); setSaved(false); }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    review.canoeing === value
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clogging */}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Did it clog?</p>
            <div className="flex gap-2">
              {[{ label: '✅ Yes', value: true }, { label: '❌ No', value: false }].map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setReview((p) => ({ ...p, clogging: p.clogging === value ? null : value })); setSaved(false); }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    review.clogging === value
                      ? 'border-sky-500/50 bg-sky-500/20 text-sky-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Would buy again */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Would buy again?</p>
        <div className="flex gap-2">
          {[{ label: '👍 Yes', value: true }, { label: '👎 No', value: false }].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => { setReview((p) => ({ ...p, would_buy_again: value })); setSaved(false); }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                review.would_buy_again === value
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Notes</p>
        <textarea
          className="min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          placeholder="e.g. great for evenings, smooth smoke, too strong…"
          value={review.notes}
          onChange={(e) => { setReview((p) => ({ ...p, notes: e.target.value })); setSaved(false); }}
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || review.rating === 0}
          className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
        >
          {isSaving ? 'Saving…' : 'Save review'}
        </button>
        {saved && <span className="text-sm text-emerald-400">✅ Review saved!</span>}
        {error && <span className="text-sm text-rose-400">{error}</span>}
        {review.rating === 0 && !saved && <span className="text-xs text-zinc-500">Add a star rating to save</span>}
      </div>
    </div>
  );
}
