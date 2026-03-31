'use client';

import { useState, useEffect } from 'react';

const EFFECTS = ['Relaxed', 'Euphoric', 'Creative', 'Focused', 'Sleepy', 'Happy', 'Hungry', 'Energetic', 'Pain Relief', 'Anxious'];
const FLAVORS = ['Earthy', 'Citrus', 'Pine', 'Sweet', 'Diesel', 'Floral', 'Berry', 'Spicy'];
const EDIBLE_FEELINGS = ['Relaxed', 'Sleepy', 'Euphoric', 'Creative', 'Focused', 'Anxious', 'Giggly', 'Hungry', 'Pain Relief', 'Social'];
const EDIBLE_DOSE_OPTIONS = [2.5, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200];

export type Review = {
  rating: number;
  would_buy_again: boolean | null;
  notes: string;
  effects: string[];
  flavors: string[];
  burn_speed: 'slow' | 'medium' | 'fast' | null;
  canoeing: boolean | null;
  clogging: boolean | null;
  edible_dose_mg: number | null;
  edible_onset: string | null;
  edible_peak_duration: string | null;
  edible_total_duration: string | null;
  edible_effect_type: string | null;
  edible_feelings: string[];
  edible_taste_rating: number | null;
  edible_dose_feedback: string | null;
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
  edible_dose_mg: null,
  edible_onset: null,
  edible_peak_duration: null,
  edible_total_duration: null,
  edible_effect_type: null,
  edible_feelings: [],
  edible_taste_rating: null,
  edible_dose_feedback: null,
};

type Props = { productLogId: string; productType?: string; userId?: string; suggestedEffects?: string[]; suggestedFlavors?: string[]; };

