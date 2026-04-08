import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export const maxDuration = 30;

// Call remove.bg using raw multipart body — avoids Node.js FormData/Blob compat issues
async function removeBackground(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`;

  // Build multipart body manually
  const parts: Buffer[] = [];

  // image_file part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image_file"; filename="image"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  ));
  parts.push(imageBuffer);
  parts.push(Buffer.from('\r\n'));

  // size part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="size"\r\n\r\nauto\r\n`
  ));

  // type part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="type"\r\n\r\nother\r\n`
  ));

  // type_level part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="type_level"\r\n\r\n2\r\n`
  ));

  // bg_color part — composite on black, returns flat JPEG
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="bg_color"\r\n\r\n000000\r\n`
  ));

  // format part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="format"\r\n\r\njpg\r\n`
  ));

  // closing boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(body.length),
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`remove.bg ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

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

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    let finalBuffer: Buffer;
    let finalContentType: string;
    let finalExt: string;
    let bgRemoved = false;

    if (process.env.REMOVE_BG_API_KEY) {
      try {
        finalBuffer = await removeBackground(rawBuffer, file.type);
        finalContentType = 'image/jpeg';
        finalExt = 'jpg';
        bgRemoved = true;
      } catch (bgErr) {
        console.error('remove.bg failed:', bgErr);
        // Fall back to original but include the error in response header for debugging
        finalBuffer = rawBuffer;
        finalContentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        finalExt = file.type === 'image/png' ? 'png' : 'jpg';
      }
    } else {
      finalBuffer = rawBuffer;
      finalContentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      finalExt = file.type === 'image/png' ? 'png' : 'jpg';
    }

    const path = `${user.id}/${logId}.${finalExt}`;
    const db = createServerSupabaseClient();

    // Remove any old version before uploading
    await db.storage.from('headshots').remove([
      `${user.id}/${logId}.jpg`,
      `${user.id}/${logId}.png`,
    ]);

    const { error: uploadError } = await db.storage
      .from('headshots')
      .upload(path, finalBuffer, { contentType: finalContentType, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = db.storage.from('headshots').getPublicUrl(path);

    const { error: updateError } = await db
      .from('product_logs')
      .update({ headshot_url: publicUrl })
      .eq('id', logId)
      .eq('user_id', user.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ url: publicUrl, bg_removed: bgRemoved });
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
    await db.storage.from('headshots').remove([`${user.id}/${logId}.jpg`, `${user.id}/${logId}.png`]);
    await db.from('product_logs').update({ headshot_url: null }).eq('id', logId).eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
