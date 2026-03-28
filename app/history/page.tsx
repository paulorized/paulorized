import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { HistoryClient } from '@/components/history-client';

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
  headshot_url: string | null;
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
    .select('id, brand, product_type, strain_name, strain_type, thc_percent, cbd_percent, thc_mg, cbd_mg, mg_per_piece, weight, dispensary_name, created_at, headshot_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return <HistoryClient logs={(data ?? []) as ProductLog[]} />;
}