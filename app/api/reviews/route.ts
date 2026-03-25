import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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
    const { product_log_id, user_id, rating, would_buy_again, notes, effects, flavors } = body;

    if (!product_log_id) {
      return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
    }

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
        .update({ rating, would_buy_again, notes, effects, flavors, updated_at: new Date().toISOString() })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('reviews')
        .insert({ product_log_id, user_id: user_id || null, rating, would_buy_again, notes, effects, flavors }));
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
