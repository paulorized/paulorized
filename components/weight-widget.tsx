'use client';

// Golf ball: 45.93g  |  AA battery: 23g  |  iPhone 15: 171g  |  can of soda: 354g
const COMPARISONS = [
  { label: 'golf balls', grams: 45.93, emoji: '⛳' },
  { label: 'AA batteries', grams: 23, emoji: '🔋' },
  { label: 'iPhones', grams: 171, emoji: '📱' },
  { label: 'cans of soda', grams: 354, emoji: '🥤' },
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
  if (totalGrams <= 0) return null;

  const displayWeight =
    totalGrams >= 1000
      ? (totalGrams / 1000).toFixed(2) + ' kg'
      : totalGrams.toFixed(1) + 'g';

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-zinc-100">{displayWeight}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>
        </div>
        <span className="text-3xl">🌿</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {COMPARISONS.map(({ label: unit, grams, emoji }) => {
          const count = totalGrams / grams;
          const display = count >= 10
            ? Math.round(count).toLocaleString()
            : count.toFixed(1);
          return (
            <div
              key={unit}
              className="rounded-xl bg-zinc-900/60 px-3 py-2.5 flex items-center gap-2"
            >
              <span className="text-lg leading-none">{emoji}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{display}</p>
                <p className="text-[11px] text-zinc-500">{unit}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
