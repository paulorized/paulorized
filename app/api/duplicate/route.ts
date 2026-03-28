import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { product_log_id, product } = body;

    const db = createServerSupabaseClient();
    let insertData: Record<string, unknown>;
    let sourceReview: Record<string, unknown> | null = null;

    if (product_log_id) {
      // Duplicate from existing log entry
      const { data: source, error: fetchErr } = await db
        .from('product_logs')
        .select('*')
        .eq('id', product_log_id)
        .eq('user_id', user.id)
        .single();
      if (fetchErr || !source) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
      const { id, created_at, ...rest } = source;
      void id; void created_at;
      insertData = { ...rest, user_id: user.id };

      // Fetch the review to copy (minus notes)
      const { data: rev } = await db
        .from('reviews')
        .select('*')
        .eq('product_log_id', product_log_id)
        .single();
      if (rev) sourceReview = rev;
    } else if (product) {
      // Duplicate from top-scans (no existing log id, no review to copy)
      insertData = { ...product, user_id: user.id };
    } else {
      return NextResponse.json({ error: 'product_log_id or product required' }, { status: 400 });
    }

    // Create the new log entry
    const { data: newLog, error: insertErr } = await db
      .from('product_logs')
      .insert(insertData)
      .select('id')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    // Copy review without notes
    if (sourceReview) {
      const { id: _rid, created_at: _rca, updated_at: _rua, product_log_id: _rpli, notes: _notes, ...reviewRest } = sourceReview as Record<string, unknown>;
      void _rid; void _rca; void _rua; void _rpli; void _notes;
      await db.from('reviews').insert({
        ...reviewRest,
        product_log_id: newLog.id,
        user_id: user.id,
        notes: '',
      });
    }

    return NextResponse.json({ success: true, id: newLog.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}