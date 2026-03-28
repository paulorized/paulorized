import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const db = createServerSupabaseClient();

    const { data: logs } = await db
      .from('product_logs')
      .select('brand, product_type, strain_name, strain_type, thc_percent, thc_mg, effects, flavors')
      .limit(2000);

    const rows = logs ?? [];
    const total = rows.length;

    // Count helpers
    const countBy = (key: string) => {
      const map = new Map<string, number>();
      for (const row of rows) {
        const val = (row as Record<string, unknown>)[key];
        if (!val || typeof val !== 'string') continue;
        const norm = val.toLowerCase().trim();
        if (norm) map.set(norm, (map.get(norm) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const countArray = (key: string) => {
      const map = new Map<string, number>();
      for (const row of rows) {
        const arr = (row as Record<string, unknown>)[key];
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          if (typeof item === 'string' && item.trim()) {
            const norm = item.trim();
            map.set(norm, (map.get(norm) ?? 0) + 1);
          }
        }
      }
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    // Strain type breakdown
    const strainTypeCounts: Record<string, number> = { sativa: 0, indica: 0, hybrid: 0, unknown: 0 };
    for (const row of rows) {
      const t = ((row.strain_type ?? 'unknown') as string).toLowerCase();
      const key = ['sativa','indica','hybrid'].includes(t) ? t : 'unknown';
      strainTypeCounts[key]++;
    }

    // Average THC
    const thcValues = rows
      .map(r => r.thc_percent ?? (r.thc_mg ? null : null))
      .filter((v): v is number => v != null && v > 0);
    const avgThc = thcValues.length > 0 ? Math.round((thcValues.reduce((a, b) => a + b, 0) / thcValues.length) * 10) / 10 : null;

    return NextResponse.json({
      totalScans: total,
      avgThc,
      strainTypeCounts,
      topStrains: countBy('strain_name').slice(0, 10),
      topBrands: countBy('brand').slice(0, 10),
      topProductTypes: countBy('product_type').slice(0, 8),
      topEffects: countArray('effects').slice(0, 10),
      topFlavors: countArray('flavors').slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}