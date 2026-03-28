'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDING_STEPS = [
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
    title: 'Your scan photos stay private',
    body: "When you scan a label, the image is sent to AI to read the text — that's it. Scan photos are never stored, never saved, and never shared. Only the extracted product info gets saved to your log.",
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
  const [phase, setPhase] = useState<'privacy' | 'onboarding'>('privacy');
  const [step, setStep] = useState(0);

  const currentStep = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push('/');
    } else {
      setStep(s => s + 1);
    }
  };

  if (phase === 'privacy') {
    return (
      <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔐</div>
            <h1 className="text-xl font-bold text-zinc-100">Privacy &amp; data policy</h1>
            <p className="text-xs text-zinc-500">Please read before continuing</p>
          </div>

          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              <span><strong className="text-zinc-300">Scan photos are never stored.</strong> Label images are sent to AI for text extraction only and immediately discarded. We never save or share them.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              <span><strong className="text-zinc-300">Product photos (NugShots) are stored privately.</strong> If you add a photo to a log entry, it is stored securely in your personal account and only accessible to you.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              <span><strong className="text-zinc-300">Your log data is private.</strong> Your scan history, reviews, and profile details are tied to your account and are never sold or shared with third parties.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              <span><strong className="text-zinc-300">Community stats are anonymous.</strong> The Community page shows aggregate trends — no individual data is ever surfaced.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
              <span><strong className="text-zinc-300">You control your data.</strong> You can delete any log entry or photo at any time from within the app.</span>
            </li>
          </ul>

          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <button
              type="button"
              onClick={() => setPhase('onboarding')}
              className="w-full rounded-xl bg-emerald-400 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              I understand — continue
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition"
            >
              Skip intro
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex gap-2">
        {ONBOARDING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-emerald-400' : i < step ? 'w-1.5 bg-emerald-600' : 'w-1.5 bg-zinc-700'
            }`}
          />
        ))}
      </div>

      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-5">
        <div className="text-5xl">{currentStep.emoji}</div>
        <h1 className="text-xl font-bold text-zinc-100">{currentStep.title}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">{currentStep.body}</p>

        <button
          type="button"
          onClick={handleNext}
          className="mt-2 w-full rounded-xl bg-emerald-400 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          {currentStep.cta}
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

      <p className="mt-5 text-xs text-zinc-600">{step + 1} of {ONBOARDING_STEPS.length}</p>
    </main>
  );
}