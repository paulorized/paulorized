import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAuthServerClient } from '@/lib/supabase.server';
import { claude } from '@/lib/claude';

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

async function fetchLeaflyBio(strainName: string): Promise<string | null> {
  const slug = strainName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=${encodeURIComponent(slug)}&page=0&take=1`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const strain = data?.data?.strains?.[0];
    const description = strain?.strain_playlist_details?.description;
    return description && typeof description === 'string' ? description : null;
  } catch { return null; }
}

const CLAUDE_BIO_PROMPT = `You are a cannabis strain database. Given a strain name, return a detailed 2-4 sentence bio describing its lineage, typical effects, aroma, and notable characteristics. Return ONLY the bio text — no JSON, no markdown, no quotes. If you have no reliable info on the strain, return exactly the text: UNKNOWN`;

async function fetchClaudeBio(strainName: string): Promise<string | null> {
  try {
    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: `${CLAUDE_BIO_PROMPT}\n\nStrain: ${strainName.trim()}` }],
    });
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    if (!raw || raw === 'UNKNOWN') return null;
    return raw;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authClient = await createAuthServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const body = await request.json();
    const { product_log_id } = body;
    if (!product_log_id) {
      return NextResponse.json({ error: 'product_log_id is required.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify ownership and get strain name
    const { data: log, error: fetchErr } = await supabase
      .from('product_logs')
      .select('id, user_id, strain_name')
      .eq('id', product_log_id)
      .maybeSingle();

    if (fetchErr || !log) {
      return NextResponse.json({ error: 'Log not found.' }, { status: 404 });
    }
    if (log.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }
    if (!log.strain_name) {
      return NextResponse.json({ error: 'This log has no strain name to look up.' }, { status: 400 });
    }

    // Try Leafly first, fall back to Claude
    let newBio = await fetchLeaflyBio(log.strain_name);
    let source: 'leafly' | 'ai' | null = newBio ? 'leafly' : null;
    if (!newBio) {
      newBio = await fetchClaudeBio(log.strain_name);
      source = newBio ? 'ai' : null;
    }

    if (!newBio) {
      return NextResponse.json({ error: 'Could not find a bio for this strain.' }, { status: 404 });
    }

    // Update the log
    const { error: updateErr } = await supabase
      .from('product_logs')
      .update({ strain_bio: newBio })
      .eq('id', product_log_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ strain_bio: newBio, source });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
