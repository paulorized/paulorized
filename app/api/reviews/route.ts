import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productLogId = searchParams.get('product_log_id');

  if (!productLogId) {
    return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_log_id', productLogId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data ?? null });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_log_id, user_id, rating, would_buy_again, notes, effects, flavors,
      burn_speed, canoeing, clogging,
      edible_dose_mg, edible_onset, edible_peak_duration, edible_total_duration,
      edible_effect_type, edible_feelings, edible_taste_rating, edible_dose_feedback,
    } = body;

    if (!product_log_id) {
      return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
    }

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

    // Upsert — update if review already exists for this product_log_id
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_log_id', product_log_id)
      .single();

    let error;
    if (existing?.id) {
      ({ error } = await supabase
        .from('reviews')
        .update({ rating, would_buy_again, notes, effects, flavors, burn_speed: burn_speed ?? null, canoeing: canoeing ?? null, clogging: clogging ?? null, ...edibleFields, updated_at: new Date().toISOString() })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('reviews')
        .insert({ product_log_id, user_id: user_id || null, rating, would_buy_again, notes, effects, flavors, burn_speed: burn_speed ?? null, canoeing: canoeing ?? null, clogging: clogging ?? null, ...edibleFields }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
