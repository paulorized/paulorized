import { NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServerSupabaseClient();

    const { data: logs } = await db
      .from('product_logs')
      .select('id, brand, product_type, strain_type, strain_name, thc_percent, cbd_percent, dispensary_name, created_at, weight')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const { data: reviews } = await db
      .from('reviews')
      .select('rating, would_buy_again, effects, flavors, created_at, edible_dose_mg, edible_effect_type, edible_feelings')
      .eq('user_id', user.id);

    const totalScans = logs?.length ?? 0;
    const totalReviews = reviews?.length ?? 0;

    const thcValues = (logs ?? []).map(l => l.thc_percent).filter(v => v != null) as number[];
    const avgThc = thcValues.length > 0 ? thcValues.reduce((a, b) => a + b, 0) / thcValues.length : null;

    const ratingValues = (reviews ?? []).map(r => r.rating).filter(v => v != null) as number[];
    const avgRating = ratingValues.length > 0 ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : null;

    const wbaValues = (reviews ?? []).filter(r => r.would_buy_again != null);
    const wbaPct = wbaValues.length > 0
      ? Math.round((wbaValues.filter(r => r.would_buy_again).length / wbaValues.length) * 100)
      : null;

    const strainTypeCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      const t = log.strain_type?.toLowerCase() ?? 'unknown';
      strainTypeCounts[t] = (strainTypeCounts[t] ?? 0) + 1;
    }

    const productTypeCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      const t = log.product_type?.toLowerCase() ?? 'unknown';
      productTypeCounts[t] = (productTypeCounts[t] ?? 0) + 1;
    }

    const brandCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      if (log.brand) brandCounts[log.brand] = (brandCounts[log.brand] ?? 0) + 1;
    }
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const dispCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      if (log.dispensary_name) dispCounts[log.dispensary_name] = (dispCounts[log.dispensary_name] ?? 0) + 1;
    }
    const topDispensaries = Object.entries(dispCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const effectCounts: Record<string, number> = {};
    for (const review of reviews ?? []) {
      for (const e of review.effects ?? []) effectCounts[e] = (effectCounts[e] ?? 0) + 1;
    }
    const topEffects = Object.entries(effectCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const flavorCounts: Record<string, number> = {};
    for (const review of reviews ?? []) {
      for (const f of review.flavors ?? []) flavorCounts[f] = (flavorCounts[f] ?? 0) + 1;
    }
    const topFlavors = Object.entries(flavorCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const thcBuckets: Record<string, number> = {
      '0-10%': 0, '11-15%': 0, '16-20%': 0, '21-25%': 0, '26-30%': 0, '30%+': 0,
    };
    for (const v of thcValues) {
      if (v <= 10) thcBuckets['0-10%']++;
      else if (v <= 15) thcBuckets['11-15%']++;
      else if (v <= 20) thcBuckets['16-20%']++;
      else if (v <= 25) thcBuckets['21-25%']++;
      else if (v <= 30) thcBuckets['26-30%']++;
      else thcBuckets['30%+']++;
    }

    const monthCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      const month = log.created_at.slice(0, 7);
      monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    }
    const scansOverTime = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    const strainCounts: Record<string, number> = {};
    for (const log of logs ?? []) {
      if (log.strain_name) strainCounts[log.strain_name] = (strainCounts[log.strain_name] ?? 0) + 1;
    }
    const topStrains = Object.entries(strainCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Parse and sum all weights (handles "3.5g", "1oz", "1g", "28g", etc.)
    let totalGrams = 0;
    for (const log of logs ?? []) {
      const w = (log.weight ?? '').toString().toLowerCase().trim();
      if (!w) continue;
      const ozMatch = w.match(/([\d.]+)\s*oz/);
      const gMatch = w.match(/([\d.]+)\s*g/);
      if (ozMatch) totalGrams += parseFloat(ozMatch[1]) * 28.3495;
      else if (gMatch) totalGrams += parseFloat(gMatch[1]);
    }
    totalGrams = Math.round(totalGrams * 10) / 10;

    return NextResponse.json({
      totalScans, totalReviews, totalGrams,
      avgThc: avgThc != null ? Math.round(avgThc * 10) / 10 : null,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      wbaPct,
      strainTypeCounts, productTypeCounts,
      topBrands, topDispensaries, topEffects, topFlavors,
      thcDistribution: Object.entries(thcBuckets).map(([range, count]) => ({ range, count })),
      scansOverTime, topStrains,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
