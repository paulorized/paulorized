import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';
import { claude } from '@/lib/claude';
import Anthropic from '@anthropic-ai/sdk';

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

interface StrainResult {
  slug: string;
  name: string;
  strain_type: 'indica' | 'sativa' | 'hybrid' | 'unknown';
  thc_min: number | null;
  thc_max: number | null;
  typical_effects: string[];
  typical_flavors: string[];
}

function parseResults(text: string): StrainResult[] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Fast path: Claude's own knowledge (Haiku)
async function askClaude(q: string): Promise<{ results: StrainResult[]; confident: boolean }> {
  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Cannabis strain search: "${q}"

Return a JSON array of up to 10 matching real cannabis strains. If you're not confident you know this strain well, still return what you know but set thc_min/thc_max to null.

If the query is a partial name like "diesel" or "gelato", include ALL strains with that word in the name.

Each object MUST have exactly:
{"slug":"blue-dream","name":"Blue Dream","strain_type":"hybrid","thc_min":17,"thc_max":24,"typical_effects":["Relaxed","Happy","Creative"],"typical_flavors":["Berry","Sweet","Earthy"]}

Also add a top-level field: "confident": true/false — true if you know these strains well, false if obscure/uncertain.

Return format: {"confident":true,"results":[...]}

JSON only, no markdown.`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      results: Array.isArray(parsed.results) ? parsed.results : [],
      confident: parsed.confident !== false,
    };
  } catch {
    return { results: [], confident: false };
  }
}

// Power path: web search → Claude Sonnet synthesis
async function webSearchAndExtract(q: string): Promise<StrainResult[]> {
  // Use Claude with web search tool
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    tools: [{
      type: 'web_search_20250305' as 'web_search_20250305',
      name: 'web_search',
      max_uses: 2,
    }],
    messages: [{
      role: 'user',
      content: `Search for the cannabis strain "${q}" and return structured data about it and any closely related strains.

After searching, return a JSON array of matching strains. Each object:
{"slug":"blueberry-cruffin","name":"Blueberry Cruffin","strain_type":"hybrid","thc_min":22,"thc_max":26,"typical_effects":["Sleepy","Euphoric","Hungry"],"typical_flavors":["Blueberry","Sweet","Berry"]}

Return ONLY the JSON array, no markdown, no explanation.`,
    }],
  });

  // Get the final text response after tool use
  const textBlock = msg.content.findLast((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!textBlock) return [];
  return parseResults(textBlock.text);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, force_web = false } = body;

    if (!query?.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const q = normalizeQuery(query);
    const db = createServerSupabaseClient();

    // 1. Cache hit — instant
    if (!force_web) {
      const { data: cached } = await db
        .from('strain_search_cache')
        .select('results')
        .eq('query', q)
        .single();

      if (cached?.results) {
        const results = cached.results as unknown[];
        if (Array.isArray(results) && results.length > 0) {
          return NextResponse.json({ results, total: results.length, source: 'cache' });
        }
      }
    }

    let results: StrainResult[] = [];
    let source = 'ai';

    if (!force_web) {
      // 2. Try Claude knowledge first (fast)
      const { results: claudeResults, confident } = await askClaude(q);

      if (claudeResults.length > 0 && confident) {
        results = claudeResults;
        source = 'ai';
      } else {
        // 3. Not confident or no results — escalate to web search
        const webResults = await webSearchAndExtract(q);
        if (webResults.length > 0) {
          results = webResults;
          source = 'web';
        } else if (claudeResults.length > 0) {
          // Fall back to unconfident Claude results rather than nothing
          results = claudeResults;
          source = 'ai';
        }
      }
    } else {
      // force_web: skip Claude, go straight to web search
      results = await webSearchAndExtract(q);
      source = 'web';
      if (results.length === 0) {
        // Still nothing — ask Claude as last resort
        const { results: fallback } = await askClaude(q);
        results = fallback;
        source = 'ai_fallback';
      }
    }

    // 4. Cache results
    if (results.length > 0) {
      void db.from('strain_search_cache')
        .upsert({ query: q, results: results as never, created_at: new Date().toISOString() });
    }

    return NextResponse.json({ results, total: results.length, source });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
