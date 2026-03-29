import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;
    if (!query?.trim() || query.trim().length < 2) return NextResponse.json({ suggestions: [] });

    const db = createServerSupabaseClient();

    // Search community-wide product_logs for partial strain name matches
    const { data, error } = await db
      .from('product_logs')
      .select('strain_name, strain_type, thc_percent, brand, product_type')
      .ilike('strain_name', `%${query.trim()}%`)
      .not('strain_name', 'is', null)
      .order('strain_name')
      .limit(50);

    if (error) return NextResponse.json({ suggestions: [] });

    // Deduplicate by canonical strain_name (case-insensitive)
    const seen = new Map<string, { strain_name: string; strain_type: string | null; thc_min: number | null; thc_max: number | null; count: number }>();
    for (const row of data ?? []) {
      const key = (row.strain_name ?? '').toLowerCase().trim();
      if (!key) continue;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        existing.count++;
        // Track THC range
        if (row.thc_percent != null) {
          if (existing.thc_min === null || row.thc_percent < existing.thc_min) existing.thc_min = row.thc_percent;
          if (existing.thc_max === null || row.thc_percent > existing.thc_max) existing.thc_max = row.thc_percent;
        }
      } else {
        seen.set(key, {
          strain_name: row.strain_name,
          strain_type: row.strain_type ?? null,
          thc_min: row.thc_percent ?? null,
          thc_max: row.thc_percent ?? null,
          count: 1,
        });
      }
    }

    // Sort by count desc, return top 8
    const suggestions = Array.from(seen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
