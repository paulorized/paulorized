import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

// GET — fetch dispensaries for the current user
export async function GET() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const userId = user?.id ?? null;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('dispensaries')
    .select('id, name')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dispensaries: data ?? [] });
}

// DELETE — remove a dispensary from the user's saved list
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('dispensaries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// POST — save a new dispensary name if it doesn't already exist
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    const userId = user?.id ?? null;

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('dispensaries')
      .upsert({ name: name.trim(), user_id: userId }, { onConflict: 'user_id,name', ignoreDuplicates: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
