import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const logId = formData.get('log_id') as string | null;

    if (!file) return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    if (!logId) return NextResponse.json({ error: 'log_id required.' }, { status: 400 });

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${user.id}/${logId}.${ext}`;

    const db = createServerSupabaseClient();

    // Upload to Supabase Storage (upsert so replace works)
    const { error: uploadError } = await db.storage
      .from('headshots')
      .upload(path, buffer, {
        contentType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        upsert: true,
      });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // Get public URL
    const { data: { publicUrl } } = db.storage.from('headshots').getPublicUrl(path);

    // Save URL to product_log
    const { error: updateError } = await db
      .from('product_logs')
      .update({ headshot_url: publicUrl })
      .eq('id', logId)
      .eq('user_id', user.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('log_id');
    if (!logId) return NextResponse.json({ error: 'log_id required.' }, { status: 400 });

    const db = createServerSupabaseClient();

    // Remove from storage (try both extensions)
    await db.storage.from('headshots').remove([`${user.id}/${logId}.jpg`, `${user.id}/${logId}.png`]);

    // Clear URL from log
    await db.from('product_logs').update({ headshot_url: null }).eq('id', logId).eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}