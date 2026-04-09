'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { emptyProduct, type ExtractedProduct } from '@/types/product';
import { ReviewForm } from './review-form';
import { GuestGateModal } from './guest-gate-modal';
import { incrementGuestScanCount, isGuestLimitReached } from './guest-banner';
import { ScanHelpModal, shouldAutoShowScanTutorial } from './scan-help-modal';

const PRODUCT_TYPES = [
  'Flower', 'Pre-roll', 'Vape', 'Concentrate', 'Edible', 'Tincture', 'Topical', 'Capsule', 'Beverage', 'Other',
];

const STRAIN_TYPES = ['sativa', 'indica', 'hybrid', 'unknown'];

const fieldLabels: Array<{ key: keyof ExtractedProduct; label: string; type?: 'number'; section: 'product' | 'strain' | 'potency' }> = [
  { key: 'brand', label: 'Brand', section: 'product' },
  { key: 'weight', label: 'Weight', section: 'product' },
  { key: 'strain_name', label: 'Strain name', section: 'strain' },
  { key: 'strain_type', label: 'Strain type', section: 'strain' },
  { key: 'strain_bio', label: 'Description', section: 'strain' },
  { key: 'thc_percent', label: 'THC %', type: 'number', section: 'potency' },
  { key: 'cbd_percent', label: 'CBD %', type: 'number', section: 'potency' },
  { key: 'thc_mg', label: 'THC mg (total)', type: 'number', section: 'potency' },
  { key: 'cbd_mg', label: 'CBD mg (total)', type: 'number', section: 'potency' },
  { key: 'mg_per_piece', label: 'mg per piece', type: 'number', section: 'potency' },
];

type Stage = 'idle' | 'scanned' | 'saved';
type Mode = 'choose' | 'upload' | 'camera' | 'manual';


const inputClass = 'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition';

export function ScanForm({ isGuest = false }: { isGuest?: boolean }) {
  const searchParams = useSearchParams();
  const [guestGate, setGuestGate] = useState<'limit' | 'save' | null>(null);
  const [mode, setMode] = useState<Mode>('choose');
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ExtractedProduct>(emptyProduct);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedLogId, setSavedLogId] = useState<string | null>(null);
  const [aiEffects, setAiEffects] = useState<string[]>([]);
  const [aiFlavors, setAiFlavors] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [showJson, setShowJson] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpAutoShown, setHelpAutoShown] = useState(false);

  // Auto-show the scan tutorial once on first visit (unless user opted out)
  useEffect(() => {
    if (shouldAutoShowScanTutorial()) {
      setShowHelp(true);
      setHelpAutoShown(true);
    }
  }, []);

