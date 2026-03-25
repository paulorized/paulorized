import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { type ExtractedProduct } from '@/types/product';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { extractedData: ExtractedProduct; userId?: string; dispensaryName?: string };
    const { extractedData, userId, dispensaryName } = body;

    if (!extractedData) {
      return NextResponse.json({ error: 'No data to save.' }, { status: 400 });
    }

    const ALLOWED_STRAIN_TYPES = ['indica', 'sativa', 'hybrid', 'unknown'];
    const rawStrainType = (extractedData.strain_type ?? '').toLowerCase().trim();
    const strainType = ALLOWED_STRAIN_TYPES.includes(rawStrainType) ? rawStrainType : null;

    const supabase = createServerSupabaseClient();

    // Save the product log
    const { error: dbError } = await supabase.from('product_logs').insert({
      user_id: userId || null,
      brand: extractedData.brand ?? '',
      product_type: extractedData.product_type ?? '',
      weight: extractedData.weight ?? '',
      strain_type: strainType,
      strain_name: extractedData.strain_name ?? '',
      strain_bio: extractedData.strain_bio ?? '',
      thc_percent: extractedData.thc_percent ?? null,
      cbd_percent: extractedData.cbd_percent ?? null,
      thc_mg: extractedData.thc_mg ?? null,
      cbd_mg: extractedData.cbd_mg ?? null,
      mg_per_piece: extractedData.mg_per_piece ?? null,
      extraction_confidence: extractedData.confidence ?? null,
      extracted_data_json: extractedData,
      dispensary_name: dispensaryName?.trim() || null,
    });

    if (dbError) {
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    // Auto-save dispensary name for future autocomplete
    if (dispensaryName?.trim()) {
      // Check if dispensary already exists before inserting
      const { data: existing } = await supabase
        .from('dispensaries')
        .select('id')
        .eq('name', dispensaryName.trim())
        .is('user_id', userId || null)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('dispensaries')
          .insert({ name: dispensaryName.trim(), user_id: userId || null });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
