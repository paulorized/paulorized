import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productLogId = searchParams.get('product_log_id');

  if (!productLogId) {
    return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch review and the dispensary_name from product_logs in parallel
  const [reviewResult, logResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('*')
      .eq('product_log_id', productLogId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('product_logs')
      .select('dispensary_name')
      .eq('id', productLogId)
      .single(),
  ]);

  if (reviewResult.error && reviewResult.error.code !== 'PGRST116') {
    return NextResponse.json({ error: reviewResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    review: reviewResult.data ?? null,
    dispensary_name: logResult.data?.dispensary_name ?? null,
  });
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_log_id, rating, would_buy_again, notes, effects, flavors,
      burn_speed, canoeing, clogging, dispensary_name,
      edible_dose_mg, edible_onset, edible_peak_duration, edible_total_duration,
      edible_effect_type, edible_feelings, edible_taste_rating, edible_dose_feedback,
    } = body;

    if (!product_log_id) {
      return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
    }

    // Get authenticated user server-side (never trust client-supplied user_id)
    let authedUserId: string | null = null;
    try {
      const auth = await createAuthServerClient();
      const { data: { user } } = await auth.auth.getUser();
      authedUserId = user?.id ?? null;
    } catch {}

    const edibleFields = {
      edible_dose_mg: edible_dose_mg ?? null,
      edible_onset: edible_onset ?? null,
      edible_peak_duration: edible_peak_duration ?? null,
      edible_total_duration: edible_total_duration ?? null,
      edible_effect_type: edible_effect_type ?? null,
      edible_feelings: edible_feelings ?? [],
      edible_taste_rating: edible_taste_rating ?? null,
      edible_dose_feedback: edible_dose_feedback ?? null,
    };

    const supabase = createServerSupabaseClient();

    // Upsert review
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_log_id', product_log_id)
      .single();

    let reviewError;
    if (existing?.id) {
      ({ error: reviewError } = await supabase
        .from('reviews')
        .update({
          user_id: authedUserId, rating, would_buy_again, notes, effects, flavors,
          burn_speed: burn_speed ?? null, canoeing: canoeing ?? null, clogging: clogging ?? null,
          ...edibleFields, updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id));
    } else {
      ({ error: reviewError } = await supabase
        .from('reviews')
        .insert({
          product_log_id, user_id: authedUserId, rating, would_buy_again, notes, effects, flavors,
          burn_speed: burn_speed ?? null, canoeing: canoeing ?? null, clogging: clogging ?? null,
          ...edibleFields,
        }));
    }

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    // Update dispensary_name on product_logs (only if provided or explicitly cleared)
    if (dispensary_name !== undefined) {
      const trimmed = typeof dispensary_name === 'string' ? dispensary_name.trim() || null : null;
      await supabase
        .from('product_logs')
        .update({ dispensary_name: trimmed })
        .eq('id', product_log_id)
        .eq('user_id', authedUserId ?? '');

      // Auto-save to dispensaries list if a name was given
      if (trimmed && authedUserId) {
        await supabase
          .from('dispensaries')
          .upsert({ name: trimmed, user_id: authedUserId }, { onConflict: 'user_id,name', ignoreDuplicates: true });
      }
    }

    re