'use client';

import { useState, useEffect } from 'react';
import { IconGolfBall, IconBattery, IconCup, IconScale } from '@/components/icons';

// ── Pound-club milestones ──────────────────────────────────────────────────
const POUND = 453.592; // grams per pound

// All milestones on the journey — club = big unlock moment
const ALL_MILESTONES = [
  { grams: POUND * 0.25,  label: '¼ lb',         club: false },
  { grams: POUND * 0.5,   label: '½ lb',          club: false },
  { grams: POUND * 1,     label: '1 Pound Club',  club: true  },
  { grams: POUND * 1.5,   label: '1½ lb',         club: false },
  { grams: POUND * 2,     label: '2 Pound Club',  club: true  },
  { grams: POUND * 3,     label: '3 Pound Club',  club: true  },
  { grams: POUND * 4,     label: '4 Pound Club',  club: true  },
  { grams: POUND * 5,     label: '5 Pound Club',  club: true  },
  { grams: POUND * 7.5,   label: '7½ lb',         club: false },
  { grams: POUND * 10,    label: '10 Pound Club', club: true  },
];

// Fun object that lives near the current weight for flavour
const FUN_OBJECTS = [
  { grams: 45.93,  singular: 'golf ball',     plural: 'golf balls',     icon: <IconGolfBall size={24} /> },
  { grams: 23,     singular: 'AA battery',    plural: 'AA batteries',   icon: <IconBattery size={24} /> },
  { grams: 171,    singular: 'iPhone',        plural: 'iPhones',        icon: <IconScale size={24} /> },
  { grams: 354,    singular: 'can of soda',   plural: 'cans of soda',   icon: <IconCup size={24} /> },
  { grams: 28.35,  singular: 'ounce',         plural: 'oz',             icon: <IconScale size={24} /> },
];

interface WeightWidgetProps {
  totalGrams: number;
  label?: string;
  sublabel?: string;
}

export function WeightWidget({
  totalGrams,
  label = 'Total Weight Logged',
  sublabel = 'across all your logs',
}: WeightWidgetProps) {
  const [funFact, setFunFact] = useState('');
  const [loadingFact, setLoadingFact] = useState(false);

  if (totalGrams <= 0) return null;

  // ── Which milestones are relevant? ─────────────────────────────────────
  // Find the next club milestone after current weight
  const nextClub = ALL_MILESTONES.find(m => m.club && m.grams > totalGrams)
    ?? ALL_MILESTONES[ALL_MILESTONES.length - 1];

  // The segment we display: 0 → nextClub.grams (or the club we just passed)
  const segmentEnd = nextClub.grams;
  const fillPct = Math.min((totalGrams / segmentEnd) * 100, 100);

  // Milestones to show in the current segment (0 → segmentEnd)
  const visibleMilestones = ALL_MILESTONES.filter(m => m.grams <= segmentEnd);

  // Unlocked clubs (passed already)
  const unlockedClubs = ALL_MILESTONES.filter(m => m.club && m.grams <= totalGrams);

  // Best fun-object comparison
  const bestObj = FUN_OBJECTS.reduce((best, obj) => {
    const count = totalGrams / obj.grams;
    const bestCount = totalGrams / best.grams;
    // Prefer counts between 2 and 20 for readability
    const score = (c: number) => Math.abs(Math.log(c) - Math.log(8));
    return score(count) < score(bestCount) ? obj : best;
  });
  const bestCount = totalGrams / bestObj.grams;
  const bestDisplay = bestCount >= 10
    ? Math.round(bestCount).toLocaleString()
    : bestCount.toFixed(1);

  // Weight display
  const displayWeight = totalGrams >= 1000
    ? (totalGrams / 1000).toFixed(2) + ' kg'
    : totalGrams.toFixed(1) + 'g';

  const fetchFunFact = async () => {
    setLoadingFact(true);
    try {
      const res = await fetch('/api/weight-fun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grams: totalGrams }),
      });
      const data = await res.json();
      setFunFact(data.comparison ?? '');
    } catch {}
    finally { setLoadingFact(false); }
  };

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-zinc-100">{displayWeight}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex justify-center text-zinc-300">{bestObj.icon}</div>
          <p className="text-sm font-bold text-zinc-100 mt-0.5">{bestDisplay}</p>
          <p className="text-[11px] text-zinc-500">{bestCount === 1 ? bestObj.singular : bestObj.plural}</p>
        </div>
      </div>

      {/* Unlocked clubs row */}
      {unlockedClubs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unlockedClubs.map(m => (
            <span key={m.label}
              className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 text-xs font-semibold text-yellow-300">
              <><img src="/icons/ui-trophy.png" alt="trophy" className="w-3.5 h-3.5 opacity-90" style={{ mixBlendMode: 'screen' }} />{m.label}</>
            </span>
          ))}
        </div>
      )}

      {/* Progress track */}
      <div>
        {/* Next target label */}
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] text-zinc-500">0g</p>
          <p className="text-[11px] text-emerald-400 font-semibold">
            <><img src="/icons/ui-target.png" alt="target" className="w-3 h-3 inline mr-1 opacity-80" style={{ mixBlendMode: 'screen' }} />Next:</> {nextClub.label} ({(nextClub.grams - totalGrams).toFixed(0)}g to go)
          </p>
        </div>

        {/* Track */}
        <div className="relative h-3 rounded-full bg-zinc-800 overflow-visible">
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${fillPct}%` }}
          />

          {/* Milestone pins */}
          {visibleMilestones.map(m => {
            const pct = (m.grams / segmentEnd) * 100;
            const passed = m.grams <= totalGrams;
            return (
              <div
                key={m.label}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                {/* Pin dot */}
                <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                  passed
                    ? m.club
                      ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                      : 'bg-emerald-400 border-emerald-300'
                    : 'bg-zinc-700 border-zinc-600'
                }`} />
              </div>
            );
          })}
        </div>

        {/* Milestone labels below track */}
        <div className="relative h-6 mt-1">
          {visibleMilestones.filter(m => m.club || m.grams <= POUND).map(m => {
            const pct = (m.grams / segmentEnd) * 100;
            const passed = m.grams <= totalGrams;
            return (
              <div
                key={m.label}
                className="absolute -translate-x-1/2 top-0"
                style={{ left: `${pct}%` }}
              >
                <p className={`text-[9px] font-medium whitespace-nowrap ${
                  passed ? (m.club ? 'text-yellow-400' : 'text-emerald-400') : 'text-zinc-600'
                }`}>
                  {m.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fun fact (optional, tap to reveal) */}
      {funFact ? (
        <div className="rounded-xl bg-zinc-900/60 px-4 py-3">
          <p className="text-sm text-zinc-300 leading-relaxed">{funFact}</p>
          <button onClick={fetchFunFact} disabled={loadingFact}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50">
            {loadingFact ? 'thinking…' : '↻ another'}
          </button>
        </div>
      ) : (
        <button onClick={fetchFunFact} disabled={loadingFact}
          className="w-full rounded-xl bg-zinc-900/40 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 transition disabled:opacity-50">
          {loadingFact ? 'thinking…' : ' get a fun comparison'}
        </button>
      )}

    </div>
  );
}