// Manual entry search state
  const [manualBrand, setManualBrand] = useState('');
  const [manualStrain, setManualStrain] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  // New manual entry state
  const [strainResults, setStrainResults] = useState<Array<{slug:string;name:string;strain_type:string;thc_min:number|null;thc_max:number|null;typical_effects?:string[];typical_flavors?:string[]}>>([]);
  const [selectedStrain, setSelectedStrain] = useState<typeof strainResults[0] | null>(null);
  const [strainSearchQuery, setStrainSearchQuery] = useState('');
  const [isSearchingStrains, setIsSearchingStrains] = useState(false);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [showOzConverter, setShowOzConverter] = useState(false);
  const [ozInput, setOzInput] = useState('');
  const strainSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when ?reset=1 is in the URL (logo click)
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      // Stop any active camera stream
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setFiles([]);
      setResult(emptyProduct);
      setError('');
      setStage('idle');
      setDispensaryName('');
      setMode('choose');
      setCameraOpen(false);
      setManualBrand('');
      setManualStrain('');
      setLookupError('');
      setLookupDone(false);
      setStrainResults([]);
      setSelectedStrain(null);
      setStrainSearchQuery('');
      setShowOzConverter(false);
      setOzInput('');
    }
  }, [searchParams]);

  // Dispensary state
  const [dispensaryName, setDispensaryName] = useState('');
  const [dispensaries, setDispensaries] = useState<string[]>([]);
  const [showDispensaryDropdown, setShowDispensaryDropdown] = useState(false);
  const dispensaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/dispensaries')
      .then((r) => r.json())
      .then((data) => setDispensaries((data.dispensaries ?? []).map((d: { name: string }) => d.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dispensaryRef.current && !dispensaryRef.current.contains(e.target as Node)) {
        setShowDispensaryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredDispensaries = dispensaries.filter((d) =>
    d.toLowerCase().includes(dispensaryName.toLowerCase()) && d.toLowerCase() !== dispensaryName.toLowerCase()
  );

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileCount = files.length;

  const openCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFiles((prev) => [...prev, file]);
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleScan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guest limit check
    if (isGuest && isGuestLimitReached()) {
      setGuestGate('limit');
      return;
    }
    setIsScanning(true);
    setError('');
    setStage('idle');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    try {
      const response = await fetch('/api/scan', { method: 'POST', body: formData });
      const responseText = await response.text();
      let payload: { error?: string; extractedData?: ExtractedProduct } | null = null;
      try { payload = responseText ? JSON.parse(responseText) : null; } catch { throw new Error(responseText || 'Invalid response.'); }
      if (!response.ok) throw new Error(payload?.error || 'Scan failed.');
      if (!payload?.extractedData) throw new Error('No data returned from scan.');
      setResult(payload.extractedData);
      setStage('scanned');
      if (isGuest) {
        incrementGuestScanCount();
        window.dispatchEvent(new Event('cbai_scan_used'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (isGuest) { setGuestGate('save'); return; }
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData: result, dispensaryName: dispensaryName || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Save failed.');
      setSavedLogId(payload.id ?? null);
      setStage('saved');
      // Fire AI strain lookup in background for effects/flavors pre-fill
      if (result.strain_name?.trim()) {
        fetch('/api/strain-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: result.strain_name }),
        }).then(r => r.json()).then(data => {
          if (data.result && !data.result.not_found && (data.result.confidence ?? 0) >= 0.4) {
            if (data.result.typical_effects?.length) setAiEffects(data.result.typical_effects);
            if (data.result.typical_flavors?.length) setAiFlavors(data.result.typical_flavors);
          }
        }).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(emptyProduct);
    setError('');
    setStage('idle');
    setDispensaryName('');
    setMode('choose');
    setCameraOpen(false);
    setSavedLogId(null);
    setAiEffects([]);
    setAiFlavors([]);
    setManualBrand('');
    setManualStrain('');
    setLookupError('');
    setLookupDone(false);
    setStrainResults([]);
    setSelectedStrain(null);
    setStrainSearchQuery('');
    setShowOzConverter(false);
    setOzInput('');
      };

  const handleStrainLookup = async () => {
    if (!manualBrand.trim() && !manualStrain.trim()) return;
    setIsLooking(true);
    setLookupError('');
    try {
      const res = await fetch('/api/strain-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: manualBrand.trim(), strain: manualStrain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed.');
      setResult((prev) => ({ ...prev, ...data.product }));
      setLookupDone(true);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsLooking(false);
    }
  };

  const handleFieldChange = (key: keyof ExtractedProduct, value: string) => {
    setResult((current) => ({
      ...current,
      [key]:
        key === 'thc_percent' || key === 'cbd_percent' || key === 'thc_mg' || key === 'cbd_mg' || key === 'mg_per_piece'
          ? value === '' ? null : Number(value)
          : key === 'confidence'
            ? value === '' ? 0 : Number(value)
            : value,
    }));
  };

  const sections = [
    { title: 'Product', keys: fieldLabels.filter(f => f.section === 'product') },
    { title: 'Strain', keys: fieldLabels.filter(f => f.section === 'strain') },
    { title: 'Potency', keys: fieldLabels.filter(f => f.section === 'potency') },
  ];

  // ── Guest gate modal (rendered over any stage) ──
  if (guestGate) {
    return <GuestGateModal reason={guestGate} onClose={() => setGuestGate(null)} />;
  }

  // ── Saved confirmation screen ──
  if (stage === 'saved') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">✓</span>
            <h2 className="font-semibold text-zinc-100">Saved to your log ✅</h2>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 space-y-3">
            {dispensaryName && <p className="text-sm text-zinc-400">📍 {dispensaryName}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {result.brand && <div><p className="text-xs text-zinc-600">Brand</p><p className="font-medium text-zinc-100">{result.brand}</p></div>}
              {result.strain_name && <div><p className="text-xs text-zinc-600">Strain</p><p className="font-medium text-zinc-100">{result.strain_name}</p></div>}
              {result.strain_type && <div><p className="text-xs text-zinc-600">Type</p><p className="font-medium text-zinc-100 capitalize">{result.strain_type}</p></div>}
              {result.product_type && <div><p className="text-xs text-zinc-600">Product</p><p className="font-medium text-zinc-100">{result.product_type}</p></div>}
              {result.thc_percent != null && <div><p className="text-xs text-zinc-600">THC</p><p className="font-medium text-zinc-100">{result.thc_percent}%</p></div>}
              {result.cbd_percent != null && <div><p className="text-xs text-zinc-600">CBD</p><p className="font-medium text-zinc-100">{result.cbd_percent}%</p></div>}
              {result.thc_mg != null && <div><p className="text-xs text-zinc-600">THC total</p><p className="font-medium text-zinc-100">{result.thc_mg}mg</p></div>}
              {result.mg_per_piece != null && <div><p className="text-xs text-zinc-600">Per piece</p><p className="font-medium text-zinc-100">{result.mg_per_piece}mg</p></div>}
            </div>
            {result.thc_estimated && (
              <p className="text-xs text-amber-400/80">⚠️ THC/CBD values are estimates — potency info was not found on the label.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleReset}
              className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition active:bg-emerald-300">
              Log another
            </button>
            <a href="/history"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-center text-sm font-medium text-zinc-300 transition hover:bg-zinc-800">
              View my log →
            </a>
          </div>
        </div>

        {/* Inline review with AI pre-fill */}
        {savedLogId && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-100">Leave a review</p>
              {(aiEffects.length > 0 || aiFlavors.length > 0) && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">✦ AI pre-filled</span>
              )}
            </div>
            <p className="text-xs text-emerald-400/70">Reviews posted to community earn you helpful votes — votes level up your rank 🌿→🌳</p>
            <ReviewForm
              productLogId={savedLogId}
              productType={result.product_type}
              suggestedEffects={aiEffects}
              suggestedFlavors={aiFlavors}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Review & save screen (after scan or manual) ──
  if (stage === 'scanned') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">2</span>
              <h2 className="font-semibold text-zinc-100">Review &amp; edit</h2>
            </div>
            <button type="button" onClick={handleReset} className="text-xs text-zinc-600 hover:text-zinc-400 transition">← Start over</button>
          </div>

          {sections.map(({ title, keys }) => (
            <div key={title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{title}</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Product type dropdown injected into Product section */}
                {title === 'Product' && (
                  <label>
                    <span className="mb-1.5 block text-xs text-zinc-500">Product type</span>
                    <select
                      className={inputClass}
                      value={result.product_type ?? ''}
                      onChange={(e) => handleFieldChange('product_type', e.target.value)}
                    >
                      <option value="">Select type…</option>
                      {PRODUCT_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                    </select>
                  </label>
                )}
                {/* Strain type dropdown injected into Strain section */}
                {title === 'Strain' && (
                  <label>
                    <span className="mb-1.5 block text-xs text-zinc-500">Strain type</span>
                    <select
                      className={inputClass}
                      value={result.strain_type ?? ''}
                      onChange={(e) => handleFieldChange('strain_type', e.target.value)}
                    >
                      <option value="">Select type…</option>
                      {STRAIN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </label>
                )}
                {keys.filter(f => f.key !== 'strain_type').map(({ key, label, type }) => (
                  <label key={key} className={key === 'strain_bio' ? 'col-span-2' : ''}>
                    <span className="mb-1.5 block text-xs text-zinc-500">{label}</span>
                    {key === 'strain_bio' ? (
                      <textarea
                        className={`${inputClass} min-h-20 resize-none`}
                        value={result[key] === null ? '' : String(result[key])}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    ) : (
                      <input
                        className={inputClass}
                        type={type === 'number' ? 'number' : 'text'}
                        step={type === 'number' ? '0.01' : undefined}
                        value={result[key] === null ? '' : String(result[key])}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Dispensary */}
          <div ref={dispensaryRef} className="relative">
            <input className={inputClass} type="text" placeholder="📍 Dispensary (optional)"
              value={dispensaryName}
              onChange={(e) => { setDispensaryName(e.target.value); setShowDispensaryDropdown(true); }}
              onFocus={() => setShowDispensaryDropdown(true)}
              autoComplete="off"
            />
            {showDispensaryDropdown && filteredDispensaries.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                {filteredDispensaries.map((d) => (
                  <li key={d} onMouseDown={() => { setDispensaryName(d); setShowDispensaryDropdown(false); }}
                    className="cursor-pointer px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800">
                    📍 {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {result.thc_estimated && (
            <p className="text-xs text-amber-400/80">⚠️ THC/CBD values are estimates — potency info was not found on the label. For accurate numbers, try scanning all sides of the package.</p>
          )}

          <button type="button" onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-emerald-400 py-4 text-base font-semibold text-zinc-950 transition active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500">
            {isSaving ? 'Saving…' : '💾 Save to my log'}
          </button>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button type="button" onClick={() => setShowJson(v => !v)}
            className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-500 transition">
            <span>{showJson ? '▾' : '▸'}</span>
            <span>{showJson ? 'Hide' : 'Show'} raw JSON</span>
          </button>
          {showJson && (
            <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-emerald-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // ── Choose mode screen ──
  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <ScanHelpModal open={showHelp} onClose={() => setShowHelp(false)} allowSuppress={helpAutoShown} />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-zinc-100">How would you like to log?</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[10px] text-zinc-600">
                <svg width="9" height="11" viewBox="0 0 814 1000" fill="currentColor" className="opacity-50 shrink-0">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-194.3 127.4-297.5 252.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                iOS soon
              </span>
              <button
                type="button"
                onClick={() => { setShowHelp(true); setHelpAutoShown(false); }}
                aria-label="How to scan"
                title="How to scan"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-400 transition hover:border-emerald-500/50 hover:text-emerald-400"
              >
                ?
              </button>
            </div>
          </div>

          {/* Camera */}
          <button type="button" onClick={() => { setMode('camera'); openCamera(); }}
            className="w-full flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 transition hover:border-yellow-500/40 hover:bg-zinc-800/60 active:scale-[0.99] text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </span>
            <div>
              <p className="font-semibold text-zinc-100 text-sm">Scan with camera</p>
              <p className="text-xs text-zinc-500 mt-0.5">Capture front, back &amp; potency label. Multiple shots welcome — nothing saves to your camera roll.</p>
            </div>
            <span className="ml-auto text-zinc-600 text-lg">›</span>
          </button>

          {/* Upload photo */}
          <label className="cursor-pointer block">
            <input className="hidden" type="file" accept="image/*" multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 0) { setFiles(selected); setMode('upload'); }
              }} />
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 transition hover:border-emerald-500/40 hover:bg-zinc-800/60 active:scale-[0.99]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </span>
              <div>
                <p className="font-semibold text-zinc-100 text-sm">Upload from photos</p>
                <p className="text-xs text-zinc-500 mt-0.5">Already took pics? Pick them from your camera roll — all sides, THC%, strain, brand.</p>
              </div>
              <span className="ml-auto text-zinc-600 text-lg">›</span>
            </div>
          </label>

          {/* Manual entry */}
          <button type="button" onClick={() => setMode('manual')}
            className="w-full flex items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 transition hover:border-purple-500/40 hover:bg-zinc-800/60 active:scale-[0.99] text-left">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </span>
            <div>
              <p className="font-semibold text-zinc-100 text-sm">Search &amp; enter manually</p>
              <p className="text-xs text-zinc-500 mt-0.5">AI pulls deep strain intel — type, THC/CBD range, bio, typical effects &amp; flavors — from Leafly + Claude. Just type a name.</p>
            </div>
            <span className="ml-auto text-zinc-600 text-lg">›</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Camera mode ──
  if (mode === 'camera') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">1</span>
              <h2 className="font-semibold text-zinc-100">Scan with camera</h2>
            </div>
            <button type="button" onClick={() => { closeCamera(); setMode('choose'); }} className="text-xs text-zinc-600 hover:text-zinc-400 transition">← Back</button>
          </div>

          {cameraOpen ? (
            <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
              <video ref={videoRef} className="w-full" autoPlay playsInline muted />
              <div className="flex gap-3 p-3">
                <button type="button" onClick={capturePhoto}
                  className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition active:bg-emerald-300">
                  📸 Take photo
                </button>
                <button type="button" onClick={() => { closeCamera(); setMode('choose'); }}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800">
                  Cancel
                </button>
              </div>
            </div>
          ) : fileCount > 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-emerald-400">{fileCount} photo{fileCount > 1 ? 's' : ''} captured ✓</p>
              <p className="text-xs text-zinc-500">💡 Snap all visible sides — especially the potency label — for best results.</p>
            </div>
          ) : null}

          {cameraError && <p className="text-sm text-rose-400">{cameraError}</p>}

          {fileCount > 0 && !cameraOpen && (
            <form onSubmit={handleScan} className="space-y-2">
              <div className="flex gap-2">
                <button type="button" onClick={openCamera}
                  className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 py-4 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 active:scale-[0.99]">
                  📷 Add more photos
                </button>
                <button className="flex-[2] rounded-2xl bg-emerald-400 py-4 text-base font-semibold text-zinc-950 transition active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500"
                  type="submit" disabled={isScanning}>
                  {isScanning ? '🔍 Scanning…' : '🔍 Scan label'}
                </button>
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Upload mode ──
  if (mode === 'upload') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">1</span>
              <h2 className="font-semibold text-zinc-100">Upload photos</h2>
            </div>
            <button type="button" onClick={() => { setFiles([]); setMode('choose'); }} className="text-xs text-zinc-600 hover:text-zinc-400 transition">← Back</button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-950 px-4 py-3 text-sm">
            <span className="text-zinc-400">{fileCount} file{fileCount > 1 ? 's' : ''} selected</span>
            <div className="flex gap-3">
              <label className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 transition">
                <input className="hidden" type="file" accept="image/*" multiple
                  onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                + Add more
              </label>
              <button type="button" onClick={() => setFiles([])} className="text-xs text-zinc-600 hover:text-zinc-400 transition">Clear</button>
            </div>
          </div>

          <p className="text-xs text-zinc-500">💡 For best results, include photos of all visible sides of the package — especially the potency label.</p>

          <form onSubmit={handleScan}>
            <button className="w-full rounded-2xl bg-emerald-400 py-4 text-base font-semibold text-zinc-950 transition active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500"
              type="submit" disabled={isScanning || fileCount === 0}>
              {isScanning ? '🔍 Scanning…' : '🔍 Scan label'}
            </button>
            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  // ── Manual entry mode ──
  if (mode === 'manual') {
    const typeConfig: Record<string, {color: string; icon: string}> = {
      indica:  { color: 'text-purple-300 border-purple-500/30 bg-purple-500/10', icon: '🌙' },
      sativa:  { color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10', icon: '☀️' },
      hybrid:  { color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10', icon: '⚡' },
      unknown: { color: 'text-zinc-400 border-zinc-600 bg-zinc-800/50', icon: '🌿' },
    };

    const handleStrainSearch = (q: string) => {
      setStrainSearchQuery(q);
      setSelectedStrain(null);
            if (strainSearchTimer.current) clearTimeout(strainSearchTimer.current);
      if (!q.trim()) { setStrainResults([]); return; }
      strainSearchTimer.current = setTimeout(async () => {
        setIsSearchingStrains(true);
        try {
          const res = await fetch('/api/strain-results-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q.trim() }),
          });
          const data = await res.json();
          setStrainResults(data.results ?? []);
        } catch { setStrainResults([]); }
        finally { setIsSearchingStrains(false); }
      }, 400);
    };

    // Single combined action: if no strain is selected from the list, try web search first,
    // then fall through to AI populate regardless.
    const handleUseStrain = async () => {
      const strainName = selectedStrain?.name ?? strainSearchQuery.trim();
      if (!strainName) return;
      if (isGuest && isGuestLimitReached()) { setGuestGate('limit'); return; }
      if (isGuest) { incrementGuestScanCount(); }
      setIsLooking(true);
      setLookupError('');

      // If the user typed something but didn't pick from the list, do a quick web search
      // to find a better match before populating.
      let resolvedStrain = selectedStrain;
      if (!resolvedStrain) {
        try {
          setIsWebSearching(true);
          const res = await fetch('/api/strain-results-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: strainName, force_web: true }),
          });
          const data = await res.json();
          const results = data.results ?? [];
          if (results.length > 0) {
            resolvedStrain = results[0];
            setStrainResults(results);
            setSelectedStrain(results[0]);
          }
        } catch { /* silent — fall through to AI populate */ }
        finally { setIsWebSearching(false); }
      }

      // Now populate details via AI lookup
      try {
        const res = await fetch('/api/strain-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strain: resolvedStrain?.name ?? strainName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Lookup failed.');
        setResult(prev => ({ ...prev, ...data.product }));
        setLookupDone(true);
      } catch (err) {
        // Fallback: use whatever we have from the search result
        if (resolvedStrain) {
          setResult(prev => ({
            ...prev,
            strain_name: resolvedStrain!.name,
            strain_type: resolvedStrain!.strain_type,
            thc_percent: resolvedStrain!.thc_max ?? prev.thc_percent,
            thc_estimated: true,
          }));
        } else {
          setResult(prev => ({ ...prev, strain_name: strainName }));
        }
        setLookupDone(true);
        setLookupError(err instanceof Error ? err.message : 'Using search result data.');
      } finally {
        setIsLooking(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">1</span>
              <h2 className="font-semibold text-zinc-100">Enter product details</h2>
            </div>
            <button type="button" onClick={() => { setResult(emptyProduct); setManualBrand(''); setManualStrain(''); setLookupError(''); setLookupDone(false); setStrainResults([]); setSelectedStrain(null); setStrainSearchQuery(''); setMode('choose'); }} className="text-xs text-zinc-600 hover:text-zinc-400 transition">← Back</button>
          </div>

          {/* STEP 1 — Strain search */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Step 1 — Find your strain</p>
            <div className="relative">
              <input
                className={inputClass}
                type="text"
                placeholder="Search strain name… e.g. Gelato, GMO, Diesel"
                value={strainSearchQuery}
                onChange={e => handleStrainSearch(e.target.value)}
                autoComplete="off"
              />
              {isSearchingStrains && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 animate-pulse">Searching…</span>
              )}
            </div>

            {/* After strain is confirmed — show compact chip instead of results/button */}
            {lookupDone ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-sm font-semibold text-zinc-100">
                    {result.strain_name ?? selectedStrain?.name ?? strainSearchQuery.trim()}
                  </span>
                  {result.strain_type && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${typeConfig[result.strain_type]?.color ?? typeConfig.unknown.color}`}>
                      {result.strain_type}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLookupDone(false);
                    setSelectedStrain(null);
                    setStrainResults([]);
                    setStrainSearchQuery('');
                    setLookupError('');
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                >
                  change
                </button>
              </div>
            ) : (
              <>
                {/* Strain result cards — compact */}
                {strainResults.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {strainResults.map(s => {
                      const tc = typeConfig[s.strain_type] ?? typeConfig.unknown;
                      const isSelected = selectedStrain?.slug === s.slug;
                      const thc = s.thc_min != null && s.thc_max != null
                        ? `${s.thc_min}–${s.thc_max}%`
                        : s.thc_max != null ? `~${s.thc_max}%` : null;
                      return (
                        <button
                          key={s.slug}
                          type="button"
                          onClick={() => setSelectedStrain(isSelected ? null : s)}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                            isSelected
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-base leading-none">{tc.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-zinc-100">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {thc && <span className="text-xs text-emerald-400 font-medium">{thc} THC</span>}
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${tc.color}`}>{s.strain_type}</span>
                            {isSelected && <span className="text-emerald-400 text-sm">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Single action button — shown when user has typed or selected a strain */}
                {(selectedStrain || strainSearchQuery.trim()) && !isSearchingStrains && (
                  <button
                    type="button"
                    onClick={handleUseStrain}
                    disabled={isLooking || isWebSearching}
                    className="w-full rounded-xl bg-purple-500/80 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
                  >
                    {isWebSearching
                      ? '🌐 Searching…'
                      : isLooking
                        ? '⏳ Loading strain data…'
                        : selectedStrain
                          ? `✦ Use ${selectedStrain.name}`
                          : `✦ Use "${strainSearchQuery.trim()}"`}
                  </button>
                )}
              </>
            )}
            {lookupError && lookupDone && <p className="text-xs text-amber-400">⚠️ {lookupError}</p>}
          </div>

          {/* STEP 2 — Product type + Brand */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Step 2 — Product details</p>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">Brand</span>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="e.g. Cookies"
                  value={String(result.brand ?? '')}
                  onChange={e => handleFieldChange('brand', e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">Product type</span>
                <select
                  className={inputClass}
                  value={result.product_type ?? ''}
                  onChange={e => handleFieldChange('product_type', e.target.value)}
                >
                  <option value="">Select type…</option>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
              </label>
            </div>

            {/* Weight — locked to grams with oz converter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Weight <span className="text-zinc-600">(grams only)</span></span>
                <button
                  type="button"
                  onClick={() => setShowOzConverter(v => !v)}
                  className="text-[10px] text-emerald-500 hover:text-emerald-400 transition"
                >
                  {showOzConverter ? '✕ close converter' : '⚖️ oz → g converter'}
                </button>
              </div>
              {showOzConverter && (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/60 px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="oz"
                    value={ozInput}
                    onChange={e => {
                      setOzInput(e.target.value);
                      const oz = parseFloat(e.target.value);
                      if (!isNaN(oz)) handleFieldChange('weight', String(Math.round(oz * 28.3495 * 100) / 100));
                    }}
                    className="w-20 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-xs text-zinc-500">oz</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {ozInput && !isNaN(parseFloat(ozInput))
                      ? `${Math.round(parseFloat(ozInput) * 28.3495 * 100) / 100}g`
                      : '—'}
                  </span>
                  <span className="text-xs text-zinc-500">grams</span>
                </div>
              )}
              <input
                className={inputClass}
                type="number"
                step="0.01"
                placeholder="e.g. 3.5"
                value={String(result.weight ?? '')}
                onChange={e => handleFieldChange('weight', e.target.value)}
              />
            </div>
          </div>

          {/* STEP 3 — Potency + extras */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Step 3 — Potency <span className="text-zinc-700 normal-case font-normal">(edit if needed)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">THC %</span>
                <input className={inputClass} type="number" step="0.01" placeholder="e.g. 23.5"
                  value={result.thc_percent === null ? '' : String(result.thc_percent)}
                  onChange={e => handleFieldChange('thc_percent', e.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">CBD %</span>
                <input className={inputClass} type="number" step="0.01" placeholder="e.g. 0.1"
                  value={result.cbd_percent === null ? '' : String(result.cbd_percent)}
                                    onChange={e => handleFieldChange('cbd_percent', e.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">THC mg (total)</span>
                <input className={inputClass} type="number" step="0.1" placeholder="edibles"
                  value={result.thc_mg === null ? '' : String(result.thc_mg)}
                  onChange={e => handleFieldChange('thc_mg', e.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-zinc-500">mg per piece</span>
                <input className={inputClass} type="number" step="0.1" placeholder="edibles"
                  value={result.mg_per_piece === null ? '' : String(result.mg_per_piece)}
                  onChange={e => handleFieldChange('mg_per_piece', e.target.value)} />
              </label>
            </div>
            {result.thc_estimated && (
              <p className="text-xs text-amber-400/80">⚠️ THC is an AI estimate — update if you know the exact %.</p>
            )}
          </div>

          {/* Dispensary */}
          <div ref={dispensaryRef} className="relative">
            <p className="mb-1.5 text-xs text-zinc-500">📍 Dispensary <span className="text-zinc-700">(optional)</span></p>
            <input className={inputClass} type="text" placeholder="Where did you get it?"
              value={dispensaryName}
              onChange={e => { setDispensaryName(e.target.value); setShowDispensaryDropdown(true); }}
              onFocus={() => setShowDispensaryDropdown(true)}
              autoComplete="off"
            />
            {showDispensaryDropdown && filteredDispensaries.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                {filteredDispensaries.map(d => (
                  <li key={d} onMouseDown={() => { setDispensaryName(d); setShowDispensaryDropdown(false); }}
                    className="cursor-pointer px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800">
                    📍 {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button type="button" onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-emerald-400 py-4 text-base font-semibold text-zinc-950 transition active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500">
            {isSaving ? 'Saving…' : '💾 Save to my log'}
          </button>

        </div>
      </div>
    );
  }

  return null;
}