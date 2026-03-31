'use client';

import { useRef, useState } from 'react';

type Props = {
  username: string;
  avatarUrl: string | null;
  totalScans: number;
  totalReviews: number;
  totalGrams: number;
  avgThc: number | null;
  avgRating: number | null;
  wbaPct: number | null;
  topStrains: { name: string; count: number }[];
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
  topBrand: string | null;
};

function formatWeight(g: number): string {
  if (g <= 0) return '0g';
  const oz = g / 28.3495;
  const lbs = oz / 16;
  if (lbs >= 1) return lbs.toFixed(1) + ' lbs';
  if (oz >= 1) return oz.toFixed(1) + ' oz';
  return g.toFixed(1) + 'g';
}

function stars(rating: number | null): string {
  if (rating == null) return '—';
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

export function StatsCard({
  username, avatarUrl, totalScans, totalReviews, totalGrams,
  avgThc, avgRating, wbaPct, topStrains, topEffects, topFlavors, topBrand,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    const canvas = canvasRef.current!;
    // iPhone 14 Pro portrait @ 2x — looks sharp on any screen
    const W = 390, H = 844;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── BACKGROUND ─────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#09090b');
    bg.addColorStop(0.4, '#0b1a12');
    bg.addColorStop(1,   '#09090b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 20; x < W; x += 24) {
      for (let y = 20; y < H; y += 24) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }
    }

    // hero glow behind avatar area
    const heroGlow = ctx.createRadialGradient(W / 2, 160, 0, W / 2, 160, 200);
    heroGlow.addColorStop(0, 'rgba(16,185,129,0.18)');
    heroGlow.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = heroGlow;
    ctx.fillRect(0, 0, W, 360);

    // bottom purple accent glow
    const bottomGlow = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 260);
    bottomGlow.addColorStop(0, 'rgba(139,92,246,0.12)');
    bottomGlow.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, H - 260, W, 260);

    // outer border
    ctx.strokeStyle = 'rgba(16,185,129,0.3)';
    ctx.lineWidth = 1;
    rr(ctx, 0.5, 0.5, W - 1, H - 1, 28);
    ctx.stroke();

    // ── LOGO BAR ────────────────────────────────────────────────────────────
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px -apple-system, system-ui, sans-serif';
    const logoX = W / 2;
    const cW = ctx.measureText('Canna').width;
    const bW = ctx.measureText('Base').width;
    const aW = ctx.measureText('AI').width;
    const totalLogoW = cW + bW + aW;
    let lx = logoX - totalLogoW / 2;
    ctx.fillStyle = '#34d399'; ctx.textAlign = 'left'; ctx.fillText('Canna', lx, 26); lx += cW;
    ctx.fillStyle = '#a78bfa'; ctx.fillText('Base', lx, 26); lx += bW;
    ctx.fillStyle = '#fde047'; ctx.fillText('AI', lx, 26);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 44); ctx.lineTo(W - 20, 44); ctx.stroke();

    // ── AVATAR ──────────────────────────────────────────────────────────────
    const avatarR = 44;
    const avatarCX = W / 2;
    const avatarCY = 110;

    // avatar glow ring
    const ringGrad = ctx.createRadialGradient(avatarCX, avatarCY, avatarR - 2, avatarCX, avatarCY, avatarR + 8);
    ringGrad.addColorStop(0, 'rgba(52,211,153,0.6)');
    ringGrad.addColorStop(1, 'rgba(52,211,153,0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR + 8, 0, Math.PI * 2); ctx.fill();

    // clip circle for avatar
    ctx.save();
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2); ctx.clip();

    if (avatarUrl) {
      try {
        const img = await loadImage(avatarUrl);
        ctx.drawImage(img, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      } catch {
        drawDefaultAvatar(ctx, avatarCX, avatarCY, avatarR);
      }
    } else {
      drawDefaultAvatar(ctx, avatarCX, avatarCY, avatarR);
    }
    ctx.restore();

    // avatar border ring
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR + 2, 0, Math.PI * 2); ctx.stroke();

    // ── USERNAME + BRAG HEADER ──────────────────────────────────────────────
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(`@${username}`, W / 2, 178);

    ctx.font = '600 12px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.letterSpacing = '2px';
    ctx.fillText('🌿  MY CANNABIS BRAG SHEET  🌿', W / 2, 200);
    ctx.letterSpacing = '0px';

    // ── DIVIDER ─────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(52,211,153,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 216); ctx.lineTo(W - 40, 216); ctx.stroke();

    // ── BIG 4 STAT TILES ────────────────────────────────────────────────────
    const tileData = [
      { label: 'PRODUCTS\nLOGGED',  value: String(totalScans),                       color: '#34d399' },
      { label: 'WEIGHT\nLOGGED',    value: formatWeight(totalGrams),                  color: '#fde047' },
      { label: 'AVG\nTHC',          value: avgThc != null ? `${avgThc}%` : '—',       color: '#f97316' },
      { label: 'REVIEWS\nWRITTEN',  value: String(totalReviews),                      color: '#a78bfa' },
    ];

    const tileW = 80, tileH = 72, tileGap = 10;
    const tilesTotal = tileData.length * tileW + (tileData.length - 1) * tileGap;
    const tileStartX = (W - tilesTotal) / 2;
    const tileY = 228;

    tileData.forEach((t, i) => {
      const tx = tileStartX + i * (tileW + tileGap);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, tx, tileY, tileW, tileH, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      rr(ctx, tx, tileY, tileW, tileH, 10); ctx.stroke();

      // accent top bar
      ctx.fillStyle = t.color;
      rr(ctx, tx, tileY, tileW, 3, 2); ctx.fill();

      ctx.textAlign = 'center';
      ctx.font = `bold ${t.value.length > 5 ? '17px' : '22px'} -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(t.value, tx + tileW / 2, tileY + 36);

      ctx.font = '8.5px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#71717a';
      t.label.split('\n').forEach((line, li) => {
        ctx.fillText(line, tx + tileW / 2, tileY + 52 + li * 11);
      });
    });

    // ── SECONDARY ROW: AVG RATING + WOULD BUY AGAIN ─────────────────────────
    const secY = tileY + tileH + 14;
    const halfW = (W - 52) / 2;

    // Rating tile
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rr(ctx, 20, secY, halfW, 52, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rr(ctx, 20, secY, halfW, 52, 10); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(stars(avgRating), 20 + halfW / 2, secY + 24);
    ctx.font = '9px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('AVG RATING' + (avgRating != null ? `  ${avgRating}/5` : ''), 20 + halfW / 2, secY + 40);

    // Would buy again tile
    const wbaX = 20 + halfW + 12;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rr(ctx, wbaX, secY, halfW, 52, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    rr(ctx, wbaX, secY, halfW, 52, 10); ctx.stroke();
    ctx.font = 'bold 20px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = wbaPct != null && wbaPct >= 70 ? '#34d399' : '#f4f4f5';
    ctx.fillText(wbaPct != null ? `${wbaPct}%` : '—', wbaX + halfW / 2, secY + 24);
    ctx.font = '9px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('WOULD BUY AGAIN', wbaX + halfW / 2, secY + 40);

    // ── SECTION DIVIDER ──────────────────────────────────────────────────────
    const div2Y = secY + 52 + 16;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, div2Y); ctx.lineTo(W - 20, div2Y); ctx.stroke();

    // ── TOP STRAINS ──────────────────────────────────────────────────────────
    const strainY = div2Y + 14;
    ctx.textAlign = 'left';
    ctx.font = '600 9px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('TOP STRAINS', 20, strainY);

    const strainColors = ['#34d399', '#a78bfa', '#fde047'];
    topStrains.slice(0, 3).forEach((s, i) => {
      const sy = strainY + 12 + i * 24;
      const barMaxW = W - 130;
      const maxCount = topStrains[0]?.count || 1;
      const barW = Math.max(20, (s.count / maxCount) * barMaxW);

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, 20, sy, W - 40, 18, 4); ctx.fill();

      // filled bar
      const barGrad = ctx.createLinearGradient(20, 0, 20 + barW, 0);
      barGrad.addColorStop(0, strainColors[i] + '40');
      barGrad.addColorStop(1, strainColors[i] + '15');
      ctx.fillStyle = barGrad;
      rr(ctx, 20, sy, barW + 20, 18, 4); ctx.fill();

      ctx.font = `${i === 0 ? 'bold' : '500'} 10px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = i === 0 ? strainColors[i] : '#a1a1aa';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${s.name.length > 22 ? s.name.slice(0, 22) + '…' : s.name}`, 28, sy + 13);
      ctx.textAlign = 'right';
      ctx.font = '9px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#52525b';
      ctx.fillText(`${s.count}x`, W - 26, sy + 13);
      ctx.textAlign = 'left';
    });

    // ── FAVOURITE BRAND ──────────────────────────────────────────────────────
    if (topBrand) {
      const brandY = strainY + 12 + Math.min(topStrains.length, 3) * 24 + 6;
      ctx.fillStyle = 'rgba(251,191,36,0.08)';
      rr(ctx, 20, brandY, W - 40, 28, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.18)';
      ctx.lineWidth = 1;
      rr(ctx, 20, brandY, W - 40, 28, 8); ctx.stroke();
      ctx.font = '9px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#71717a';
      ctx.textAlign = 'left';
      ctx.fillText('FAV BRAND', 30, brandY + 11);
      ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(topBrand.length > 28 ? topBrand.slice(0, 28) + '…' : topBrand, 30, brandY + 23);
    }

    // ── EFFECTS ──────────────────────────────────────────────────────────────
    const effectsStartY = strainY + 12 + Math.min(topStrains.length, 3) * 24 + (topBrand ? 42 : 12);
    ctx.textAlign = 'left';
    ctx.font = '600 9px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('FAVOURITE EFFECTS', 20, effectsStartY);

    let pillX = 20, pillRowY = effectsStartY + 10;
    topEffects.slice(0, 5).forEach((e) => {
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      const pw = ctx.measureText(e.name).width + 20;
      if (pillX + pw > W - 20) { pillX = 20; pillRowY += 22; }
      ctx.fillStyle = 'rgba(52,211,153,0.12)';
      rr(ctx, pillX, pillRowY, pw, 18, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(52,211,153,0.25)';
      ctx.lineWidth = 1;
      rr(ctx, pillX, pillRowY, pw, 18, 9); ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText(e.name, pillX + pw / 2, pillRowY + 13);
      pillX += pw + 6;
    });

    // ── FLAVORS ──────────────────────────────────────────────────────────────
    const flavorsY = pillRowY + 28;
    ctx.textAlign = 'left';
    ctx.font = '600 9px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('FAVOURITE FLAVORS', 20, flavorsY);

    let fpillX = 20, fpillRowY = flavorsY + 10;
    topFlavors.slice(0, 4).forEach((f) => {
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      const pw = ctx.measureText(f.name).width + 20;
      if (fpillX + pw > W - 20) { fpillX = 20; fpillRowY += 22; }
      ctx.fillStyle = 'rgba(251,191,36,0.10)';
      rr(ctx, fpillX, fpillRowY, pw, 18, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(251,191,36,0.22)';
      ctx.lineWidth = 1;
      rr(ctx, fpillX, fpillRowY, pw, 18, 9); ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, fpillX + pw / 2, fpillRowY + 13);
      fpillX += pw + 6;
    });

    // ── CTA FOOTER ───────────────────────────────────────────────────────────
    const footerY = H - 68;
    ctx.strokeStyle = 'rgba(52,211,153,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, footerY - 14); ctx.lineTo(W - 20, footerY - 14); ctx.stroke();

    // CTA pill background
    ctx.fillStyle = 'rgba(16,185,129,0.08)';
    rr(ctx, 20, footerY - 4, W - 40, 58, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(16,185,129,0.18)';
    ctx.lineWidth = 1;
    rr(ctx, 20, footerY - 4, W - 40, 58, 14); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText('Think you can keep up? 👀', W / 2, footerY + 16);

    ctx.font = '11px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('Track your collection at', W / 2, footerY + 32);

    ctx.font = 'bold 12px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('cannabaseai.com', W / 2, footerY + 48);

    const url = canvas.toDataURL('image/png');
    setPreview(url);
    setGenerating(false);
  };

  const isMobile = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent);

  const saveOrShare = async () => {
    if (!preview) return;
    const fileName = `${username}-brag-sheet.png`;

    // Mobile: use Web Share API so iOS shows "Save to Photos" / Android shows share sheet
    if (isMobile() && navigator.share) {
      try {
        const res = await fetch(preview);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        await navigator.share({ files: [file], title: 'My CannaBaseAI Brag Sheet' });
        return;
      } catch {
        // user cancelled or share failed — fall through to download
      }
    }

    // Desktop (or mobile share not available): straight download
    const a = document.createElement('a');
    a.href = preview;
    a.download = fileName;
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
          {generating ? 'Building your brag sheet…' : '🏆 Generate brag sheet'}
        </button>
      ) : (
        <div className="space-y-3">
          <img src={preview} alt="Your brag sheet" className="w-full max-w-xs mx-auto rounded-2xl border border-zinc-700 shadow-2xl shadow-emerald-900/20" />
          <div className="flex gap-2 max-w-xs mx-auto">
            <button type="button" onClick={saveOrShare}
              className="flex-1 rounded-xl bg-emerald-400 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95">
              {isMobile() && typeof navigator !== 'undefined' && navigator.share ? '↑ Save to Photos' : '↓ Download'}
            </button>
            <button type="button" onClick={() => setPreview(null)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Load a cross-origin image onto canvas
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawDefaultAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = '#18181b';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.fillStyle = '#34d399';
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.15, r * 0.38, 0, Math.PI * 2); ctx.fill();
  // body
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.65, r * 0.55, Math.PI, 0);
  ctx.fill();
}
