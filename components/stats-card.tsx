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
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#34d399');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${r}px -apple-system, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
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
    const W = 390, H = 844;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── BACKGROUND
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

    // hero glow
    const heroGlow = ctx.createRadialGradient(W / 2, 160, 0, W / 2, 160, 200);
    heroGlow.addColorStop(0, 'rgba(16,185,129,0.18)');
    heroGlow.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = heroGlow;
    ctx.fillRect(0, 0, W, 360);

    // bottom purple glow
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

    // ── LOGO BAR
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

    // ── AVATAR
    const avatarR = 44;
    const avatarCX = W / 2;
    const avatarCY = 110;

    const ringGrad = ctx.createRadialGradient(avatarCX, avatarCY, avatarR - 2, avatarCX, avatarCY, avatarR + 8);
    ringGrad.addColorStop(0, 'rgba(52,211,153,0.6)');
    ringGrad.addColorStop(1, 'rgba(52,211,153,0)');
    ctx.fillStyle = ringGrad;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR + 8, 0, Math.PI * 2); ctx.fill();

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

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarR + 2, 0, Math.PI * 2); ctx.stroke();

    // ── USERNAME + HEADER
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(`@${username}`, W / 2, 178);

    ctx.font = '600 12px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('🌿  MY CANNABIS BRAG SHEET  🌿', W / 2, 200);

    ctx.strokeStyle = 'rgba(52,211,153,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 216); ctx.lineTo(W - 40, 216); ctx.stroke();

    // ── BIG 4 STAT TILES
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

    // ── SECONDARY ROW: AVG RATING + WOULD BUY AGAIN
    const secY = tileY + tileH + 14;
    const halfW = (W - 52) / 2;

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

    // ── TOP STRAINS BAR CHART
    const strainY = secY + 52 + 18;
    ctx.font = '600 10px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.textAlign = 'left';
    ctx.fillText('TOP STRAINS', 20, strainY);

    const barAreaY = strainY + 10;
    const maxCount = topStrains.length > 0 ? topStrains[0].count : 1;
    const barColors = ['#34d399', '#a78bfa', '#fde047'];
    topStrains.slice(0, 3).forEach((s, i) => {
      const by = barAreaY + i * 26;
      const barMaxW = W - 130;
      const barW = Math.max(4, (s.count / maxCount) * barMaxW);
      ctx.fillStyle = barColors[i] + '22';
      rr(ctx, 20, by, barMaxW, 18, 4); ctx.fill();
      ctx.fillStyle = barColors[i];
      rr(ctx, 20, by, barW, 18, 4); ctx.fill();
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#f4f4f5';
      ctx.textAlign = 'left';
      ctx.fillText(s.name.length > 20 ? s.name.slice(0, 19) + '…' : s.name, 28, by + 13);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#71717a';
      ctx.fillText(`${s.count}×`, W - 20, by + 13);
    });

    // ── FAV BRAND PILL
    const brandY = barAreaY + 3 * 26 + 14;
    if (topBrand) {
      ctx.fillStyle = 'rgba(167,139,250,0.12)';
      rr(ctx, 20, brandY, W - 40, 32, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(167,139,250,0.3)';
      ctx.lineWidth = 1;
      rr(ctx, 20, brandY, W - 40, 32, 16); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = '600 11px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#a78bfa';
      ctx.fillText(`🏆  FAV BRAND: ${topBrand}`, W / 2, brandY + 20);
    }

    // ── EFFECTS + FLAVORS PILLS
    const pillsStartY = (topBrand ? brandY + 32 : brandY) + 14;
    ctx.font = '600 10px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.textAlign = 'left';
    ctx.fillText('TOP EFFECTS', 20, pillsStartY);

    let pillX = 20;
    let pillY = pillsStartY + 8;
    const pillH = 22;
    const pillPad = 10;
    topEffects.slice(0, 4).forEach((e) => {
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      const pw = ctx.measureText(e.name).width + pillPad * 2;
      if (pillX + pw > W - 20) { pillX = 20; pillY += pillH + 6; }
      ctx.fillStyle = 'rgba(52,211,153,0.12)';
      rr(ctx, pillX, pillY, pw, pillH, pillH / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(52,211,153,0.3)';
      ctx.lineWidth = 1;
      rr(ctx, pillX, pillY, pw, pillH, pillH / 2); ctx.stroke();
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText(e.name, pillX + pw / 2, pillY + 15);
      pillX += pw + 6;
    });

    pillY += pillH + 14;
    pillX = 20;
    ctx.font = '600 10px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.textAlign = 'left';
    ctx.fillText('TOP FLAVORS', 20, pillY);
    pillY += 8;

    topFlavors.slice(0, 3).forEach((f) => {
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      const pw = ctx.measureText(f.name).width + pillPad * 2;
      if (pillX + pw > W - 20) { pillX = 20; pillY += pillH + 6; }
      ctx.fillStyle = 'rgba(253,224,71,0.10)';
      rr(ctx, pillX, pillY, pw, pillH, pillH / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(253,224,71,0.3)';
      ctx.lineWidth = 1;
      rr(ctx, pillX, pillY, pw, pillH, pillH / 2); ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText(f.name, pillX + pw / 2, pillY + 15);
      pillX += pw + 6;
    });

    // ── FOOTER CTA
    const footerY = H - 36;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, footerY - 10); ctx.lineTo(W - 20, footerY - 10); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('Track your cannabis journey at cannabaseai.com', W / 2, footerY + 4);

    const dataUrl = canvas.toDataURL('image/png');
    setPreview(dataUrl);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!preview) return;

    const mobile = isMobile();
    const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

    if (mobile && canShare) {
      // Mobile: use native share sheet → Save to Photos
      try {
        const res = await fetch(preview);
        const blob = await res.blob();
        const file = new File([blob], 'cannabase-brag-sheet.png', { type: 'image/png' });
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          files: [file],
          title: 'My CannaBrags',
        });
      } catch {
        // user cancelled or share failed — fall back to download
        const a = document.createElement('a');
        a.href = preview;
        a.download = 'cannabase-brag-sheet.png';
        a.click();
      }
    } else {
      // Desktop: straight download
      const a = document.createElement('a');
      a.href = preview;
      a.download = 'cannabase-brag-sheet.png';
      a.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <canvas ref={canvasRef} className="hidden" />

      {!preview && (
        <button
          onClick={generate}
          disabled={generating}
          className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm disabled:opacity-50 hover:bg-emerald-400 transition-colors"
        >
          {generating ? 'Generating…' : '✨ Generate My Brag Sheet'}
        </button>
      )}

      {preview && (
        <div className="flex flex-col items-center gap-3 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Your cannabis brag sheet"
            className="rounded-2xl shadow-xl w-full max-w-xs border border-white/10"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              {isMobile() && 'share' in navigator ? '↑ Save to Photos' : '↓ Download'}
            </button>
            <button
              onClick={() => { setPreview(null); generate(); }}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              ↺ Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
