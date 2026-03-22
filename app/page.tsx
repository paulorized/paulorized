import { ScanForm } from '@/components/scan-form';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Cannabis Scan MVP
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Upload product label images, extract structured fields, and save each scan.</h1>
        <p className="text-base text-zinc-400">
          This MVP keeps the flow intentionally small: upload images, call OpenAI for extraction, persist the result to Supabase,
          and show the JSON response.
        </p>
      </div>

      <ScanForm />
    </main>
  );
}
