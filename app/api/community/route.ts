import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const db = createServerSupabaseClient();

    const [logsRes, reviewsRes] = await Promise.all([
      db.from('product_logs')
        .select('user_id, brand, product_type, strain_name, strain_type, thc_percent, weight, dispensary_name')
        .limit(2000),
      db.from('reviews')
        .select('effects, flavors')
        .limit(2000),
    ]);

    const logs = logsRes.data ?? [];
    const reviews = reviewsRes.data ?? [];

    const countBy = (arr: Record<string, unknown>[], key: string) => {
      const map = new Map<string, number>();
      for (const row of arr) {
        const val = row[key];
        if (!val || typeof val !== 'string') continue;
        const norm = val.toLowerCase().trim();
        if (norm) map.set(norm, (map.get(norm) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const countArray = (arr: Record<string, unknown>[], key: string) => {
      const map = new Map<string, number>();
      for (const row of arr) {
        const items = row[key];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (typeof item === 'string' && item.trim()) {
            map.set(item.trim(), (map.get(item.trim()) ?? 0) + 1);
          }
        }
      }
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const strainTypeCounts: Record<string, number> = { sativa: 0, indica: 0, hybrid: 0, unknown: 0 };
    for (const row of logs) {
      const t = ((row.strain_type ?? 'unknown') as string).toLowerCase();
      const key = ['sativa', 'indica', 'hybrid'].includes(t) ? t : 'unknown';
      strainTypeCounts[key]++;
    }

    const thcValues = logs
      .map(r => r.thc_percent)
      .filter((v): v is number => v != null && (v as number) > 0);
    const avgThc = thcValues.length > 0
      ? Math.round((thcValues.reduce((a, b) => a + b, 0) / thcValues.length) * 10) / 10
      : null;

    // Sum all weights across all users — same parser as personal dashboard
    let totalGrams = 0;
    for (const log of logs) {
      const w = ((log.weight ?? '') as string).toString().toLowerCase().trim();
      if (!w) continue;
      const ozMatch = w.match(/([\d.]+)\s*oz/);
      const gMatch = w.match(/([\d.]+)\s*g/);
      const bareMatch = w.match(/^([\d.]+)$/);
      if (ozMatch) totalGrams += parseFloat(ozMatch[1]) * 28.3495;
      else if (gMatch) totalGrams += parseFloat(gMatch[1]);
      else if (bareMatch) totalGrams += parseFloat(bareMatch[1]);
    }
    totalGrams = Math.round(totalGrams * 10) / 10;

    return NextResponse.json({
      totalScans: logs.length,
      totalUsers: new Set(logs.map(l => l.user_id)).size,
      totalGrams,
      avgThc,
      strainTypeCounts,
      topStrains: countBy(logs as Record<string, unknown>[], 'strain_name').slice(0, 10),
      topBrands: countBy(logs as Record<string, unknown>[], 'brand').slice(0, 10),
      topProductTypes: countBy(logs as Record<string, unknown>[], 'product_type').slice(0, 8),
      topDispensaries: countBy(logs as Record<string, unknown>[], 'dispensary_name').slice(0, 8),
      topEffects: countArray(reviews as Record<string, unknown>[], 'effects').slice(0, 10),
      topFlavors: countArray(reviews as Record<string, unknown>[], 'flavors').slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
