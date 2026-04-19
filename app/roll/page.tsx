'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { IconLeaf, IconTrophy, IconFire, IconPinch, IconPointUp } from '@/components/icons';

type Step = 'grind' | 'spread' | 'roll' | 'seal' | 'done';

const COMPLIMENTS = [
  "Perfect roll. Respect. ✦",
  "That's artisan level right there. ★",
  "Smooth as silk. You've done this before.",
  "Chef's kiss. Absolutely flawless.",
  "A masterpiece. Frame it.",
  "The homies would be proud.",
  "That roll deserves its own profile page. ✦",
];

function Particle({ x, y, color }: { x: number; y: number; color: string }) {
  const style = {
    position: 'absolute' as const,
    left: x,
    top: y,
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    animation: 'confetti-fall 1.2s ease-out forwards',
    pointerEvents: 'none' as const,
  };
  return <div style={style} />;
}

export default function RollPage() {
  const [step, setStep] = useState<Step>('grind');
  const [nugInGrinder, setNugInGrinder] = useState(false);
  const [grinding, setGrinding] = useState(false);
  const [grindDone, setGrindDone] = useState(false);
  const [spreadProgress, setSpreadProgress] = useState(0);
  const [isSpreading, setIsSpreading] = useState(false);
  const [rollProgress, setRollProgress] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [licked, setLicked] = useState(false);
  const [lit, setLit] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [compliment] = useState(() => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
  const [grindRotation, setGrindRotation] = useState(0);

  const dragRef = useRef(false);
  const spreadRef = useRef(false);
  const rollRef = useRef(false);
  const grindIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spreadStartXRef = useRef<number | null>(null);
  const rollStartYRef = useRef<number | null>(null);
  const particleIdRef = useRef(0);

  // Cleanup
  useEffect(() => () => {
    if (grindIntervalRef.current) clearInterval(grindIntervalRef.current);
  }, []);

  // --- STEP 1: GRIND ---
  const handleGrinderClick = () => {
    if (!nugInGrinder || grindDone || grinding) return;
    setGrinding(true);
    let rot = grindRotation;
    let ticks = 0;
    grindIntervalRef.current = setInterval(() => {
      rot += 30;
      setGrindRotation(rot);
      ticks++;
      if (ticks >= 12) {
        clearInterval(grindIntervalRef.current!);
        setGrinding(false);
        setGrindDone(true);
      }
    }, 60);
  };

  const handleNugDragStart = () => { dragRef.current = true; };

  const handleGrinderDrop = (e: React.DragEvent | React.TouchEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      setNugInGrinder(true);
      dragRef.current = false;
    }
  };

  // --- STEP 2: SPREAD ---
  const startSpread = (clientX: number) => {
    if (grindDone && step === 'spread') {
      spreadRef.current = true;
      spreadStartXRef.current = clientX;
    }
  };

  const moveSpread = (clientX: number) => {
    if (!spreadRef.current || spreadStartXRef.current === null) return;
    const delta = clientX - spreadStartXRef.current;
    const progress = Math.min(100, Math.max(0, (delta / 220) * 100));
    setSpreadProgress(progress);
    if (progress >= 100) {
      spreadRef.current = false;
      setIsSpreading(false);
      setTimeout(() => setStep('roll'), 400);
    }
  };

  const endSpread = () => { spreadRef.current = false; setIsSpreading(false); };

  // --- STEP 3: ROLL ---
  const startRoll = (clientY: number) => {
    if (step === 'roll') {
      rollRef.current = true;
      rollStartYRef.current = clientY;
    }
  };

  const moveRoll = (clientY: number) => {
    if (!rollRef.current || rollStartYRef.current === null) return;
    const delta = rollStartYRef.current - clientY;
    const progress = Math.min(100, Math.max(0, (delta / 160) * 100));
    setRollProgress(progress);
    if (progress >= 100) {
      rollRef.current = false;
      setIsRolling(false);
      setTimeout(() => setStep('seal'), 400);
    }
  };

  const endRoll = () => { rollRef.current = false; setIsRolling(false); };

  // --- STEP 4: SEAL ---
  const handleLick = () => {
    if (licked) return;
    setLicked(true);
    setTimeout(() => setLit(true), 800);
    setTimeout(() => {
      setStep('done');
      spawnConfetti();
    }, 1800);
  };

  const spawnConfetti = () => {
    const colors = ['#4ade80', '#a78bfa', '#fbbf24', '#f472b6', '#38bdf8', '#fb923c'];
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: particleIdRef.current++,
      x: Math.random() * 320,
      y: Math.random() * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1400);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 select-none">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(180px) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes wiggle {
          0%,100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes flame {
          0%,100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.15) scaleX(0.9); }
        }
        .grinding { animation: wiggle 0.12s linear infinite; }
        .flame-anim { animation: flame 0.3s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold text-zinc-100 flex items-center gap-2 justify-center">Let&apos;s Roll One <IconLeaf size={22} className="text-emerald-400" /></p>
        <p className="mt-1 text-xs text-zinc-500">A sacred ritual in 4 steps</p>
      </div>

      {/* Progress dots */}
      <div className="mb-8 flex justify-center gap-3">
        {(['grind','spread','roll','seal'] as Step[]).map((s, i) => (
          <div key={s} className={`h-2 w-2 rounded-full transition-all duration-300 ${
            step === 'done' || ['grind','spread','roll','seal'].indexOf(step) > i
              ? 'bg-emerald-400 scale-110'
              : step === s
              ? 'bg-emerald-400 ring-2 ring-emerald-400/40 scale-125'
              : 'bg-zinc-700'
          }`} />
        ))}
      </div>

      {/* ── STEP 1: GRIND ── */}
      {step === 'grind' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="font-semibold text-zinc-100">Step 1 — Grind it up</p>
            <p className="text-xs text-zinc-500">
              {!nugInGrinder ? 'Drag the nug into the grinder' : !grindDone ? 'Now tap the grinder to grind' : 'Ground! ✓'}
            </p>
          </div>

          {/* Arena */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Nug — draggable */}
            {!nugInGrinder && (
              <div
                draggable
                onDragStart={handleNugDragStart}
                onTouchStart={handleNugDragStart}
                className="cursor-grab active:cursor-grabbing text-5xl transition hover:scale-110"
                title="Drag me to the grinder"
              >
                <IconLeaf size={40} className="text-emerald-400" />
              </div>
            )}

            {/* Grinder drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleGrinderDrop}
              onTouchEnd={handleGrinderDrop}
              onClick={handleGrinderClick}
              className={`relative flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 transition cursor-pointer
                ${grindDone
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : nugInGrinder
                  ? 'border-purple-400 bg-purple-500/10'
                  : 'border-dashed border-zinc-600 bg-zinc-800/50'}
                ${grinding ? 'grinding' : ''}
              `}
            >
              {/* Grinder teeth SVG */}
              <svg
                width="64" height="64" viewBox="0 0 64 64"
                style={{ transform: `rotate(${grindRotation}deg)`, transition: grinding ? 'none' : 'transform 0.3s' }}
              >
                <circle cx="32" cy="32" r="28" fill="none" stroke={grindDone ? '#4ade80' : nugInGrinder ? '#c084fc' : '#52525b'} strokeWidth="3"/>
                {[0,45,90,135,180,225,270,315].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 32 + 20 * Math.cos(rad);
                  const y1 = 32 + 20 * Math.sin(rad);
                  const x2 = 32 + 27 * Math.cos(rad);
                  const y2 = 32 + 27 * Math.sin(rad);
                  return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={grindDone ? '#4ade80' : nugInGrinder ? '#c084fc' : '#52525b'} strokeWidth="3" strokeLinecap="round" />;
                })}
                <circle cx="32" cy="32" r="10" fill={grindDone ? '#4ade8020' : nugInGrinder ? '#c084fc20' : '#3f3f4630'} stroke={grindDone ? '#4ade80' : nugInGrinder ? '#c084fc' : '#52525b'} strokeWidth="2"/>
              </svg>
              {nugInGrinder && !grindDone && <p className="absolute bottom-2 text-xs text-purple-300">tap!</p>}
              {grindDone && <p className="absolute bottom-2 text-xs text-emerald-400">✓</p>}
            </div>
          </div>

          {grindDone && (
            <button
              onClick={() => setStep('spread')}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-95"
            >
              Next →
            </button>
          )}
        </div>
      )}

      {/* ── STEP 2: SPREAD ── */}
      {step === 'spread' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="font-semibold text-zinc-100">Step 2 — Spread it out</p>
            <p className="text-xs text-zinc-500">Drag right to spread the herb on the paper</p>
          </div>

          {/* Rolling paper */}
          <div className="relative mx-auto w-full max-w-xs">
            {/* Paper */}
            <div className="relative h-16 w-full rounded-xl border border-amber-700/40 bg-amber-50/5 overflow-hidden"
              onMouseDown={e => { startSpread(e.clientX); setIsSpreading(true); }}
              onMouseMove={e => { if (isSpreading) moveSpread(e.clientX); }}
              onMouseUp={endSpread}
              onMouseLeave={endSpread}
              onTouchStart={e => { startSpread(e.touches[0].clientX); setIsSpreading(true); }}
              onTouchMove={e => { if (isSpreading) moveSpread(e.touches[0].clientX); }}
              onTouchEnd={endSpread}
              style={{ cursor: isSpreading ? 'grabbing' : 'grab' }}
            >
              {/* Paper texture lines */}
              <div className="absolute inset-0 opacity-20">
                {[20,35,50].map(top => (
                  <div key={top} className="absolute w-full border-t border-amber-300/30" style={{ top }} />
                ))}
              </div>
              {/* Spread fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-xl transition-none"
                style={{
                  width: `${spreadProgress}%`,
                  background: 'linear-gradient(90deg, #4ade8030, #4ade8060)',
                  borderRight: spreadProgress > 0 && spreadProgress < 100 ? '2px solid #4ade80' : 'none',
                }}
              />
              {/* Herb particles */}
              {spreadProgress > 10 && (
                <div className="absolute inset-y-2 left-2" style={{ width: `calc(${spreadProgress}% - 8px)` }}>
                  {['▪','▫','▪','▫','▪','▫','▪','▫','▪'].map((dot, i) => (
                    <span key={i} className="absolute text-emerald-600 text-xs"
                      style={{ left: `${(i / 8) * 100}%`, top: `${20 + Math.sin(i) * 10}%` }}>{dot}</span>
                  ))}
                </div>
              )}
              {spreadProgress < 100 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-amber-300/40">← drag →</span>
                </div>
              )}
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-zinc-800">
              <div className="h-1 rounded-full bg-emerald-500 transition-all" style={{ width: `${spreadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: ROLL ── */}
      {step === 'roll' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="font-semibold text-zinc-100">Step 3 — Roll it up</p>
            <p className="text-xs text-zinc-500">Swipe up to roll</p>
          </div>

          {/* Roll zone */}
          <div className="flex flex-col items-center gap-4">
            {/* Visual paper rolling */}
            <div className="relative mx-auto w-48">
              {/* The "paper" that curls as you roll */}
              <div
                className="relative mx-auto overflow-hidden rounded-xl border border-amber-700/30 bg-amber-50/5 transition-all"
                style={{ height: Math.max(16, 64 - rollProgress * 0.48) }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-amber-300/30">{rollProgress < 100 ? 'swipe ↑' : ''}</span>
                </div>
              </div>
              {/* The forming joint */}
              {rollProgress > 0 && (
                <div
                  className="mx-auto mt-1 rounded-full bg-gradient-to-b from-amber-100/20 to-amber-200/10 border border-amber-700/30 transition-all"
                  style={{
                    height: 12 + rollProgress * 0.2,
                    width: 48 - rollProgress * 0.1,
                    borderRadius: rollProgress > 80 ? '9999px' : '4px',
                  }}
                />
              )}
            </div>

            {/* Drag handle */}
            <div
              className="flex h-36 w-full max-w-xs flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 cursor-ns-resize"
              onMouseDown={e => { startRoll(e.clientY); setIsRolling(true); }}
              onMouseMove={e => { if (isRolling) moveRoll(e.clientY); }}
              onMouseUp={endRoll}
              onMouseLeave={endRoll}
              onTouchStart={e => { startRoll(e.touches[0].clientY); setIsRolling(true); }}
              onTouchMove={e => { if (isRolling) moveRoll(e.touches[0].clientY); }}
              onTouchEnd={endRoll}
            >
              <span className="mb-2 text-zinc-400"><IconPinch size={24} /></span>
              <span className="text-xs text-zinc-500">drag up to roll</span>
            </div>

            <div className="w-full max-w-xs">
              <div className="h-2 w-full rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${rollProgress}%` }} />
              </div>
              <p className="mt-1 text-center text-xs text-zinc-600">{Math.round(rollProgress)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: SEAL ── */}
      {step === 'seal' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="text-center space-y-1">
            <p className="font-semibold text-zinc-100">Step 4 — Lick & light</p>
            <p className="text-xs text-zinc-500">{!licked ? 'Tap the tip to seal it' : !lit ? 'Sealing…' : 'Lighting up ✦'}</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* The joint */}
            <div className="relative flex items-center gap-1" onClick={handleLick}>
              {/* Tip / filter */}
              <div className="h-5 w-3 rounded-l-sm bg-amber-900/60 border border-amber-700/40" />
              {/* Body */}
              <div className={`h-5 w-36 rounded-sm border border-amber-700/30 bg-gradient-to-r from-amber-100/15 to-amber-50/5 transition-all ${licked ? 'opacity-90' : 'opacity-70 cursor-pointer hover:opacity-90'}`} />
              {/* Twisted tip */}
              <div className={`h-4 w-4 rounded-r-full border border-amber-700/30 transition-all ${licked ? 'bg-amber-200/10' : 'bg-amber-50/5 cursor-pointer'}`} />
              {/* Flame */}
              {lit && (
                <div className="absolute -right-1 -top-5 text-amber-400 flame-anim"><IconFire size={20} /></div>
              )}
              {/* Lick prompt */}
              {!licked && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-amber-300/60 whitespace-nowrap flex items-center gap-1">
                  <IconPointUp size={11} /> tap to seal
                </div>
              )}
            </div>

            {licked && !lit && (
              <p className="text-xs text-zinc-400 animate-pulse">licking the seal…</p>
            )}
            {lit && (
              <p className="text-xs text-emerald-400 animate-pulse flex items-center gap-1">she&apos;s lit <IconFire size={12} /></p>
            )}
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && (
        <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-5 overflow-hidden">
          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}
          </div>

          <div className="flex justify-center text-zinc-300"><IconLeaf size={48} /></div>
          <div>
            <p className="text-xl font-bold text-emerald-300">That&apos;s a wrap.</p>
            <p className="mt-2 text-sm text-zinc-400 italic">{compliment}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setStep('grind');
                setNugInGrinder(false);
                setGrinding(false);
                setGrindDone(false);
                setSpreadProgress(0);
                setRollProgress(0);
                setLicked(false);
                setLit(false);
                setGrindRotation(0);
              }}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 active:scale-95"
            >
              Roll another ✦
            </button>
            <Link href="/"
              className="block w-full rounded-xl border border-zinc-700 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Back to the app
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
