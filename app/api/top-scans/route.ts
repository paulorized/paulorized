import { NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServerSupabaseClient();
    const { data, error } = await db
      .from('product_logs')
      .select('brand, product_type, strain_name, strain_type, thc_percent, cbd_percent, thc_mg, cbd_mg, mg_per_piece, weight, dispensary_name, strain_bio')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Count by fingerprint (brand + strain_name + product_type)
    const counts = new Map<string, { count: number; product: typeof data[0] }>();
    for (const row of (data ?? [])) {
      const key = `${(row.brand ?? '').toLowerCase()}__${(row.strain_name ?? '').toLowerCase()}__${(row.product_type ?? '').toLowerCase()}`;
      if (counts.has(key)) {
        counts.get(key)!.count++;
      } else {
        counts.set(key, { count: 1, product: row });
      }
    }

    // Sort by count desc. If the most recent scan is a brand new item (count=1),
    // exclude it so it doesn't immediately hijack the list — unless everything is count=1.
    const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const mostRecentKey = data && data[0]
      ? `${(data[0].brand ?? '').toLowerCase()}__${(data[0].strain_name ?? '').toLowerCase()}__${(data[0].product_type ?? '').toLowerCase()}`
      : null;
    const allSingleScans = sorted.every(v => v.count === 1);
    const filtered = (!allSingleScans && mostRecentKey && counts.get(mostRecentKey)?.count === 1)
      ? sorted.filter(v => {
          const k = `${(v.product.brand ?? '').toLowerCase()}__${(v.product.strain_name ?? '').toLowerCase()}__${(v.product.product_type ?? '').toLowerCase()}`;
          return k !== mostRecentKey;
        })
      : sorted;

    const top5 = filtered
      .slice(0, 5)
      .map(({ count, product }) => ({ count, ...product }));

    return NextResponse.json({ top5 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}