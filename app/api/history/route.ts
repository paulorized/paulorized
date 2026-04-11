import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('product_logs')
      .select('id, brand, product_type, strain_name, strain_type, strain_bio, thc_percent, cbd_percent, weight, created_at, dispensary_name, headshot_url, terpenes')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
