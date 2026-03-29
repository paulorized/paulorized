import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';
import { claude } from '@/lib/claude';

// Normalize query for cache key: lowercase, trimmed, collapse spaces
function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function askClaude(q: string) {
  // Lean prompt — fewer tokens = faster response
  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Cannabis strain search: "${q}"

Return a JSON array of up to 10 matching real cannabis strains. If the query is a partial name like "diesel" or "gelato", include all strains with that word in the name. Each object:
{"slug":"blue-dream","name":"Blue Dream","strain_type":"hybrid","thc_min":17,"thc_max":24,"typical_effects":["Relaxed","Happy","Creative"],"typical_flavors":["Berry","Sweet","Earthy"]}

JSON array only, no markdown.`
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 0 } = body;

    if (!query?.trim()) {
      return NextResponse.json({ results: [], total: 0, page, has_more: false });
    }

    if (page > 0) {
      return NextResponse.json({ results: [], total: 0, page, has_more: false });
    }

    const q = normalizeQuery(query);
    const db = createServerSupabaseClient();

    // 1. Check cache first
    const { data: cached } = await db
      .from('strain_search_cache')
      .select('results')
      .eq('query', q)
      .single();

    if (cached?.results) {
      const results = cached.results as unknown[];
      return NextResponse.json({
        results,
        total: results.length,
        page: 0,
        has_more: false,
        source: 'cache',
      });
    }

    // 2. Ask Claude (using Haiku — much faster than Sonnet)
    let results: unknown[] = [];
    try {
      results = await askClaude(q);
      if (!Array.isArray(results)) results = [];
    } catch {
      results = [];
    }

    // 3. Cache the result for next time (fire and forget)
    if (results.length > 0) {
      void db.from('strain_search_cache')
        .upsert({ query: q, results: results as never, created_at: new Date().toISOString() });
    }

    return NextResponse.json({
      results,
      total: results.length,
      page: 0,
      has_more: false,
      source: 'ai',
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
