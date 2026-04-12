import { createServerSupabaseClient } from '@/lib/supabase.server';
import { StrainDetailClient } from './strain-detail-client';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR: re-build each strain page at most once per hour

// Pre-generate the top 100 strains at build time so they're served from edge
export async function generateStaticParams() {
  try {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from('strains')
      .select('slug')
      .not('slug', 'is', null)
      .limit(100);
    return (data ?? []).filter(r => r.slug).map(r => ({ slug: r.slug as string }));
  } catch {
    return [];
  }
}

interface StrainRow {
  name: string;
  strain_type: string | null;
  strain_bio: string | null;
  typical_effects: string[] | null;
  typical_flavors: string[] | null;
  thc_min: number | null;
  thc_max: number | null;
  cbd_min: number | null;
  cbd_max: number | null;
  nugshot_url: string | null;
  leafly_url: string | null;
}

export default async function StrainDetailPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = 'then' in params ? await params : params;

  const db = createServerSupabaseClient();
  const { data } = await db
    .from('strains')
    .select('name, strain_type, strain_bio, typical_effects, typical_flavors, thc_min, thc_max, cbd_min, cbd_max, nugshot_url, leafly_url')
    .eq('slug', slug)
    .single<StrainRow>();

  if (!data) notFound();

  const result = {
    strain_name: data.name,
    strain_type: data.strain_type ?? 'unknown',
    strain_bio: data.strain_bio ?? '',
    typical_effects: data.typical_effects ?? [],
    typical_flavors: data.typical_flavors ?? [],
    thc_min: data.thc_min ?? null,
    thc_max: data.thc_max ?? null,
    cbd_min: data.cbd_min ?? null,
    cbd_max: data.cbd_max ?? null,
    best_for: '',
    also_known_as: [] as string[],
    confidence: 1.0,
    source: 'index' as const,
    nugshot_url: data.nugshot_url ?? null,
    leafly_url: data.leafly_url ?? null,
  };

  return <StrainDetailClient result={result} />;
}
