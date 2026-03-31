'use client';

import { useRef, useState } from 'react';

type Props = {
  username: string;
  totalScans: number;
  totalGrams: number;
  avgThc: number | null;
  avgRating: number | null;
  topStrain: string | null;
  topEffect: string | null;
};

function formatWeight(g: number): string {
  if (g <= 0) return '0g';
  const oz = g / 28.3495;
  const lbs = oz / 16;
  if (lbs >= 1) return lbs.toFixed(1) + ' lbs';
  if (oz >= 1) return oz.toFixed(1) + ' oz';
  return g.toFixed(1) + 'g';
}

export function StatsCard({ username, totalScans, totalGrams, avgThc, avgRating, topStrain, topEffect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = () => {
    setGenerating(true);
    const canvas = canvasRef.current!;
    const W = 800, H = 480;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Background ──────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0c0c0f');
    bg.addColorStop(0.5, '#0f1a14');
    bg.addColorStop(1, '#0c0c0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // top glow
    const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 320);
    glow.addColorStop(0, 'rgba(16,185,129,0.10)');
    glow.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // border
    ctx.strokeStyle = 'rgba(16,185,129,0.25)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.stroke();

    // ── Logo / brand ─────────────────────────────────────────────────────────
    ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#34d399'; // emerald
    ctx.fillText('Canna', 36, 48);
    const cannaW = ctx.measureText('Canna').width;
    ctx.fillStyle = '#a78bfa'; // purple
    ctx.fillText('Base', 36 + cannaW, 48);
    const baseW = ctx.measureText('Base').width;
    ctx.fillStyle = '#fde047'; // yellow
    ctx.fillText('AI', 36 + cannaW + baseW, 48);

    // leaf icon (simple circle stand-in)
    ctx.font = '20px sans-serif';
    ctx.fillText('🌿', W - 56, 48);

    // divider line under header
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(36, 62); ctx.lineTo(W - 36, 62); ctx.stroke();

    // ── Username / headline ───────────────────────────────────────────────────
    ctx.font = 'bold 32px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(`@${username}'s Stats`, 36, 108);

    ctx.font = '14px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('MY CANNABIS JOURNEY', 36, 130);

    // ── Stat cards ────────────────────────────────────────────────────────────
    const stats = [
      { label: 'PRODUCTS LOGGED', value: String(totalScans) },
      { label: 'WEIGHT LOGGED', value: formatWeight(totalGrams) },
      { label: 'AVG THC', value: avgThc != null ? `${avgThc}%` : '—' },
      { label: 'AVG RATING', value: avgRating != null ? `${avgRating}/5` : '—' },
    ];

    const cardW = 162, cardH = 88, cardGap = 14;
    const totalCardsW = stats.length * cardW + (stats.length - 1) * cardGap;
    const cardStartX = (W - totalCardsW) / 2;
    const cardY = 158;

    stats.forEach((s, i) => {
      const cx = cardStartX + i * (cardW + cardGap);
      // card bg
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      roundRect(ctx, cx, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      roundRect(ctx, cx, cardY, cardW, cardH, 12);
      ctx.stroke();

      // value
      ctx.font = `bold ${s.value.length > 6 ? '22px' : '28px'} -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = '#f4f4f5';
      ctx.textAlign = 'center';
      ctx.fillText(s.value, cx + cardW / 2, cardY + 44);

      // label
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#52525b';
      ctx.fillText(s.label, cx + cardW / 2, cardY + 64);
      ctx.textAlign = 'left';
    });

    // ── Top strain / effect pills ─────────────────────────────────────────────
    const pillY = 278;
    const pills: { label: string; value: string; color: string; bg: string }[] = [];
    if (topStrain) pills.push({ label: 'TOP STRAIN', value: topStrain, color: '#34d399', bg: 'rgba(16,185,129,0.12)' });
    if (topEffect) pills.push({ label: 'TOP EFFECT', value: topEffect, color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' });

    pills.forEach((p, i) => {
      const pw = 230, ph = 54, px = 36 + i * (pw + 16);
      ctx.fillStyle = p.bg;
      roundRect(ctx, px, pillY, pw, ph, 10);
      ctx.fill();
      ctx.strokeStyle = p.color.replace(')', ',0.25)').replace('rgb', 'rgba');
      ctx.lineWidth = 1;
      roundRect(ctx, px, pillY, pw, ph, 10);
      ctx.stroke();

      ctx.font = '9px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#52525b';
      ctx.fillText(p.label, px + 14, pillY + 18);

      ctx.font = 'bold 16px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = p.color;
      ctx.fillText(p.value.length > 18 ? p.value.slice(0, 18) + '…' : p.value, px + 14, pillY + 38);
    });

    // ── Decorative accent line ────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(16,185,129,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(36, H - 90); ctx.lineTo(W - 36, H - 90); ctx.stroke();

    // ── CTA ───────────────────────────────────────────────────────────────────
    ctx.font = 'bold 15px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'center';
    ctx.fillText('Join the community — track your weed too 🌿', W / 2, H - 58);

    ctx.font = '13px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('cannabaseai.com', W / 2, H - 36);
    ctx.textAlign = 'left';

    const url = canvas.toDataURL('image/png');
    setPreview(url);
    setGenerating(false);
  };

  const download = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = `${username}-cannabaseai-stats.png`;
    a.click();
  };

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {!preview ? (
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          {generating ? 'Generating…' : 'Share my stats'}
        </button>
      ) : (
        <div className="space-y-3">
          <img src={preview} alt="Your stats card" className="w-full rounded-2xl border border-zinc-800" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={download}
              className="flex-1 rounded-xl bg-emerald-400 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95"
            >
              ↓ Download card
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: draw a rounded rectangle path
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
