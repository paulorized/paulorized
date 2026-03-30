import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

export async function DELETE() {
  try {
    const auth = await createAuthServerClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerSupabaseClient();

    // Delete user data in order (reviews → product_logs → profile)
    await supabase.from('reviews').delete().eq('user_id', user.id);
    await supabase.from('product_logs').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    // Delete the auth user via admin client
    const adminSupabase = createServerSupabaseClient();
    await adminSupabase.auth.admin.deleteUser(user.id);

    const response = NextResponse.json({ success: true });
    // Expire all auth cookies
    response.cookies.getAll?.()?.forEach?.((c) => {
      if (c.name.startsWith('sb-')) response.cookies.set(c.name, '', { maxAge: 0, path: '/' });
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
