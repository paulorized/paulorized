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
  strainTypeCounts?: Record<string, number>;
  thcDistribution?: { range: string; count: number }[];
  productTypeCounts?: Record<string, number>;
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
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
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

function loadFont(name: string, url: string): Promise<void> {
  const font = new FontFace(name, `url(${url})`);
  return font.load().then(f => { document.fonts.add(f); });
}

function drawDefaultAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#34d399'); grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${r}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
}

// Draw a section label
function sectionLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.fillStyle = '#52525b';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export function StatsCard({
  username, avatarUrl, totalScans, totalReviews, totalGrams,
  avgThc, avgRating, wbaPct, topStrains, topEffects, topFlavors, topBrand,
  strainTypeCounts = {}, thcDistribution = [], productTypeCounts = {},
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);
    try {
      await loadFont('Montserrat', 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2');
    } catch { /* fallback */ }

    const canvas = canvasRef.current!;
    const W = 390;
    // We'll calculate H dynamically after laying out sections
    // Use a fixed generous height then trim — canvas will be set after
    const FULL_H = 1100;
    canvas.width = W; canvas.height = FULL_H;
    const ctx = canvas.getContext('2d')!;

    // ── PALETTE
    const PAD = 20;
    const barColors = ['#34d399', '#a78bfa', '#fde047', '#38bdf8', '#f97316', '#ec4899'];
    const strainTypeColors: Record<string, string> = {
      sativa: '#fde047', indica: '#a78bfa', hybrid: '#34d399', cbd: '#38bdf8', other: '#71717a',
    };

    // ── BACKGROUND
    ctx.fillStyle = '#0a0f0a'; ctx.fillRect(0, 0, W, FULL_H);
    const bg = ctx.createLinearGradient(0, 0, 0, FULL_H);
    bg.addColorStop(0, 'rgba(16,185,129,0.06)'); bg.addColorStop(0.5, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(139,92,246,0.06)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, FULL_H);

    // dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    for (let x = 20; x < W; x += 22)
      for (let y = 20; y < FULL_H; y += 22) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }

    // ── LOGO
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px Montserrat, system-ui';
    const cW = ctx.measureText('Canna').width, bW2 = ctx.measureText('Base').width, aW = ctx.measureText('AI').width;
    let lx = W / 2 - (cW + bW2 + aW) / 2;
    ctx.fillStyle = '#34d399'; ctx.textAlign = 'left'; ctx.fillText('Canna', lx, 24); lx += cW;
    ctx.fillStyle = '#fde047'; ctx.fillText('Base', lx, 24); lx += bW2;
    ctx.fillStyle = '#f97316'; ctx.fillText('AI', lx, 24);

    // ── AVATAR
    const avatarSize = 64, avatarCX = W / 2, avatarCY = 82;
    ctx.save();
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2); ctx.clip();
    if (avatarUrl) {
      try { const img = await loadImage(avatarUrl); ctx.drawImage(img, avatarCX - 32, avatarCY - 32, 64, 64); }
      catch { drawDefaultAvatar(ctx, avatarCX, avatarCY, 32); }
    } else { drawDefaultAvatar(ctx, avatarCX, avatarCY, 32); }
    ctx.restore();
    // ring
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, 35, 0, Math.PI * 2); ctx.stroke();

    // ── USERNAME
    ctx.font = 'bold 20px Montserrat, system-ui';
    ctx.textAlign = 'center'; ctx.fillStyle = '#f4f4f5'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`@${username}`, W / 2, 132);

    // subtitle
    ctx.font = '700 9px system-ui'; ctx.fillStyle = '#34d399';
    ctx.fillText('MY CANNABIS BRAG SHEET 🌿', W / 2, 145);

    // divider
    ctx.strokeStyle = 'rgba(52,211,153,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 153); ctx.lineTo(W - PAD, 153); ctx.stroke();
    let curY = 160;

    // ── STAT TILES (2 rows of 2, then 2 wide)
    const tileH = 50, tileGap = 6;
    const tileW2 = (W - PAD * 2 - tileGap) / 2;
    const statTiles = [
      { label: 'PRODUCTS LOGGED', value: String(totalScans), color: '#34d399' },
      { label: 'WEIGHT LOGGED', value: formatWeight(totalGrams), color: '#fde047' },
      { label: 'AVG THC', value: avgThc != null ? `${avgThc.toFixed(1)}%` : '—', color: '#a78bfa' },
      { label: 'REVIEWS WRITTEN', value: String(totalReviews), color: '#38bdf8' },
    ];
    statTiles.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const tx = PAD + col * (tileW2 + tileGap);
      const ty = curY + row * (tileH + tileGap);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, tx, ty, tileW2, tileH, 10); ctx.fill();
      ctx.strokeStyle = t.color + '55'; ctx.lineWidth = 1; rr(ctx, tx, ty, tileW2, tileH, 10); ctx.stroke();
      // top accent bar
      ctx.fillStyle = t.color; rr(ctx, tx, ty, tileW2, 3, 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 20px system-ui'; ctx.fillStyle = t.color;
      ctx.fillText(t.value, tx + tileW2 / 2, ty + tileH / 2 - 8);
      ctx.font = '8px system-ui'; ctx.fillStyle = '#71717a';
      ctx.fillText(t.label, tx + tileW2 / 2, ty + tileH / 2 + 10);
    });
    curY += 2 * (tileH + tileGap) + 4;

    // rating + WBA (2 wide tiles)
    const wTileW = (W - PAD * 2 - tileGap) / 2;
    const ratingTiles = [
      { label: 'AVG RATING', value: avgRating != null ? `${stars(avgRating)}  ${avgRating.toFixed(1)}/5` : '—', color: '#fde047' },
      { label: 'WOULD BUY AGAIN', value: wbaPct != null ? `${wbaPct.toFixed(0)}%` : '—', color: '#34d399' },
    ];
    ratingTiles.forEach((t, i) => {
      const tx = PAD + i * (wTileW + tileGap);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, tx, curY, wTileW, tileH, 10); ctx.fill();
      ctx.strokeStyle = t.color + '55'; ctx.lineWidth = 1; rr(ctx, tx, curY, wTileW, tileH, 10); ctx.stroke();
      ctx.fillStyle = t.color; rr(ctx, tx, curY, wTileW, 3, 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px system-ui'; ctx.fillStyle = t.color;
      ctx.fillText(t.value, tx + wTileW / 2, curY + tileH / 2 - 8);
      ctx.font = '8px system-ui'; ctx.fillStyle = '#71717a';
      ctx.fillText(t.label, tx + wTileW / 2, curY + tileH / 2 + 10);
    });
    curY += tileH + tileGap + 10;

    // ── TOP STRAINS (full-width colored bars, dark text)
    if (topStrains.length > 0) {
      sectionLabel(ctx, 'TOP STRAINS', PAD, curY + 10);
      curY += 16;
      const maxCount = topStrains[0].count;
      const strainBarH = 20, strainGap = 5;
      const strainBarColors = ['#34d399', '#a78bfa', '#fde047', '#38bdf8', '#f97316'];
      topStrains.slice(0, 5).forEach((s, i) => {
        const bw = Math.max(60, ((s.count / (maxCount || 1)) * (W - PAD * 2)));
        const by = curY + i * (strainBarH + strainGap);
        const col = strainBarColors[i % strainBarColors.length];
        // full-width track
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; rr(ctx, PAD, by, W - PAD * 2, strainBarH, 6); ctx.fill();
        // filled bar
        ctx.fillStyle = col; rr(ctx, PAD, by, bw, strainBarH, 6); ctx.fill();
        // name — dark text on bar
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.font = 'bold 10px system-ui'; ctx.fillStyle = '#0a0f0a';
        let name = s.name;
        while (ctx.measureText(name).width > bw - 28 && name.length > 2) name = name.slice(0, -1);
        if (name !== s.name) name += '…';
        ctx.fillText(name, PAD + 8, by + strainBarH / 2);
        // count — right of bar
        ctx.textAlign = 'right'; ctx.fillStyle = '#a1a1aa'; ctx.font = '10px system-ui';
        ctx.fillText(`${s.count}×`, W - PAD, by + strainBarH / 2);
      });
      curY += topStrains.slice(0, 5).length * (strainBarH + strainGap) + 4;
    }

    // ── FAV BRAND banner
    if (topBrand) {
      const brandH = 36;
      const brandGrad = ctx.createLinearGradient(PAD, curY, W - PAD, curY);
      brandGrad.addColorStop(0, 'rgba(52,211,153,0.15)'); brandGrad.addColorStop(1, 'rgba(167,139,250,0.15)');
      ctx.fillStyle = brandGrad; rr(ctx, PAD, curY, W - PAD * 2, brandH, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(52,211,153,0.25)'; ctx.lineWidth = 1;
      rr(ctx, PAD, curY, W - PAD * 2, brandH, 10); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // label line
      ctx.font = '9px system-ui'; ctx.fillStyle = '#71717a';
      ctx.fillText('🏆  FAVORITE BRAND', W / 2, curY + 10);
      // brand name
      ctx.font = 'bold 14px system-ui'; ctx.fillStyle = '#f4f4f5';
      ctx.fillText(topBrand.toUpperCase(), W / 2, curY + brandH - 8);
      curY += brandH + 10;
    }

    // ── TOP EFFECTS (pill chips)
    if (topEffects.length > 0) {
      sectionLabel(ctx, 'TOP EFFECTS', PAD, curY + 10);
      curY += 16;
      const pillH = 22, pillGap = 6;
      const effectColors = ['#34d399', '#a78bfa', '#fde047', '#38bdf8', '#f97316', '#ec4899'];
      let px = PAD, py = curY;
      ctx.font = 'bold 10px system-ui';
      topEffects.slice(0, 6).forEach((e, i) => {
        const tw = ctx.measureText(e.name).width + 18;
        if (px + tw > W - PAD) { px = PAD; py += pillH + pillGap; }
        ctx.fillStyle = effectColors[i % effectColors.length];
        rr(ctx, px, py, tw, pillH, pillH / 2); ctx.fill();
        ctx.fillStyle = '#0a0f0a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.name, px + tw / 2, py + pillH / 2);
        px += tw + pillGap;
      });
      curY = py + pillH + 8;
    }

    // ── TOP FLAVORS (pill chips, full width)
    if (topFlavors.length > 0) {
      sectionLabel(ctx, 'TOP FLAVORS', PAD, curY + 10);
      const flavorColors = ['#fde047', '#f97316', '#34d399', '#38bdf8', '#a78bfa', '#ec4899'];
      ctx.font = 'bold 10px system-ui';
      let fpx = PAD, fpy = curY + 16;
      const pillH = 22, pillGap = 6;
      topFlavors.slice(0, 6).forEach((f, i) => {
        const tw = ctx.measureText(f.name).width + 18;
        if (fpx + tw > W - PAD) { fpx = PAD; fpy += pillH + pillGap; }
        ctx.fillStyle = flavorColors[i % flavorColors.length];
        rr(ctx, fpx, fpy, tw, pillH, pillH / 2); ctx.fill();
        ctx.fillStyle = '#0a0f0a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(f.name, fpx + tw / 2, fpy + pillH / 2);
        fpx += tw + pillGap;
      });
      curY = fpy + pillH + 10;
    }

    // ── STRAIN TYPES — stacked 100% horizontal bar
    const strainTotal = Object.values(strainTypeCounts).reduce((s, n) => s + n, 0);
    if (strainTotal > 0) {
      sectionLabel(ctx, 'STRAIN TYPES', PAD, curY + 10);
      curY += 16;
      const stackH = 22, stackW = W - PAD * 2, stackR = 6;
      const strainOrder = ['sativa','indica','hybrid','cbd','other'].filter(t => (strainTypeCounts[t] ?? 0) > 0);

      // draw stacked bar segments
      let segX = PAD;
      strainOrder.forEach((type, i) => {
        const count = strainTypeCounts[type]!;
        const segW = (count / strainTotal) * stackW;
        const isFirst = i === 0, isLast = i === strainOrder.length - 1;
        ctx.fillStyle = strainTypeColors[type];
        ctx.beginPath();
        ctx.moveTo(segX + (isFirst ? stackR : 0), curY);
        ctx.lineTo(segX + segW - (isLast ? 0 : 0) - (isFirst ? 0 : 0), curY);
        if (isLast) { ctx.lineTo(segX + segW, curY); ctx.lineTo(segX + segW, curY + stackH); }
        else { ctx.lineTo(segX + segW, curY); ctx.lineTo(segX + segW, curY + stackH); }
        ctx.lineTo(segX + (isFirst ? 0 : 0), curY + stackH);
        ctx.closePath();
        // Use rr only for first/last caps
        if (isFirst && isLast) { rr(ctx, segX, curY, segW, stackH, stackR); }
        else if (isFirst) {
          ctx.beginPath();
          ctx.moveTo(segX + stackR, curY); ctx.lineTo(segX + segW, curY);
          ctx.lineTo(segX + segW, curY + stackH); ctx.lineTo(segX + stackR, curY + stackH);
          ctx.quadraticCurveTo(segX, curY + stackH, segX, curY + stackH - stackR);
          ctx.lineTo(segX, curY + stackR);
          ctx.quadraticCurveTo(segX, curY, segX + stackR, curY);
          ctx.closePath();
        } else if (isLast) {
          ctx.beginPath();
          ctx.moveTo(segX, curY); ctx.lineTo(segX + segW - stackR, curY);
          ctx.quadraticCurveTo(segX + segW, curY, segX + segW, curY + stackR);
          ctx.lineTo(segX + segW, curY + stackH - stackR);
          ctx.quadraticCurveTo(segX + segW, curY + stackH, segX + segW - stackR, curY + stackH);
          ctx.lineTo(segX, curY + stackH);
          ctx.closePath();
        } else {
          ctx.beginPath();
          ctx.rect(segX, curY, segW, stackH);
        }
        ctx.fill();

        // pct label on segment if wide enough
        const pct = Math.round((count / strainTotal) * 100);
        ctx.font = 'bold 9px system-ui'; ctx.fillStyle = '#0a0f0a';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (segW > 24) ctx.fillText(`${pct}%`, segX + segW / 2, curY + stackH / 2);
        segX += segW;
      });

      // legend row below bar
      curY += stackH + 6;
      let legX = PAD;
      ctx.font = '8px system-ui'; ctx.textBaseline = 'middle';
      strainOrder.forEach(type => {
        const count = strainTypeCounts[type]!;
        ctx.fillStyle = strainTypeColors[type]; ctx.fillRect(legX, curY - 4, 7, 7);
        ctx.fillStyle = '#a1a1aa'; ctx.textAlign = 'left';
        const label = `${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`;
        ctx.fillText(label, legX + 10, curY);
        legX += ctx.measureText(label).width + 18;
      });
      curY += 14;
    }

    // ── THC DISTRIBUTION (full width, colored bars, dark text)
    const thcHasData = thcDistribution.some(b => b.count > 0);
    if (thcHasData) {
      sectionLabel(ctx, 'THC RANGE', PAD, curY + 10);
      curY += 16;
      const maxBucket = Math.max(...thcDistribution.map(b => b.count));
      const thcBarH = 20, thcGap = 5;
      const thcColors = ['#52525b', '#71717a', '#fde047', '#f97316', '#ef4444', '#dc2626'];
      thcDistribution.forEach((b, i) => {
        const bw = maxBucket > 0 ? Math.max(50, (b.count / maxBucket) * (W - PAD * 2)) : 0;
        const by = curY + i * (thcBarH + thcGap);
        // track
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; rr(ctx, PAD, by, W - PAD * 2, thcBarH, 5); ctx.fill();
        if (b.count > 0) {
          // filled bar
          ctx.fillStyle = thcColors[Math.min(i, thcColors.length - 1)];
          rr(ctx, PAD, by, bw, thcBarH, 5); ctx.fill();
          // label on bar — dark text
          ctx.font = 'bold 9px system-ui'; ctx.fillStyle = '#0a0f0a';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(b.range, PAD + 7, by + thcBarH / 2);
          ctx.textAlign = 'right';
          ctx.fillText(String(b.count), PAD + bw - 6, by + thcBarH / 2);
        } else {
          // empty track label
          ctx.font = '9px system-ui'; ctx.fillStyle = '#3f3f46';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(b.range, PAD + 7, by + thcBarH / 2);
        }
      });
      curY += thcDistribution.length * (thcBarH + thcGap) + 4;
    }

    // ── PRODUCT TYPES (full width, colored bars, dark text)
    const prodEntries = Object.entries(productTypeCounts)
      .filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 6);
    if (prodEntries.length > 0) {
      sectionLabel(ctx, 'PRODUCT TYPES', PAD, curY + 10);
      curY += 16;
      const prodMax = prodEntries[0][1];
      const prodBarH = 20, prodGap = 5;
      prodEntries.forEach(([name, count], i) => {
        const bw = Math.max(50, (count / prodMax) * (W - PAD * 2));
        const by = curY + i * (prodBarH + prodGap);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; rr(ctx, PAD, by, W - PAD * 2, prodBarH, 5); ctx.fill();
        ctx.fillStyle = barColors[i % barColors.length];
        rr(ctx, PAD, by, bw, prodBarH, 5); ctx.fill();
        ctx.font = 'bold 9px system-ui'; ctx.fillStyle = '#0a0f0a';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        ctx.fillText(label, PAD + 7, by + prodBarH / 2);
        ctx.textAlign = 'right';
        ctx.fillText(String(count), PAD + bw - 6, by + prodBarH / 2);
      });
      curY += prodEntries.length * (prodBarH + prodGap) + 4;
    }

    // ── FOOTER
    curY += 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, curY); ctx.lineTo(W - PAD, curY); ctx.stroke();
    curY += 14;

    // tricolor footer logo
    ctx.font = 'bold 12px Montserrat, system-ui';
    ctx.textBaseline = 'alphabetic';
    const fp = [{ t: 'canna', c: '#4ade80' }, { t: 'ba.se', c: '#fde047' }, { t: '/ai', c: '#f97316' }];
    const fAll = fp.map(p => p.t).join('');
    let fx = W / 2 - ctx.measureText(fAll).width / 2;
    fp.forEach(p => {
      ctx.fillStyle = p.c; ctx.textAlign = 'left';
      ctx.fillText(p.t, fx, curY);
      fx += ctx.measureText(p.t).width;
    });

    // subtext
    curY += 14;
    ctx.font = '9px system-ui'; ctx.fillStyle = '#52525b'; ctx.textAlign = 'center';
    ctx.fillText('Track your cannabis journey at CannaBaseAI.com', W / 2, curY);
    curY += 20;

    // ── CROP CANVAS to actual content height
    const finalH = curY;
    const imageData = ctx.getImageData(0, 0, W, finalH);
    canvas.height = finalH;
    ctx.putImageData(imageData, 0, 0);

    // outer border (redrawn after crop)
    ctx.strokeStyle = 'rgba(16,185,129,0.25)'; ctx.lineWidth = 1;
    rr(ctx, 0.5, 0.5, W - 1, finalH - 1, 20); ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    setPreview(dataUrl);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!preview) return;
    const blob = await (await fetch(preview)).blob();
    const file = new File([blob], 'cannabase-brag-sheet.png', { type: 'image/png' });
    if ('share' in navigator) {
      try { await navigator.share({ files: [file], title: 'My CannaBa.se Stats' }); return; }
      catch { /* fall through */ }
    }
    const a = document.createElement('a');
    a.href = preview; a.download = 'cannabase-brag-sheet.png'; a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />
      {!preview ? (
        <button onClick={generate} disabled={generating}
          className="px-6 py-3 rounded-xl bg-yellow-400 text-zinc-900 font-semibold text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors">
          {generating ? 'Generating…' : 'Generate Brag Sheet'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <img src={preview} alt="Brag sheet preview"
            className="w-full max-w-sm rounded-2xl border border-zinc-800 shadow-xl" />
          <div className="flex gap-3">
            <button onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 text-zinc-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
              {'share' in navigator ? 'Share' : 'Download'}
            </button>
            <button onClick={() => { setPreview(null); generate(); }} disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
