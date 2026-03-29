import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.leafly.com/',
  'Origin': 'https://www.leafly.com',
};

async function fetchLeaflyStrain(slug: string) {
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=${encodeURIComponent(slug)}&page=0&take=1`;
  const res = await fetch(url, { headers: LEAFLY_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.strains?.[0] ?? null;
}

async function fetchLeaflyPage(page: number, take: number) {
  // Use the search endpoint that powers Leafly's /strains page
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=&page=${page}&take=${take}&strain_slug_starts_with=`;
  const res = await fetch(url, { headers: LEAFLY_HEADERS });
  if (res.ok) {
    const data = await res.json();
    const strains = data?.data?.strains ?? [];
    if (strains.length > 0) return { strains, source: 'playlist' };
  }

  // Fallback: use the search/filter endpoint
  const url2 = `https://consumer-api.leafly.com/api/strain_playlists/v2?page=${page}&take=${take}`;
  const res2 = await fetch(url2, { headers: LEAFLY_HEADERS });
  if (res2.ok) {
    const data2 = await res2.json();
    return { strains: data2?.data?.strains ?? [], source: 'basic' };
  }

  return { strains: [], source: 'failed', status: res.status };
}

// Mode: 'page' = page through Leafly bulk, 'slugs' = import specific slugs, 'community' = import from your logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, mode = 'page', page = 0, take = 100, slugs } = body;

    if (secret !== process.env.STRAIN_IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServerSupabaseClient();

    // Mode: import specific slugs (most reliable since single lookups work)
    if (mode === 'slugs' && Array.isArray(slugs)) {
      let imported = 0;
      const errors: string[] = [];

      for (const slug of slugs) {
        try {
          const s = await fetchLeaflyStrain(slug);
          if (!s) { errors.push(slug); continue; }
          const d = s.strain_playlist_details ?? {};
          const type = (s.category ?? 'unknown').toLowerCase();
          await db.from('strains').upsert({
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
          }, { onConflict: 'slug' });
          imported++;
        } catch { errors.push(slug); }
      }

      return NextResponse.json({ imported, errors, done: true });
    }

    // Mode: seed from your community logs (strains your users have already scanned)
    if (mode === 'community') {
      const { data: logs } = await db
        .from('product_logs')
        .select('strain_name')
        .not('strain_name', 'is', null)
        .not('strain_name', 'eq', '');

      const uniqueSlugs = [...new Set(
        (logs ?? [])
          .map((l: { strain_name: string }) => l.strain_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
          .filter(Boolean)
      )];

      let imported = 0;
      for (const slug of uniqueSlugs) {
        try {
          const s = await fetchLeaflyStrain(slug);
          if (!s) continue;
          const d = s.strain_playlist_details ?? {};
          const type = (s.category ?? 'unknown').toLowerCase();
          await db.from('strains').upsert({
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
          }, { onConflict: 'slug' });
          imported++;
        } catch {}
      }

      return NextResponse.json({ imported, total_community: uniqueSlugs.length, done: true });
    }

    // Mode: page (bulk listing)
    const { strains, source, status } = await fetchLeaflyPage(page, take) as {
      strains: Array<{
        strain_slug: string;
        name: string;
        category?: string;
        nugshot?: { url: string };
        strain_playlist_details?: {
          thc_min?: number; thc_max?: number;
          cbd_min?: number; cbd_max?: number;
          description?: string;
          top_reported_effects?: string[];
          top_reported_flavors?: string[];
        };
      }>;
      source: string;
      status?: number;
    };

    if (strains.length === 0) {
      return NextResponse.json({ imported: 0, done: true, source, status });
    }

    const rows = strains.map(s => {
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

    const { error } = await db.from('strains').upsert(rows, { onConflict: 'slug' });
    if (error) throw error;

    return NextResponse.json({
      imported: rows.length,
      page,
      source,
      done: rows.length < take,
      next_page: rows.length < take ? null : page + 1,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
