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

function loadFont(name: string, url: string): Promise<void> {
  const font = new FontFace(name, `url(${url})`);
  return font.load().then(f => { document.fonts.add(f); });
}

function drawDefaultAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#34d399');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${r}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
}

export function StatsCard({
  username, avatarUrl, totalScans, totalReviews, totalGrams,
  avgThc, avgRating, wbaPct, topStrains, topEffects, topFlavors, topBrand,
  strainTypeCounts = {}, thcDistribution = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true);

    try {
      await loadFont('Montserrat', 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2');
    } catch { /* fallback silently */ }

    const canvas = canvasRef.current!;
    const W = 390, H = 870;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── BACKGROUND
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#09090b'); bg.addColorStop(0.4, '#0b1a12'); bg.addColorStop(1, '#09090b');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // dot grid
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 20; x < W; x += 24)
      for (let y = 20; y < H; y += 24) {
        ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
      }

    // hero glow
    const heroGlow = ctx.createRadialGradient(W / 2, 160, 0, W / 2, 160, 200);
    heroGlow.addColorStop(0, 'rgba(16,185,129,0.18)'); heroGlow.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = heroGlow; ctx.fillRect(0, 0, W, 360);

    // bottom glow
    const bottomGlow = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 300);
    bottomGlow.addColorStop(0, 'rgba(139,92,246,0.14)'); bottomGlow.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = bottomGlow; ctx.fillRect(0, H - 300, W, 300);

    // outer border
    ctx.strokeStyle = 'rgba(16,185,129,0.3)'; ctx.lineWidth = 1;
    rr(ctx, 0.5, 0.5, W - 1, H - 1, 28); ctx.stroke();

    // ── LOGO BAR
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 17px Montserrat, system-ui, sans-serif';
    const cW = ctx.measureText('Canna').width;
    const bW = ctx.measureText('Base').width;
    const aW = ctx.measureText('AI').width;
    let lx = W / 2 - (cW + bW + aW) / 2;
    ctx.fillStyle = '#34d399'; ctx.textAlign = 'left'; ctx.fillText('Canna', lx, 26); lx += cW;
    ctx.fillStyle = '#fde047'; ctx.fillText('Base', lx, 26); lx += bW;
    ctx.fillStyle = '#f97316'; ctx.fillText('AI', lx, 26);

    // ── AVATAR
    const avatarSize = 72, avatarCX = W / 2, avatarCY = 100;
    ctx.save();
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2); ctx.clip();
    if (avatarUrl) {
      try {
        const img = await loadImage(avatarUrl);
        ctx.drawImage(img, avatarCX - avatarSize / 2, avatarCY - avatarSize / 2, avatarSize, avatarSize);
      } catch { drawDefaultAvatar(ctx, avatarCX, avatarCY, avatarSize / 2); }
    } else { drawDefaultAvatar(ctx, avatarCX, avatarCY, avatarSize / 2); }
    ctx.restore();

    // avatar ring
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 3, 0, Math.PI * 2); ctx.stroke();

    // ── USERNAME
    ctx.font = 'bold 22px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#f4f4f5';
    ctx.fillText(`@${username}`, W / 2, 150);

    // ── STATS ROW (3 tiles)
    const tileY = 175, tileH = 64, tileW = 100, tileGap = 10;
    const tiles = [
      { label: 'SCANS', value: String(totalScans), color: '#34d399' },
      { label: 'REVIEWS', value: String(totalReviews), color: '#a78bfa' },
      { label: 'CONSUMED', value: formatWeight(totalGrams), color: '#fde047' },
    ];
    tiles.forEach((t, i) => {
      const tx = 20 + i * (tileW + tileGap) + (W - 20 * 2 - tileW * 3 - tileGap * 2) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, tx, tileY, tileW, tileH, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; rr(ctx, tx, tileY, tileW, tileH, 12); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px system-ui, sans-serif'; ctx.fillStyle = t.color;
      ctx.fillText(t.value, tx + tileW / 2, tileY + tileH / 2 - 8);
      ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#71717a';
      ctx.fillText(t.label, tx + tileW / 2, tileY + tileH / 2 + 10);
    });
    ctx.textBaseline = 'alphabetic';

    // ── AVG ROW (THC / Rating / WBA)
    const avgY = tileY + tileH + 12;
    const avgTiles = [
      { label: 'AVG THC', value: avgThc != null ? `${avgThc.toFixed(1)}%` : '—', color: '#34d399' },
      { label: 'AVG RATING', value: avgRating != null ? stars(avgRating) : '—', color: '#fde047' },
      { label: 'WBA', value: wbaPct != null ? `${wbaPct.toFixed(0)}%` : '—', color: '#a78bfa' },
    ];
    avgTiles.forEach((t, i) => {
      const tx = 20 + i * (tileW + tileGap) + (W - 20 * 2 - tileW * 3 - tileGap * 2) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, tx, avgY, tileW, tileH, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; rr(ctx, tx, avgY, tileW, tileH, 12); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 15px system-ui, sans-serif'; ctx.fillStyle = t.color;
      ctx.fillText(t.value, tx + tileW / 2, avgY + tileH / 2 - 8);
      ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#71717a';
      ctx.fillText(t.label, tx + tileW / 2, avgY + tileH / 2 + 10);
    });
    ctx.textBaseline = 'alphabetic';

    // ── TOP BRAND banner
    const brandBannerH = 32;
    if (topBrand) {
      const brandY = avgY + tileH + 12;
      const brandGrad = ctx.createLinearGradient(20, brandY, W - 20, brandY);
      brandGrad.addColorStop(0, 'rgba(52,211,153,0.12)'); brandGrad.addColorStop(1, 'rgba(167,139,250,0.12)');
      ctx.fillStyle = brandGrad; rr(ctx, 20, brandY, W - 40, brandBannerH, 10); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = '#71717a';
      ctx.fillText('TOP BRAND', W / 2, brandY + brandBannerH / 2 - 7);
      ctx.font = 'bold 13px system-ui, sans-serif'; ctx.fillStyle = '#f4f4f5';
      ctx.fillText(topBrand, W / 2, brandY + brandBannerH / 2 + 8);
    }
    ctx.textBaseline = 'alphabetic';

    // ── LIST SECTION (Strains / Effects / Flavors)
    const listsY = avgY + tileH + (topBrand ? brandBannerH + 24 : 12) + 14;
    const listColW = (W - 40 - 20) / 3;
    const lists = [
      { title: 'TOP STRAINS', items: topStrains, color: '#34d399' },
      { title: 'TOP EFFECTS', items: topEffects, color: '#a78bfa' },
      { title: 'TOP FLAVORS', items: topFlavors, color: '#fde047' },
    ];
    lists.forEach((list, ci) => {
      const colX = 20 + ci * (listColW + 10);
      ctx.font = '600 9px system-ui, sans-serif'; ctx.fillStyle = '#52525b';
      ctx.textAlign = 'left'; ctx.fillText(list.title, colX, listsY);
      list.items.slice(0, 5).forEach((item, ri) => {
        const iy = listsY + 14 + ri * 18;
        // rank dot
        ctx.fillStyle = list.color + '40';
        ctx.beginPath(); ctx.arc(colX + 5, iy - 3, 4, 0, Math.PI * 2); ctx.fill();
        ctx.font = '600 8px system-ui, sans-serif'; ctx.fillStyle = list.color; ctx.textAlign = 'center';
        ctx.fillText(String(ri + 1), colX + 5, iy - 0.5);
        ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#d4d4d8'; ctx.textAlign = 'left';
        const maxW = listColW - 18;
        let name = item.name;
        while (ctx.measureText(name).width > maxW && name.length > 2) name = name.slice(0, -1);
        if (name !== item.name) name += '…';
        ctx.fillText(name, colX + 13, iy);
      });
    });

    // ── CHARTS SECTION DIVIDER
    const chartSectionY = listsY + 5 * 18 + 28;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, chartSectionY - 14); ctx.lineTo(W - 20, chartSectionY - 14); ctx.stroke();

    // ── STRAIN TYPE DONUT (left half)
    const strainOrder = ['sativa', 'indica', 'hybrid', 'cbd', 'other'];
    const strainColors: Record<string, string> = {
      sativa: '#fde047', indica: '#a78bfa', hybrid: '#34d399', cbd: '#38bdf8', other: '#71717a',
    };
    const strainTotal = Object.values(strainTypeCounts).reduce((s, n) => s + n, 0);
    // donut sits in left half; legend in middle strip between donut and THC bars
    const donutR = 38, donutInner = 22;
    const donutCX = 20 + donutR + 4;
    const donutCY = chartSectionY + donutR + 14;

    ctx.font = '600 9px system-ui, sans-serif'; ctx.fillStyle = '#52525b'; ctx.textAlign = 'left';
    ctx.fillText('STRAIN TYPES', 20, chartSectionY + 4);

    if (strainTotal > 0) {
      let startAngle = -Math.PI / 2;
      strainOrder.forEach(type => {
        const count = strainTypeCounts[type] ?? 0;
        if (!count) return;
        const slice = (count / strainTotal) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(donutCX, donutCY);
        ctx.arc(donutCX, donutCY, donutR, startAngle, startAngle + slice);
        ctx.closePath(); ctx.fillStyle = strainColors[type]; ctx.fill();
        startAngle += slice;
      });
      // punch inner hole
      ctx.beginPath(); ctx.arc(donutCX, donutCY, donutInner, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b'; ctx.fill();
      // center label
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px system-ui, sans-serif'; ctx.fillStyle = '#f4f4f5';
      ctx.fillText(String(strainTotal), donutCX, donutCY);
      ctx.font = '7px system-ui, sans-serif'; ctx.fillStyle = '#71717a';
      ctx.fillText('logs', donutCX, donutCY + 11);
      ctx.textBaseline = 'alphabetic';

      // legend — to the right of the donut
      const legX = donutCX + donutR + 8;
      let legY = chartSectionY + 16;
      strainOrder.forEach(type => {
        const count = strainTypeCounts[type] ?? 0;
        if (!count) return;
        ctx.fillStyle = strainColors[type];
        ctx.fillRect(legX, legY - 7, 7, 7);
        ctx.font = '9px system-ui, sans-serif'; ctx.fillStyle = '#a1a1aa'; ctx.textAlign = 'left';
        ctx.fillText(`${type.charAt(0).toUpperCase() + type.slice(1)} (${count})`, legX + 10, legY);
        legY += 15;
      });
    }

    // ── THC DISTRIBUTION (right half)
    const thcX = W / 2 + 6;
    const thcW = W / 2 - 26;
    ctx.font = '600 9px system-ui, sans-serif'; ctx.fillStyle = '#52525b'; ctx.textAlign = 'left';
    ctx.fillText('THC RANGE', thcX, chartSectionY + 4);

    if (thcDistribution.filter(b => b.count > 0).length > 0) {
      const maxBucket = Math.max(...thcDistribution.map(b => b.count));
      const barH = 11, barGap = 5;
      thcDistribution.forEach((b, i) => {
        const by = chartSectionY + 16 + i * (barH + barGap);
        const bw = maxBucket > 0 ? Math.max(3, (b.count / maxBucket) * thcW) : 3;
        // track bg
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, thcX, by, thcW, barH, 3); ctx.fill();
        // filled bar
        if (b.count > 0) {
          const grad = ctx.createLinearGradient(thcX, by, thcX + bw, by);
          grad.addColorStop(0, '#fde047'); grad.addColorStop(1, '#f97316');
          ctx.fillStyle = grad; rr(ctx, thcX, by, bw, barH, 3); ctx.fill();
        }
        // labels
        ctx.font = '8px system-ui, sans-serif'; ctx.fillStyle = '#71717a'; ctx.textAlign = 'left';
        ctx.fillText(b.range, thcX + 3, by + barH - 2);
        if (b.count > 0) {
          ctx.fillStyle = '#a1a1aa'; ctx.textAlign = 'right';
          ctx.fillText(String(b.count), thcX + thcW - 2, by + barH - 2);
        }
      });
    }

    // ── FOOTER
    const footerY = H - 36;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, footerY - 8); ctx.lineTo(W - 20, footerY - 8); ctx.stroke();

    // tricolor logo in footer
    ctx.font = 'bold 13px Montserrat, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    const footerParts = [
      { text: 'canna', color: '#4ade80' },
      { text: 'ba.se', color: '#fde047' },
      { text: '/ai',   color: '#f97316' },
    ];
    const footerFull = footerParts.map(p => p.text).join('');
    let fx = W / 2 - ctx.measureText(footerFull).width / 2;
    footerParts.forEach(p => {
      ctx.fillStyle = p.color; ctx.textAlign = 'left';
      ctx.fillText(p.text, fx, footerY + 8);
      fx += ctx.measureText(p.text).width;
    });
    ctx.textBaseline = 'alphabetic';

    const dataUrl = canvas.toDataURL('image/png');
    setPreview(dataUrl);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!preview) return;
    const blob = await (await fetch(preview)).blob();
    const file = new File([blob], 'cannabase-brag-sheet.png', { type: 'image/png' });
    if ('share' in navigator) {
      try {
        await navigator.share({ files: [file], title: 'My CannaBa.se Stats' });
        return;
      } catch { /* fall through to download */ }
    }
    const a = document.createElement('a');
    a.href = preview;
    a.download = 'cannabase-brag-sheet.png';
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />
      {!preview ? (
        <button
          onClick={generate}
          disabled={generating}
          className="px-6 py-3 rounded-xl bg-yellow-400 text-zinc-900 font-semibold text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating…' : 'Generate Brag Sheet'}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <img
            src={preview}
            alt="Brag sheet preview"
            className="w-full max-w-sm rounded-2xl border border-zinc-800 shadow-xl"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 text-zinc-900 font-semibold text-sm hover:bg-yellow-300 transition-colors"
            >
              {'share' in navigator ? 'Share' : 'Download'}
            </button>
            <button
              onClick={() => { setPreview(null); generate(); }}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
