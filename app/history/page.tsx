import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { HistoryRow } from '@/components/history-row';

type ProductLog = {
  id: string;
  brand: string;
  product_type: string;
  strain_name: string;
  strain_type: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  thc_mg: number | null;
  cbd_mg: number | null;
  mg_per_piece: number | null;
  weight: string;
  dispensary_name: string | null;
  created_at: string;
};

export default async function HistoryPage() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  // Fetch only this user's logs
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('product_logs')
    .select('id, brand, product_type, strain_name, strain_type, thc_percent, cbd_percent, thc_mg, cbd_mg, mg_per_piece, weight, dispensary_name, created_at')
    .is('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = (data ?? []) as ProductLog[];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">My Log</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95"
        >
          + Scan
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Failed to load history: {error.message}
        </div>
      )}

      {logs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 py-20 text-center">
          <div className="mb-3 text-4xl">🌿</div>
          <p className="font-medium text-zinc-300">Nothing scanned yet</p>
          <p className="mt-1 text-sm text-zinc-500">Scan your first product to start tracking</p>
          <Link
            href="/"
            className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            Scan a product
          </Link>
        </div>
      )}

      {logs.length > 0 && (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <HistoryRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}
