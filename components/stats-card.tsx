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

function stars(r: number | null): string {
  if (r == null) return '—';
  return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
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
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, '#34d399'); g.addColorStop(1, '#a78bfa');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${r}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
}

function sec(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = '700 9px system-ui'; ctx.fillStyle = '#52525b';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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
    try { await loadFont('Montserrat', 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2'); } catch {}
    const canvas = canvasRef.current!;
    const W = 390, FULL_H = 1200;
    canvas.width = W; canvas.height = FULL_H;
    const ctx = canvas.getContext('2d')!;
    const PAD = 18;
    const BAR_COLORS = ['#34d399','#a78bfa','#fde047','#38bdf8','#f97316','#ec4899'];
    const STRAIN_COLORS: Record<string,string> = { sativa:'#fde047', indica:'#a78bfa', hybrid:'#34d399', cbd:'#38bdf8', other:'#71717a' };

    // BACKGROUND
    ctx.fillStyle = '#0a0f0a'; ctx.fillRect(0, 0, W, FULL_H);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, FULL_H);
    bgGrad.addColorStop(0, 'rgba(16,185,129,0.07)'); bgGrad.addColorStop(1, 'rgba(139,92,246,0.07)');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, FULL_H);
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    for (let x = 20; x < W; x += 22)
      for (let y = 20; y < FULL_H; y += 22) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill(); }

    // LOGO — Canna(green) Base(yellow) AI(orange)  matches app header exactly
    ctx.textBaseline = 'middle'; ctx.font = 'bold 17px Montserrat, system-ui';
    const parts = [['Canna','#34d399'],['Base','#fde047'],['AI','#f97316']] as const;
    const logoW = parts.reduce((s,[t]) => s + ctx.measureText(t).width, 0);
    let lx = W/2 - logoW/2;
    for (const [t, c] of parts) {
      ctx.fillStyle = c; ctx.textAlign = 'left'; ctx.fillText(t, lx, 22); lx += ctx.measureText(t).width;
    }
    ctx.textBaseline = 'alphabetic';

    // AVATAR
    const AV = 64, ACX = W/2, ACY = 78;
    ctx.save(); ctx.beginPath(); ctx.arc(ACX, ACY, AV/2, 0, Math.PI*2); ctx.clip();
    if (avatarUrl) { try { ctx.drawImage(await loadImage(avatarUrl), ACX-32, ACY-32, 64, 64); } catch { drawDefaultAvatar(ctx, ACX, ACY, 32); } }
    else { drawDefaultAvatar(ctx, ACX, ACY, 32); }
    ctx.restore();
    ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ACX, ACY, 35, 0, Math.PI*2); ctx.stroke();

    // USERNAME + subtitle
    ctx.font = 'bold 20px Montserrat, system-ui'; ctx.textAlign = 'center';
    ctx.fillStyle = '#f4f4f5'; ctx.fillText(`@${username}`, W/2, 128);
    ctx.font = '700 9px system-ui'; ctx.fillStyle = '#34d399';
    ctx.fillText('MY CANNABIS BRAG SHEET 🌿', W/2, 142);

    // divider
    ctx.strokeStyle = 'rgba(52,211,153,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 150); ctx.lineTo(W-PAD, 150); ctx.stroke();
    let Y = 158;

    // STAT TILES — 2×2 grid
    const TH = 50, TG = 6, TW = (W - PAD*2 - TG) / 2;
    const tiles = [
      { label:'PRODUCTS LOGGED', val:String(totalScans), color:'#34d399' },
      { label:'WEIGHT LOGGED',   val:formatWeight(totalGrams), color:'#fde047' },
      { label:'AVG THC',         val:avgThc != null ? `${avgThc.toFixed(1)}%` : '—', color:'#a78bfa' },
      { label:'REVIEWS WRITTEN', val:String(totalReviews), color:'#38bdf8' },
    ];
    tiles.forEach((t, i) => {
      const tx = PAD + (i%2)*(TW+TG), ty = Y + Math.floor(i/2)*(TH+TG);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; rr(ctx, tx, ty, TW, TH, 10); ctx.fill();
      ctx.strokeStyle = t.color+'44'; ctx.lineWidth=1; rr(ctx, tx, ty, TW, TH, 10); ctx.stroke();
      ctx.fillStyle = t.color; rr(ctx, tx, ty, TW, 3, 2); ctx.fill();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='bold 20px system-ui'; ctx.fillStyle=t.color; ctx.fillText(t.val, tx+TW/2, ty+TH/2-8);
      ctx.font='8px system-ui'; ctx.fillStyle='#71717a'; ctx.fillText(t.label, tx+TW/2, ty+TH/2+10);
    });
    Y += 2*(TH+TG) + 4; ctx.textBaseline='alphabetic';

    // RATING + WBA tiles (2 wide)
    const rTiles = [
      { label:'AVG RATING', val: avgRating != null ? `${stars(avgRating)}  ${avgRating.toFixed(1)}/5` : '—', color:'#fde047' },
      { label:'WOULD BUY AGAIN', val: wbaPct != null ? `${wbaPct.toFixed(0)}%` : '—', color:'#34d399' },
    ];
    rTiles.forEach((t, i) => {
      const tx = PAD + i*(TW+TG);
      ctx.fillStyle='rgba(255,255,255,0.04)'; rr(ctx,tx,Y,TW,TH,10); ctx.fill();
      ctx.strokeStyle=t.color+'44'; ctx.lineWidth=1; rr(ctx,tx,Y,TW,TH,10); ctx.stroke();
      ctx.fillStyle=t.color; rr(ctx,tx,Y,TW,3,2); ctx.fill();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='bold 15px system-ui'; ctx.fillStyle=t.color; ctx.fillText(t.val, tx+TW/2, Y+TH/2-8);
      ctx.font='8px system-ui'; ctx.fillStyle='#71717a'; ctx.fillText(t.label, tx+TW/2, Y+TH/2+10);
    });
    Y += TH + TG + 10; ctx.textBaseline='alphabetic';

    // TOP STRAINS — full-width colored bars, dark text on bar
    if (topStrains.length > 0) {
      sec(ctx, 'TOP STRAINS', PAD, Y+10); Y += 16;
      const maxC = topStrains[0].count;
      topStrains.slice(0,5).forEach((s, i) => {
        const bw = Math.max(60, (s.count/(maxC||1)) * (W-PAD*2));
        const by = Y + i*26;
        ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,PAD,by,W-PAD*2,20,6); ctx.fill();
        ctx.fillStyle=BAR_COLORS[i%BAR_COLORS.length]; rr(ctx,PAD,by,bw,20,6); ctx.fill();
        ctx.font='bold 10px system-ui'; ctx.fillStyle='#0a0f0a';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        let nm=s.name; while(ctx.measureText(nm).width>bw-32&&nm.length>2) nm=nm.slice(0,-1);
        if(nm!==s.name) nm+='…';
        ctx.fillText(nm, PAD+8, by+10);
        ctx.textAlign='right'; ctx.fillStyle='#a1a1aa'; ctx.font='10px system-ui';
        ctx.fillText(`${s.count}×`, W-PAD, by+10);
      });
      Y += topStrains.slice(0,5).length*26 + 6;
    }
    ctx.textBaseline='alphabetic';

    // FAV BRAND banner
    if (topBrand) {
      const BH = 40;
      const bg2 = ctx.createLinearGradient(PAD, Y, W-PAD, Y);
      bg2.addColorStop(0,'rgba(52,211,153,0.15)'); bg2.addColorStop(1,'rgba(167,139,250,0.15)');
      ctx.fillStyle=bg2; rr(ctx,PAD,Y,W-PAD*2,BH,10); ctx.fill();
      ctx.strokeStyle='rgba(52,211,153,0.3)'; ctx.lineWidth=1; rr(ctx,PAD,Y,W-PAD*2,BH,10); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='9px system-ui'; ctx.fillStyle='#71717a';
      ctx.fillText('🏆  FAVORITE BRAND', W/2, Y+12);
      ctx.font='bold 14px system-ui'; ctx.fillStyle='#f4f4f5';
      ctx.fillText(topBrand.toUpperCase(), W/2, Y+BH-10);
      Y += BH + 10; ctx.textBaseline='alphabetic';
    }

    // TOP EFFECTS — colored pills
    if (topEffects.length > 0) {
      sec(ctx, 'TOP EFFECTS', PAD, Y+10); Y += 16;
      ctx.font='bold 10px system-ui';
      const ECOLS=['#34d399','#a78bfa','#fde047','#38bdf8','#f97316','#ec4899'];
      let ex=PAD, ey=Y;
      topEffects.slice(0,6).forEach((e,i) => {
        const tw=ctx.measureText(e.name).width+18;
        if(ex+tw>W-PAD){ex=PAD;ey+=28;}
        ctx.fillStyle=ECOLS[i%ECOLS.length]; rr(ctx,ex,ey,tw,22,11); ctx.fill();
        ctx.fillStyle='#0a0f0a'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(e.name, ex+tw/2, ey+11);
        ex+=tw+6;
      });
      Y=ey+22+8; ctx.textBaseline='alphabetic';
    }

    // TOP FLAVORS — colored pills
    if (topFlavors.length > 0) {
      sec(ctx, 'TOP FLAVORS', PAD, Y+10); Y += 16;
      ctx.font='bold 10px system-ui';
      const FCOLS=['#fde047','#f97316','#34d399','#38bdf8','#a78bfa','#ec4899'];
      let fx2=PAD, fy=Y;
      topFlavors.slice(0,6).forEach((f,i) => {
        const tw=ctx.measureText(f.name).width+18;
        if(fx2+tw>W-PAD){fx2=PAD;fy+=28;}
        ctx.fillStyle=FCOLS[i%FCOLS.length]; rr(ctx,fx2,fy,tw,22,11); ctx.fill();
        ctx.fillStyle='#0a0f0a'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(f.name, fx2+tw/2, fy+11);
        fx2+=tw+6;
      });
      Y=fy+22+8; ctx.textBaseline='alphabetic';
    }

    // STRAIN TYPES — stacked 100% horizontal bar
    const strainTotal = Object.values(strainTypeCounts).reduce((s,n)=>s+n,0);
    if (strainTotal > 0) {
      sec(ctx,'STRAIN TYPES', PAD, Y+10); Y+=16;
      const SW=W-PAD*2, SH=22, SR=6;
      const sOrder=['sativa','indica','hybrid','cbd','other'].filter(t=>(strainTypeCounts[t]??0)>0);
      let sx=PAD;
      sOrder.forEach((type,i) => {
        const cnt=strainTypeCounts[type]!;
        const segW=(cnt/strainTotal)*SW;
        const isF=i===0, isL=i===sOrder.length-1;
        ctx.fillStyle=STRAIN_COLORS[type];
        ctx.beginPath();
        if(isF&&isL){ rr(ctx,sx,Y,segW,SH,SR); }
        else if(isF){
          ctx.moveTo(sx+SR,Y); ctx.lineTo(sx+segW,Y); ctx.lineTo(sx+segW,Y+SH);
          ctx.lineTo(sx+SR,Y+SH); ctx.quadraticCurveTo(sx,Y+SH,sx,Y+SH-SR);
          ctx.lineTo(sx,Y+SR); ctx.quadraticCurveTo(sx,Y,sx+SR,Y);
        } else if(isL){
          ctx.moveTo(sx,Y); ctx.lineTo(sx+segW-SR,Y);
          ctx.quadraticCurveTo(sx+segW,Y,sx+segW,Y+SR);
          ctx.lineTo(sx+segW,Y+SH-SR); ctx.quadraticCurveTo(sx+segW,Y+SH,sx+segW-SR,Y+SH);
          ctx.lineTo(sx,Y+SH);
        } else { ctx.rect(sx,Y,segW,SH); }
        ctx.closePath(); ctx.fill();
        // pct label dark on bar
        const pct=Math.round((cnt/strainTotal)*100);
        if(segW>28){
          ctx.font='bold 9px system-ui'; ctx.fillStyle='#0a0f0a';
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(`${pct}%`, sx+segW/2, Y+SH/2);
        }
        sx+=segW;
      });
      // legend inline row
      Y+=SH+6; ctx.textBaseline='middle';
      let legX=PAD;
      sOrder.forEach(type=>{
        const cnt=strainTypeCounts[type]!;
        ctx.fillStyle=STRAIN_COLORS[type]; ctx.fillRect(legX,Y-4,7,7);
        ctx.font='8px system-ui'; ctx.fillStyle='#a1a1aa'; ctx.textAlign='left';
        const lbl=`${type[0].toUpperCase()+type.slice(1)} (${cnt})`;
        ctx.fillText(lbl, legX+10, Y);
        legX+=ctx.measureText(lbl).width+18;
      });
      Y+=14; ctx.textBaseline='alphabetic';
    }

    // THC RANGE — colored bars, dark text on bar
    if (thcDistribution.some(b=>b.count>0)) {
      sec(ctx,'THC RANGE', PAD, Y+10); Y+=16;
      const maxB=Math.max(...thcDistribution.map(b=>b.count));
      const THCC=['#52525b','#71717a','#fde047','#f97316','#ef4444','#dc2626'];
      thcDistribution.forEach((b,i)=>{
        const bw=maxB>0?Math.max(48,(b.count/maxB)*(W-PAD*2)):0;
        const by=Y+i*26;
        ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,PAD,by,W-PAD*2,20,5); ctx.fill();
        if(b.count>0){
          ctx.fillStyle=THCC[Math.min(i,THCC.length-1)]; rr(ctx,PAD,by,bw,20,5); ctx.fill();
          ctx.font='bold 9px system-ui'; ctx.fillStyle='#0a0f0a';
          ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(b.range, PAD+7, by+10);
          ctx.textAlign='right'; ctx.fillText(String(b.count), PAD+bw-6, by+10);
        } else {
          ctx.font='9px system-ui'; ctx.fillStyle='#3f3f46';
          ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(b.range, PAD+7, by+10);
        }
      });
      Y+=thcDistribution.length*26+6; ctx.textBaseline='alphabetic';
    }

    // PRODUCT TYPES — colored bars, dark text on bar
    const prodEntries=Object.entries(productTypeCounts).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).slice(0,6);
    if (prodEntries.length > 0) {
      sec(ctx,'PRODUCT TYPES', PAD, Y+10); Y+=16;
      const pMax=prodEntries[0][1];
      prodEntries.forEach(([name,count],i)=>{
        const bw=Math.max(48,(count/pMax)*(W-PAD*2));
        const by=Y+i*26;
        ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,PAD,by,W-PAD*2,20,5); ctx.fill();
        ctx.fillStyle=BAR_COLORS[i%BAR_COLORS.length]; rr(ctx,PAD,by,bw,20,5); ctx.fill();
        ctx.font='bold 9px system-ui'; ctx.fillStyle='#0a0f0a';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(name[0].toUpperCase()+name.slice(1), PAD+7, by+10);
        ctx.textAlign='right'; ctx.fillText(String(count), PAD+bw-6, by+10);
      });
      Y+=prodEntries.length*26+6; ctx.textBaseline='alphabetic';
    }

    // FOOTER divider
    Y += 8;
    ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PAD,Y); ctx.lineTo(W-PAD,Y); ctx.stroke();
    Y += 14;

    // tricolor footer logo — canna(green) ba.se(yellow) /ai(orange)
    ctx.font='bold 13px Montserrat, system-ui'; ctx.textBaseline='alphabetic';
    const fp=[['canna','#4ade80'],['ba.se','#fde047'],['/ai','#f97316']] as const;
    const fAll=fp.map(([t])=>t).join('');
    let fx3=W/2 - ctx.measureText(fAll).width/2;
    for(const [t,c] of fp){
      ctx.fillStyle=c; ctx.textAlign='left'; ctx.fillText(t,fx3,Y); fx3+=ctx.measureText(t).width;
    }
    Y += 13;
    ctx.font='9px system-ui'; ctx.fillStyle='#3f3f46'; ctx.textAlign='center';
    ctx.fillText('Track your cannabis journey at CannaBaseAI.com', W/2, Y);
    Y += 18;

    // CROP canvas to actual content
    const imgData=ctx.getImageData(0,0,W,Y);
    canvas.height=Y;
    ctx.putImageData(imgData,0,0);

    // outer border after crop
    ctx.strokeStyle='rgba(52,211,153,0.25)'; ctx.lineWidth=1;
    rr(ctx,0.5,0.5,W-1,Y-1,20); ctx.stroke();

    setPreview(canvas.toDataURL('image/png'));
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!preview) return;
    const blob = await (await fetch(preview)).blob();
    const file = new File([blob],'cannabase-brag-sheet.png',{type:'image/png'});
    if ('share' in navigator) {
      try { await navigator.share({files:[file],title:'My CannaBa.se Stats'}); return; } catch {}
    }
    const a=document.createElement('a'); a.href=preview; a.download='cannabase-brag-sheet.png'; a.click();
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
            <button onClick={()=>{setPreview(null);generate();}} disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors">
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
