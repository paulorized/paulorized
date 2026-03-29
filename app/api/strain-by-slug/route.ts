import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug) return NextResponse.json({ result: null });

    const db = createServerSupabaseClient();
    const { data } = await db
      .from('strains')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!data) return NextResponse.json({ result: null });

    return NextResponse.json({
      result: {
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
        also_known_as: [],
        confidence: 1.0,
        source: 'index',
        nugshot_url: data.nugshot_url ?? null,
        leafly_url: data.leafly_url ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
