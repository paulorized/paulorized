import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

interface LeaflyHit {
  name: string;
  strain_slug: string;
  category?: string;
  strain_playlist_details?: {
    thc_min?: number;
    thc_max?: number;
  };
}

async function leaflySearch(query: string): Promise<LeaflyHit[]> {
  // Use Leafly's name search — searches across strain names, not just exact slug
  const q = query.toLowerCase().trim();
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=&page=0&take=10&strain_slug_contains=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: LEAFLY_HEADERS,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const hits: LeaflyHit[] = data?.data?.strains ?? [];
    // Filter client-side to only strains whose name contains the query
    return hits.filter(h => h.name.toLowerCase().includes(q));
  } catch { return []; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;
    if (!query?.trim() || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const q = query.trim();

    // Run Leafly search + community DB search in parallel
    const [leaflyHits, dbHits] = await Promise.all([
      leaflySearch(q),
      (async () => {
        try {
          const db = createServerSupabaseClient();
          const { data } = await db
            .from('product_logs')
            .select('strain_name, strain_type, thc_percent')
            .ilike('strain_name', `%${q}%`)
            .not('strain_name', 'is', null)
            .limit(30);
          return data ?? [];
        } catch { return []; }
      })(),
    ]);

    // Build a merged, deduplicated suggestion list
    // Key by lowercase strain name
    const seen = new Map<string, {
      strain_name: string;
      strain_type: string | null;
      thc_min: number | null;
      thc_max: number | null;
      source: 'leafly' | 'community';
      count: number;
    }>();

    // Leafly results first — these are authoritative
    for (const hit of leaflyHits) {
      const key = hit.name.toLowerCase().trim();
      seen.set(key, {
        strain_name: hit.name,
        strain_type: (hit.category ?? 'unknown').toLowerCase(),
        thc_min: hit.strain_playlist_details?.thc_min ?? null,
        thc_max: hit.strain_playlist_details?.thc_max ?? null,
        source: 'leafly',
        count: 0,
      });
    }

    // Community results — boost count, fill gaps where Leafly has nothing
    for (const row of dbHits) {
      const key = (row.strain_name ?? '').toLowerCase().trim();
      if (!key) continue;
      if (seen.has(key)) {
        seen.get(key)!.count++;
      } else {
        // Strain in community but not on Leafly — add it
        const existing = seen.get(key);
        if (existing) {
          existing.count++;
        } else {
          seen.set(key, {
            strain_name: row.strain_name,
            strain_type: row.strain_type ?? null,
            thc_min: row.thc_percent ?? null,
            thc_max: row.thc_percent ?? null,
            source: 'community',
            count: 1,
          });
        }
      }
    }

    // Sort: Leafly hits first (authoritative), then by community count
    const suggestions = Array.from(seen.values())
      .sort((a, b) => {
        if (a.source === 'leafly' && b.source !== 'leafly') return -1;
        if (b.source === 'leafly' && a.source !== 'leafly') return 1;
        return b.count - a.count;
      })
      .slice(0, 10);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
