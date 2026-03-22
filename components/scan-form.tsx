'use client';

import { useMemo, useState } from 'react';
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

  const fileNames = useMemo(() => files.map((file) => file.name).join(', '), [files]);

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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Scan failed.');
      }

      setResult(payload.data);
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
          <p className="mt-1 text-sm text-zinc-400">Upload one or more product images, extract data, and save the result.</p>
        </div>

        <label className="block text-sm font-medium text-zinc-200">
          Images
          <input
            className="mt-2 block w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-8 text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-950"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            required
          />
        </label>

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
