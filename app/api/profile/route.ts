import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';

// GET — fetch current user's profile
export async function GET() {
  try {
    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — create or update profile
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      username: string;
      date_of_birth: string;
      state?: string;
      sex?: string;
    };

    const { username, date_of_birth, state, sex } = body;

    if (!username || !date_of_birth) {
      return NextResponse.json({ error: 'Username and date of birth are required.' }, { status: 400 });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    // Validate age — must be 21+
    const dob = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

    if (age < 21) {
      return NextResponse.json(
        { error: 'You must be 21 or older to use CannaBaseAI.' },
        { status: 400 }
      );
    }

    // Check username uniqueness (excluding current user)
    const supabase = createServerSupabaseClient();
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }

    // Upsert profile
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username,
        date_of_birth,
        state: state ?? null,
        sex: sex ?? null,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
