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
    } else if (product) {
      // Duplicate from top-scans (no existing log id)
      insertData = { ...product, user_id: user.id };
    } else {
      return NextResponse.json({ error: 'product_log_id or product required' }, { status: 400 });
    }

    const { data: newLog, error: insertErr } = await db
      .from('product_logs')
      .insert(insertData)
      .select('id')
      .single();

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    return NextResponse.json({ success: true, id: newLog.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}