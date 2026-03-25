'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { emptyProduct, type ExtractedProduct } from '@/types/product';

const fieldLabels: Array<{ key: keyof ExtractedProduct; label: string; type?: 'number'; section: 'product' | 'strain' | 'potency' }> = [
  { key: 'brand', label: 'Brand', section: 'product' },
  { key: 'product_type', label: 'Product type', section: 'product' },
  { key: 'weight', label: 'Weight', section: 'product' },
  { key: 'strain_name', label: 'Strain name', section: 'strain' },
  { key: 'strain_type', label: 'Strain type', section: 'strain' },
  { key: 'strain_bio', label: 'Description', section: 'strain' },
  { key: 'thc_percent', label: 'THC %', type: 'number', section: 'potency' },
  { key: 'cbd_percent', label: 'CBD %', type: 'number', section: 'potency' },
  { key: 'thc_mg', label: 'THC mg (total)', type: 'number', section: 'potency' },
  { key: 'cbd_mg', label: 'CBD mg (total)', type: 'number', section: 'potency' },
  { key: 'mg_per_piece', label: 'mg per piece', type: 'number', section: 'potency' },
  { key: 'confidence', label: 'Scan confidence', type: 'number', section: 'potency' },
];

type Stage = 'idle' | 'scanned' | 'saved';

const inputClass = 'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 transition';

export function ScanForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [userId] = useState('');
  const [result, setResult] = useState<ExtractedProduct>(emptyProduct);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [showJson, setShowJson] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData: result, userId: userId || undefined, dispensaryName: dispensaryName || undefined }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Save failed.');
      setStage('saved');
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

  // Group fields by section
  const sections = [
    { title: 'Product', keys: fieldLabels.filter(f => f.section === 'product') },
    { title: 'Strain', keys: fieldLabels.filter(f => f.section === 'strain') },
    { title: 'Potency', keys: fieldLabels.filter(f => f.section === 'potency') },
  ];

  return (
    <div className="space-y-4">

      {/* ── Step 1: Add images ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">1</span>
          <h2 className="font-semibold text-zinc-100">Add photos</h2>
          {fileCount > 0 && <span className="ml-auto text-xs text-emerald-400">{fileCount} photo{fileCount > 1 ? 's' : ''} added</span>}
        </div>

        {/* Camera viewfinder */}
        {cameraOpen && (
          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            <video ref={videoRef} className="w-full" autoPlay playsInline muted />
            <div className="flex gap-3 p-3">
              <button type="button" onClick={capturePhoto}
                className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition active:bg-emerald-300">
                📸 Take photo
              </button>
              <button type="button" onClick={closeCamera}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 transition hover:bg-zinc-800">
                Cancel
              </button>
            </div>
          </div>
        )}

        {!cameraOpen && (
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input className="hidden" type="file" accept="image/*" multiple
                onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 py-6 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300 active:bg-zinc-900">
                <span className="text-2xl">🖼️</span>
                <span>Upload</span>
              </div>
            </label>
            <button type="button" onClick={openCamera}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 py-6 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300 active:bg-zinc-900">
              <span className="text-2xl">📷</span>
              <span>Camera</span>
            </button>
          </div>
        )}

        {cameraError && <p className="text-sm text-rose-400">{cameraError}</p>}

        {fileCount > 0 && !cameraOpen && (
          <div className="flex items-center justify-between rounded-xl bg-zinc-950 px-4 py-2.5 text-sm">
            <span className="text-zinc-400">{fileCount} file{fileCount > 1 ? 's' : ''} selected</span>
            <button type="button" onClick={() => setFiles([])} className="text-xs text-zinc-600 hover:text-zinc-300 transition">Clear</button>
          </div>
        )}

        {/* Dispensary */}
        <div ref={dispensaryRef} className="relative">
          <input
            className={inputClass}
            type="text"
            placeholder="📍 Dispensary (optional)"
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
      </div>

      {/* ── Step 2: Scan button ── */}
      <form onSubmit={handleScan}>
        <button
          className="w-full rounded-2xl bg-emerald-400 py-4 text-base font-semibold text-zinc-950 transition active:bg-emerald-300 disabled:bg-zinc-700 disabled:text-zinc-500"
          type="submit"
          disabled={isScanning || fileCount === 0}
        >
          {isScanning ? '🔍 Scanning…' : '🔍 Scan label'}
        </button>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </form>

      {/* ── Step 3: Review & save ── */}
      {(stage === 'scanned' || stage === 'saved') && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">2</span>
            <h2 className="font-semibold text-zinc-100">
              {stage === 'saved' ? 'Saved to your log ✅' : 'Review & edit'}
            </h2>
          </div>

          {stage === 'saved' ? (
            <div className="space-y-4">
              {/* Summary card */}
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
                  {result.cbd_mg != null && <div><p className="text-xs text-zinc-600">CBD total</p><p className="font-medium text-zinc-100">{result.cbd_mg}mg</p></div>}
                  {result.mg_per_piece != null && <div><p className="text-xs text-zinc-600">Per piece</p><p className="font-medium text-zinc-100">{result.mg_per_piece}mg</p></div>}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleReset}
                  className="flex-1 rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition active:bg-emerald-300">
                  Scan another
                </button>
                <a href="/history"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-center text-sm font-medium text-zinc-300 transition hover:bg-zinc-800">
                  View my log →
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map(({ title, keys }) => (
                <div key={title} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{title}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {keys.map(({ key, label, type }) => (
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
          )}
        </div>
      )}
    </div>
  );
}
