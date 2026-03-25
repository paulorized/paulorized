import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET — fetch all dispensaries (for dropdown)
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('dispensaries')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dispensaries: data ?? [] });
}

// POST — save a new dispensary name if it doesn't already exist
export async function POST(request: NextRequest) {
  try {
    const { name, user_id } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Insert — ignore conflict if already exists for this user
    const { error } = await supabase
      .from('dispensaries')
      .upsert({ name: name.trim(), user_id: user_id || null }, { onConflict: 'user_id,name', ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
