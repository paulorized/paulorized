import { NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServerSupabaseClient();

    // Get all user logs
    const { data: logs } = await db
      .from('product_logs')
      .select('strain_type, thc_percent, brand, strain_name, product_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const all = logs ?? [];
    const total = all.length;

    // Scans this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = all.filter(l => new Date(l.created_at) > weekAgo).length;

    // Type breakdown
    const typeCounts: Record<string, number> = { indica: 0, sativa: 0, hybrid: 0 };
    for (const l of all) {
      const t = (l.strain_type ?? '').toLowerCase();
      if (t in typeCounts) typeCounts[t]++;
    }

    // Top strain type
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Highest THC scanned
    const maxThc = all.reduce((max, l) => Math.max(max, l.thc_percent ?? 0), 0);

    // Unique strains
    const uniqueStrains = new Set(all.map(l => (l.strain_name ?? '').toLowerCase()).filter(Boolean)).size;

    // Most scanned brand
    const brandCounts: Record<string, number> = {};
    for (const l of all) {
      if (l.brand) brandCounts[l.brand] = (brandCounts[l.brand] ?? 0) + 1;
    }
    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return NextResponse.json({
      total,
      thisWeek,
      uniqueStrains,
      topType,
      maxThc: maxThc > 0 ? maxThc : null,
      topBrand,
      typeCounts,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
