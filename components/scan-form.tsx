'use client';

import { useMemo, useRef, useState } from 'react';
import { emptyProduct, type ExtractedProduct } from '@/types/product';

const fieldLabels: Array<{ key: keyof ExtractedProduct; label: string; type?: 'number' }> = [
  { key: 'brand', label: 'Brand' },
  { key: 'product_type', label: 'Product type' },
  { key: 'weight', label: 'Weight' },
  { key: 'strain_type', label: 'Strain type' },
  { key: 'strain_name', label: 'Strain name' },
  { key: 'strain_bio', label: 'Strain bio' },
  { key: 'thc_percent', label: 'THC %', type: 'number' },
  { key: 'cbd_percent', label: 'CBD %', type: 'number' },
  { key: 'confidence', label: 'Confidence', type: 'number' },
];

export function ScanForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<ExtractedProduct>(emptyProduct);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileNames = useMemo(() => files.map((file) => file.name).join(', '), [files]);

  const openCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Attach stream to video element after it mounts
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setCameraError('Could not access camera. Please allow camera permissions and try again.');
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (userId) {
      formData.append('user_id', userId);
    }

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let payload: { error?: string; extractedData?: ExtractedProduct } | null = null;

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(responseText || 'Invalid response from scan API.');
      }

      if (!response.ok) {
        throw new Error(payload?.error || 'Scan failed.');
      }

      if (!payload?.extractedData) {
        throw new Error('Scan API returned no extracted data.');
      }

      setResult(payload.extractedData);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Scan failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (key: keyof ExtractedProduct, value: string) => {
    setResult((current) => ({
      ...current,
      [key]:
        key === 'thc_percent' || key === 'cbd_percent'
          ? value === ''
            ? null
            : Number(value)
          : key === 'confidence'
            ? value === ''
              ? 0
              : Number(value)
            : value,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div>
          <h2 className="text-xl font-semibold">Scan product label</h2>
          <p className="mt-1 text-sm text-zinc-400">Upload images or use your camera to extract data and save the result.</p>
        </div>

        {/* Camera viewfinder */}
        {cameraOpen && (
          <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            <video
              ref={videoRef}
              className="w-full"
              autoPlay
              playsInline
              muted
            />
            <div className="flex gap-3 p-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 rounded-xl bg-emerald-400 py-3 font-medium text-zinc-950 transition hover:bg-emerald-300"
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input row: file upload + camera button */}
        {!cameraOpen && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-zinc-200">Images</span>
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setFiles((prev) => [...prev, ...Array.from(event.target.files || [])])}
                />
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">
                  Upload images
                </div>
              </label>
              <button
                type="button"
                onClick={openCamera}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                📷 Camera
              </button>
            </div>
            {cameraError && <p className="text-sm text-rose-400">{cameraError}</p>}
          </div>
        )}

        <label className="block text-sm font-medium text-zinc-200">
          User ID (optional for now)
          <input
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            type="text"
            placeholder="Paste a Supabase auth user UUID later"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-400">
          <strong className="text-zinc-200">Selected files:</strong> {fileNames || 'None yet'}
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => setFiles([])}
              className="ml-3 text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        <button
          className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-3 font-medium text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          type="submit"
          disabled={isLoading || files.length === 0}
        >
          {isLoading ? 'Scanning…' : 'Scan and save'}
        </button>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </form>

      <section className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <div>
          <h2 className="text-xl font-semibold">Review extracted fields</h2>
          <p className="mt-1 text-sm text-zinc-400">After the scan runs, the extracted values appear here for quick review or manual edits.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fieldLabels.map(({ key, label, type }) => (
            <label key={key} className={key === 'strain_bio' ? 'sm:col-span-2' : ''}>
              <span className="mb-2 block text-sm font-medium text-zinc-200">{label}</span>
              {key === 'strain_bio' ? (
                <textarea
                  className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  value={result[key] === null ? '' : String(result[key])}
                  onChange={(event) => handleFieldChange(key, event.target.value)}
                />
              ) : (
                <input
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  type={type === 'number' ? 'number' : 'text'}
                  step={type === 'number' ? '0.01' : undefined}
                  value={result[key] === null ? '' : String(result[key])}
                  onChange={(event) => handleFieldChange(key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Extracted JSON</h3>
          <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-emerald-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