export function ReviewForm({ productLogId, productType, userId, suggestedEffects, suggestedFlavors }: Props) {
  const [review, setReview] = useState<Review>(emptyReview);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [error, setError] = useState('');

  const productTypeLower = (productType ?? '').toLowerCase();
  const isPreroll = productTypeLower.includes('pre');
  const isVape = productTypeLower.includes('vape') || productTypeLower.includes('cartridge') || productTypeLower.includes('cart');
  const isEdible = productTypeLower.includes('edible') || productTypeLower.includes('gummy') || productTypeLower.includes('chocolate') || productTypeLower.includes('candy') || productTypeLower.includes('beverage') || productTypeLower.includes('tincture');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reviews?product_log_id=${productLogId}`);
        const data = await res.json();
        if (data.review) {
          setHasExisting(true);
          setReview({
            rating: data.review.rating ?? 0,
            would_buy_again: data.review.would_buy_again ?? null,
            notes: data.review.notes ?? '',
            effects: data.review.effects ?? [],
            flavors: data.review.flavors ?? [],
            burn_speed: data.review.burn_speed ?? null,
            canoeing: data.review.canoeing ?? null,
            clogging: data.review.clogging ?? null,
            edible_dose_mg: data.review.edible_dose_mg ?? null,
            edible_onset: data.review.edible_onset ?? null,
            edible_peak_duration: data.review.edible_peak_duration ?? null,
            edible_total_duration: data.review.edible_total_duration ?? null,
            edible_effect_type: data.review.edible_effect_type ?? null,
            edible_feelings: data.review.edible_feelings ?? [],
            edible_taste_rating: data.review.edible_taste_rating ?? null,
            edible_dose_feedback: data.review.edible_dose_feedback ?? null,
          });
        } else if (suggestedEffects?.length || suggestedFlavors?.length) {
          // Pre-populate with AI suggestions for new reviews only
          setReview(prev => ({
            ...prev,
            effects: suggestedEffects?.filter(e => EFFECTS.includes(e)) ?? [],
            flavors: suggestedFlavors?.filter(f => FLAVORS.includes(f)) ?? [],
          }));
        }
      } catch { } finally { setIsLoading(false); }
    };
    load();
  }, [productLogId, suggestedEffects, suggestedFlavors]);

  const toggleTag = (list: 'effects' | 'flavors' | 'edible_feelings', tag: string) => {
    setReview((prev) => ({ ...prev, [list]: prev[list].includes(tag) ? prev[list].filter((t) => t !== tag) : [...prev[list], tag] }));
    setSaved(false);
  };

  const set = <K extends keyof Review>(key: K, value: Review[K]) => { setReview(p => ({ ...p, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    setIsSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_log_id: productLogId, user_id: userId, ...review }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save review.');
      setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save review.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <p className="text-sm text-zinc-500">Loading review...</p>;
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Rating</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((star) => (
            <button key={star} type="button" onClick={() => set('rating', star)}
              className={`text-2xl transition ${star <= review.rating ? 'text-yellow-400' : 'text-zinc-700 hover:text-yellow-400/50'}`}>&#9733;</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Effects</p>
        <div className="flex flex-wrap gap-2">
          {EFFECTS.map((effect) => (
            <button key={effect} type="button" onClick={() => toggleTag('effects', effect)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${review.effects.includes(effect) ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
            >{effect}</button>
          ))}
        </div>
      </div>
      {!isEdible && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-200">Flavors</p>
          <div className="flex flex-wrap gap-2">
            {FLAVORS.map((flavor) => (
              <button key={flavor} type="button" onClick={() => toggleTag('flavors', flavor)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${review.flavors.includes(flavor) ? 'border-amber-500/50 bg-amber-500/20 text-amber-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
              >{flavor}</button>
            ))}
          </div>
        </div>
      )}      {isPreroll && (
        <div className="space-y-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Pre-roll</p>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Burn speed</p>
            <div className="flex gap-2">
              {(['slow', 'medium', 'fast'] as const).map((speed) => (
                <button key={speed} type="button" onClick={() => set('burn_speed', review.burn_speed === speed ? null : speed)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${review.burn_speed === speed ? 'border-sky-500/50 bg-sky-500/20 text-sky-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                >{speed === 'slow' ? '🐢 Slow' : speed === 'medium' ? '👌 Medium' : '🔥 Fast'}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Did it canoe?</p>
            <div className="flex gap-2">
              {[{ label: '✅ Yes', value: true }, { label: '❌ No', value: false }].map(({ label, value }) => (
                <button key={label} type="button" onClick={() => set('canoeing', review.canoeing === value ? null : value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${review.canoeing === value ? 'border-sky-500/50 bg-sky-500/20 text-sky-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                >{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Did it clog?</p>
            <div className="flex gap-2">
              {[{ label: '✅ Yes', value: true }, { label: '❌ No', value: false }].map(({ label, value }) => (
                <button key={label} type="button" onClick={() => set('clogging', review.clogging === value ? null : value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${review.clogging === value ? 'border-sky-500/50 bg-sky-500/20 text-sky-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}      {isEdible && (
        <div className="space-y-5 rounded-xl border border-purple-700/40 bg-purple-900/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Edible Experience</p>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">How much did you take?</p>
            <select value={review.edible_dose_mg ?? ''} onChange={e => set('edible_dose_mg', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:border-purple-500 focus:outline-none">
              <option value="">Select mg...</option>
              {EDIBLE_DOSE_OPTIONS.map(mg => <option key={mg} value={mg}>{mg} mg</option>)}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Onset time</p>
            <div className="flex flex-wrap gap-2">
              {['Under 30 min', '30-60 min', '60-90 min', '90+ min'].map(opt => (
                <button key={opt} type="button" onClick={() => set('edible_onset', review.edible_onset === opt ? null : opt)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${review.edible_onset === opt ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Peak duration</p>
            <div className="flex flex-wrap gap-2">
              {['Under 1 hr', '1-2 hrs', '2-3 hrs', '3+ hrs'].map(opt => (
                <button key={opt} type="button" onClick={() => set('edible_peak_duration', review.edible_peak_duration === opt ? null : opt)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${review.edible_peak_duration === opt ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Total duration</p>
            <div className="flex flex-wrap gap-2">
              {['Under 2 hrs', '2-4 hrs', '4-6 hrs', '6+ hrs'].map(opt => (
                <button key={opt} type="button" onClick={() => set('edible_total_duration', review.edible_total_duration === opt ? null : opt)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${review.edible_total_duration === opt ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Effect type</p>
            <div className="flex gap-2">
              {['Body', 'Head', 'Both'].map(opt => (
                <button key={opt} type="button" onClick={() => set('edible_effect_type', review.edible_effect_type === opt ? null : opt)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${review.edible_effect_type === opt ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                >{opt === 'Body' ? '💪 Body' : opt === 'Head' ? '🧠 Head' : '✨ Both'}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">How did you feel?</p>
            <div className="flex flex-wrap gap-2">
              {EDIBLE_FEELINGS.map(feeling => (
                <button key={feeling} type="button" onClick={() => toggleTag('edible_feelings', feeling)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${review.edible_feelings.includes(feeling) ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                >{feeling}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Taste</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((star) => (
                <button key={star} type="button" onClick={() => set('edible_taste_rating', review.edible_taste_rating === star ? null : star)}
                  className={`text-2xl transition ${(review.edible_taste_rating ?? 0) >= star ? 'text-yellow-400' : 'text-zinc-700 hover:text-yellow-400/50'}`}>&#9733;</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Would you take the same dose again?</p>
            <div className="flex gap-2">
              {[{ value: 'same', label: '👌 Same dose' }, { value: 'lower', label: '⬇️ Go lower' }, { value: 'higher', label: '⬆️ Go higher' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => set('edible_dose_feedback', review.edible_dose_feedback === opt.value ? null : opt.value)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition ${review.edible_dose_feedback === opt.value ? 'border-purple-500/50 bg-purple-500/20 text-purple-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {isVape && (
        <div className="space-y-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vape</p>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Did it clog?</p>
            <div className="flex gap-2">
              {[{ label: '✅ Yes', value: true }, { label: '❌ No', value: false }].map(({ label, value }) => (
                <button key={label} type="button" onClick={() => set('clogging', review.clogging === value ? null : value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${review.clogging === value ? 'border-sky-500/50 bg-sky-500/20 text-sky-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Would buy again?</p>
        <div className="flex gap-2">
          {[{ label: '👍 Yes', value: true }, { label: '👎 No', value: false }].map(({ label, value }) => (
            <button key={label} type="button" onClick={() => set('would_buy_again', value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${review.would_buy_again === value ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}
            >{label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Notes</p>
        <textarea className="min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          placeholder="e.g. great for evenings, smooth smoke, too strong..."
          value={review.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={isSaving || review.rating === 0}
            className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >{isSaving ? 'Saving...' : hasExisting ? 'Update review' : 'Save review'}</button>
          {saved && <span className="text-sm text-emerald-400">&#10003; {hasExisting ? 'Review updated!' : 'Review saved!'}</span>}
          {error && <span className="text-sm text-rose-400">{error}</span>}
          {review.rating === 0 && !saved && <span className="text-xs text-zinc-500">Add a star rating to save</span>}
        </div>
        {!saved && <p className="text-xs text-emerald-400/70">Reviews with notes can be marked helpful by the community — helpful votes level up your rank 🌿→🌳</p>}
      </div>
    </div>
  );
}