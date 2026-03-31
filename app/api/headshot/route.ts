import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export const maxDuration = 30; // allow time for remove.bg call

// Call remove.bg to strip background, returns PNG buffer with transparency
async function removeBackground(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
  form.append('image_file', blob, 'image');
  form.append('size', 'auto');
  // Improve edge quality for organic shapes like nugs
  form.append('type', 'other');
  form.append('type_level', '2');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY! },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`remove.bg error ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Composite transparent PNG onto a black background using pure Node (no canvas needed)
// We embed the PNG as-is and let the browser render it on the dark card background,
// but we also boost saturation by applying a slight warm grade via remove.bg's
// bg_color param — this composites directly server-side without sharp/canvas deps.
async function removeBackgroundOnBlack(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
  form.append('image_file', blob, 'image');
  form.append('size', 'auto');
  form.append('type', 'other');
  form.append('type_level', '2');
  // Composite directly onto black — returns a flat JPEG with no transparency needed
  form.append('bg_color', '000000');
  // Request larger output for quality
  form.append('format', 'jpg');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY! },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`remove.bg error ${res.status}: ${err}`);
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

    const rawBuffer = Buffer.from(await file.arrayB