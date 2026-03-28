import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { type ExtractedProduct } from '@/types/product';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { extractedData: ExtractedProduct; dispensaryName?: string };
    const { extractedData, dispensaryName } = body;

    if (!extractedData) {
      return NextResponse.json({ error: 'No data to save.' }, { status: 400 });
    }

    // Get the currently logged-in user
    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    const userId = user?.id ?? null;

    const ALLOWED_STRAIN_TYPES = ['indica', 'sativa', 'hybrid', 'unknown'];
    const rawStrainType = (extractedData.strain_type ?? '').toLowerCase().trim();
    const strainType = ALLOWED_STRAIN_TYPES.includes(rawStrainType) ? rawStrainType : null;

    // Use service role client to do the actual inserts
    const supabase = createServerSupabaseClient();

    const { data: newLog, error: dbError } = await supabase.from('product_logs').insert({
      user_id: userId,
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
    }).select('id').single();

    if (dbError) {
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    // Auto-remove from wishlist if this strain was wishlisted
    const strainNameSaved = extractedData.strain_name?.trim();
    if (userId && strainNameSaved) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .ilike('strain_name', strainNameSaved);
    }

    // Auto-save dispensary name for future autocomplete
    if (dispensaryName?.trim()) {
      const { data: existing } = await supabase
        .from('dispensaries')
        .select('id')
        .eq('name', dispensaryName.trim())
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('dispensaries')
          .insert({ name: dispensaryName.trim(), user_id: userId });
      }
    }

    return NextResponse.json({ success: true, id: newLog?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return