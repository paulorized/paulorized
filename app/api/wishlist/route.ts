import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

async function getUserId() {
  const authClient = await createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user?.id ?? null;
}

// GET /api/wishlist — return all wishlist items for current user
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('wishlist')
    .select('id, strain_name, strain_type, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// POST /api/wishlist — add a strain to wishlist
export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { strain_name, strain_type } = await request.json();
  if (!strain_name?.trim()) return NextResponse.json({ error: 'strain_name required' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('wishlist')
    .upsert({ user_id: userId, strain_name: strain_name.trim(), strain_type: strain_type ?? null }, { onConflict: 'user_id,strain_name' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/wishlist — remove a strain from wishlist
export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { strain_name } = await request.json();
  if (!strain_name?.trim()) return NextResponse.json({ error: 'strain_name required' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('strain_name', strain_name.trim());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
