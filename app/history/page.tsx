import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { HistoryClient } from '@/components/history-client';

type Terpene = { name: string; percent: number | null; source?: string };

type ProductLog = {
  id: string;
  brand: string;
  product_type: string;
  strain_name: string;
  strain_type: string | null;
  strain_bio: string | null;
  thc_percent: number | null;
  cbd_percent: number | null;
  thc_mg: number | null;
  cbd_mg: number | null;
  mg_per_piece: number | null;
  weight: string;
  dispensary_name: string | null;
  created_at: string;
  headshot_url: string | null;
  has_review: boolean;
  terpenes?: Terpene[] | null;
};

export default async function HistoryPage() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect('/login');

  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/profile');

  const { data } = await supabase
    .from('product_logs')
    .select('id, brand, product_type, strain_name, strain_type, strain_bio, thc_percent, cbd_percent, thc_mg, cbd_mg, mg_per_piece, weight, dispensary_name, created_at, headshot_url, terpenes, reviews(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  // Flatten the joined reviews into a simple has_review boolean
  const logs: ProductLog[] = (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as Omit<ProductLog, 'has_review'>),
    has_review: Array.isArray(row.reviews) ? row.reviews.length > 0 : false,
  }));

  return <HistoryClient logs={logs} />;
}
