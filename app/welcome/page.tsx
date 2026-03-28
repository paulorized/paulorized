'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    emoji: '👋',
    title: 'Welcome to CannaBaseAI',
    body: "You're in. This app is your personal cannabis journal — log products, track your experiences, and build a history of what works for you.",
    cta: 'Get started',
  },
  {
    emoji: '📷',
    title: 'Scan, upload, or type it in',
    body: "Point your camera at any product label and we'll extract the strain, THC/CBD info, brand, and more automatically. You can also upload a photo or enter details manually.",
    cta: 'Next',
  },
  {
    emoji: '🔒',
    title: 'Your photos stay private',
    body: "When you scan a label, the image is sent to AI to read the text — that's it. Photos are never stored, never saved, and never shared. Only the extracted product info gets saved to your log.",
    cta: 'Next',
  },
  {
    emoji: '💡',
    title: 'Scan with purpose',
    body: "For the best results, capture all sides of the package — especially the potency label (usually the back or bottom). The more you give the AI to read, the more accurate your log will be.",
    cta: 'Next',
  },
  {
    emoji: '⭐',
    title: 'Review after you try it',
    body: "Once a product is logged, you can open it from My Log and leave a review — rate it, tag effects and flavors, add notes. Over time you'll build a picture of what you enjoy.",
    cta: 'Start logging',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push('/');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-6 py-12">
      {/* Progress dots */}
      <div className="mb-10 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-emerald-400' : i < step ? 'w-1.5 bg-emerald-600' : 'w-1.5 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-5">
        <div className="text-5xl">{current.emoji}</div>
        <h1 className="text-xl font-bold text-zinc-100">{current.title}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">{current.body}</p>

        <button
          type="button"
          onClick={handleNext}
          className="mt-2 w-full rounded-xl bg-emerald-400 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          {current.cta}
        </button>

        {!isLast && (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            Skip intro
          </button>
        )}
      </div>

      {/* Step counter */}
      <p className="mt-5 text-xs text-zinc-600">{step + 1} of {steps.length}</p>
    </main>
  );
}