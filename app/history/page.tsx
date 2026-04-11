import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { HistoryClient } from '@/components/history-client';
import { type Terpene } from '@/types/product';

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
  review_rating?: number | null;
  review_effects?: string[] | null;
  review_flavors?: string[] | null;
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
    .select('id, brand, product_type, strain_name, strain_type, strain_bio, thc_percent, cbd_percent, thc_mg, cbd_mg, mg_per_piece, weight, dispensary_name, created_at, headshot_url, terpenes, reviews(id, rating, effects, flavors)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  // Flatten the joined reviews into a simple has_review boolean
  const logs: ProductLog[] = (data ?? []).map((row: Record<string, unknown>) => {
    const reviews = Array.isArray(row.reviews) ? row.reviews : [];
    const firstReview = reviews.length > 0 ? reviews[0] as Record<string, unknown> : null;
    return {
      ...(row as Omit<ProductLog, 'has_review' | 'review_rating' | 'review_effects' | 'review_flavors'>),
      has_review: reviews.length > 0,
      review_rating: firstReview?.rating as number ?? null,
      review_effects: firstReview?.effects as string[] ?? null,
      review_flavors: firstReview?.flavors as string[] ?? null,
    };
  });

  return <HistoryClient logs={logs} />;
}
