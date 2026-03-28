import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ matches: [] });

    const body = await request.json();
    const { strain_name } = body;
    if (!strain_name) return NextResponse.json({ matches: [] });

    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from('product_logs')
      .select('id, brand, strain_name, product_type, strain_type, thc_percent, thc_mg, created_at')
      .eq('user_id', user.id)
      .ilike('strain_name', `%${strain_name.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ matches: [] });

    return NextResponse.json({ matches: data ?? [] });
  } catch {
    return NextResponse.json({ matches: [] });
  }
}