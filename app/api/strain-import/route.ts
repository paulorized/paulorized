import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

// Protected one-time import route — requires secret key
// Call with: POST /api/strain-import { "secret": "...", "page": 0, "take": 100 }

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, page = 0, take = 100 } = body;

    // Simple secret guard — set STRAIN_IMPORT_SECRET in Vercel env
    if (secret !== process.env.STRAIN_IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=&page=${page}&take=${take}`;
    const res = await fetch(url, { headers: LEAFLY_HEADERS });
    if (!res.ok) {
      return NextResponse.json({ error: `Leafly returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const strains = data?.data?.strains ?? [];

    if (strains.length === 0) {
      return NextResponse.json({ imported: 0, done: true });
    }

    const db = createServerSupabaseClient();

    const rows = strains.map((s: {
      strain_slug: string;
      name: string;
      category?: string;
      nugshot?: { url: string };
      strain_playlist_details?: {
        thc_min?: number;
        thc_max?: number;
        cbd_min?: number;
        cbd_max?: number;
        description?: string;
        top_reported_effects?: string[];
        top_reported_flavors?: string[];
      };
    }) => {
      const d = s.strain_playlist_details ?? {};
      const type = (s.category ?? 'unknown').toLowerCase();
      return {
        slug: s.strain_slug,
        name: s.name,
        strain_type: ['indica', 'sativa', 'hybrid'].includes(type) ? type : 'unknown',
        thc_min: d.thc_min ?? null,
        thc_max: d.thc_max ?? null,
        cbd_min: d.cbd_min ?? null,
        cbd_max: d.cbd_max ?? null,
        strain_bio: d.description ?? null,
        typical_effects: d.top_reported_effects ?? [],
        typical_flavors: d.top_reported_flavors ?? [],
        nugshot_url: s.nugshot?.url ?? null,
        leafly_url: `https://www.leafly.com/strains/${s.strain_slug}`,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await db
      .from('strains')
      .upsert(rows, { onConflict: 'slug' });

    if (error) throw error;

    return NextResponse.json({
      imported: rows.length,
      page,
      done: rows.length < take,
      next_page: rows.length < take ? null : page + 1,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
