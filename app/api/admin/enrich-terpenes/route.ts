import { NextResponse } from 'next/server';
import { claude } from '@/lib/claude';
import { createServerSupabaseClient } from '@/lib/supabase.server';

// Allow up to 5 minutes — this batch-processes all historical logs
export const maxDuration = 300;

// Minimal prompt — only asks for terpenes to keep tokens low and responses fast
const TERPENE_PROMPT = `You are a cannabis strain expert. Given a strain name, return ONLY the terpene profile in valid JSON.

Return ONLY this JSON object — no markdown, no explanation:
{ "terpenes": [{ "name": "string", "percent": null, "source": "ai_estimated" }] }

List the 2-4 most characteristic terpenes for the strain.
Common terpenes: Myrcene, Limonene, Caryophyllene, Linalool, Pinene, Terpinolene, Ocimene, Humulene, Bisabolol, Nerolidol
If the strain name is too vague or clearly a made-up/unknown name, still guess plausible terpenes based on flavour profile implied by the name.`;

async function getTerpenesForStrain(strainName: string): Promise<{ name: string; percent: null; source: string }[]> {
  try {
    const msg = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: `${TERPENE_PROMPT}\n\nStrain: ${strainName.trim()}` }],
    });
    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const data = JSON.parse(cleaned);
    return Array.isArray(data.terpenes) ? data.terpenes : [];
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // Fetch all rows with missing terpenes and a known strain name
    const { data: rows, error } = await supabase
      .from('product_logs')
      .select('id, strain_name')
      .is('terpenes', null)
      .not('strain_name', 'is', null)
      .neq('strain_name', '');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ message: 'Nothing to enrich — all logs already have terpenes.' });

    // Deduplicate strain names (trim whitespace)
    const uniqueStrains = [...new Set(rows.map(r => r.strain_name.trim()))].filter(Boolean);

    // Build a terpene map: strain name → terpenes[]
    // Process in batches of 5 concurrent Claude calls to avoid rate limits
    const terpeneMap = new Map<string, { name: string; percent: null; source: string }[]>();
    const BATCH = 5;

    for (let i = 0; i < uniqueStrains.length; i += BATCH) {
      const batch = uniqueStrains.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(strain => getTerpenesForStrain(strain).then(t => ({ strain, terpenes: t })))
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.terpenes.length > 0) {
          terpeneMap.set(result.value.strain, result.value.terpenes);
        }
      }
    }

    // Update every row using its strain's terpene data
    let updated = 0;
    let skipped = 0;
    for (const row of rows) {
      const terpenes = terpeneMap.get(row.strain_name.trim());
      if (terpenes && terpenes.length > 0) {
        const { error: updateError } = await supabase
          .from('product_logs')
          .update({ terpenes })
          .eq('id', row.id);
        if (!updateError) updated++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      uniqueStrains: uniqueStrains.length,
      strainsEnriched: terpeneMap.size,
      rowsUpdated: updated,
      rowsSkipped: skipped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
