import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

// Search your strains index — returns paginated results
// Falls back to live Leafly if index is empty

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

async function leaflySearch(query: string, page: number, take: number) {
  const slug = query.toLowerCase().replace(/\s+/g, '-');
  // Try both slug-contains and direct slug search
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=&page=${page}&take=${take}&strain_slug_contains=${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = data?.data?.strains ?? [];
    return hits.filter((h: { name: string }) =>
      h.name.toLowerCase().includes(query.toLowerCase())
    );
  } catch { return []; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 0, take = 20 } = body;

    if (!query?.trim() || query.trim().length < 1) {
      return NextResponse.json({ results: [], total: 0, page, has_more: false });
    }

    const q = query.trim();
    const db = createServerSupabaseClient();

    // Check if we have strains indexed
    const { count } = await db
      .from('strains')
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      // Search our own index using trigram similarity
      const from = page * take;
      const { data, error, count: total } = await db
        .from('strains')
        .select('slug, name, strain_type, thc_min, thc_max, nugshot_url', { count: 'exact' })
        .ilike('name', `%${q}%`)
        .order('name')
        .range(from, from + take - 1);

      if (error) throw error;

      return NextResponse.json({
        results: data ?? [],
        total: total ?? 0,
        page,
        has_more: (total ?? 0) > from + take,
        source: 'index',
      });
    }

    // Fallback: live Leafly search (before index is seeded)
    const hits = await leaflySearch(q, page, take);
    const results = hits.map((s: {
      strain_slug: string;
      name: string;
      category?: string;
      nugshot?: { url: string };
      strain_playlist_details?: { thc_min?: number; thc_max?: number };
    }) => ({
      slug: s.strain_slug,
      name: s.name,
      strain_type: (s.category ?? 'unknown').toLowerCase(),
      thc_min: s.strain_playlist_details?.thc_min ?? null,
      thc_max: s.strain_playlist_details?.thc_max ?? null,
      nugshot_url: s.nugshot?.url ?? null,
    }));

    return NextResponse.json({
      results,
      total: results.length,
      page,
      has_more: results.length === take,
      source: 'leafly',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
