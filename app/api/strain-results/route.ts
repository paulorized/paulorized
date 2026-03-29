import { NextRequest, NextResponse } from 'next/server';
import { claude } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 0 } = body;

    if (!query?.trim() || query.trim().length < 1) {
      return NextResponse.json({ results: [], total: 0, page, has_more: false });
    }

    // Only fetch page 0 — Claude returns all relevant matches in one shot
    if (page > 0) {
      return NextResponse.json({ results: [], total: 0, page, has_more: false });
    }

    const q = query.trim();

    const prompt = `You are a cannabis strain database. The user searched for: "${q}"

Return a JSON array of cannabis strains that match or are closely related to this search term.

Rules:
- If the query is a specific strain name, return that strain first, then up to 7 related strains
- If the query is a partial name (like "diesel" or "gelato"), return ALL strains containing that word, up to 12 results
- If the query is a general type/effect, return up to 8 best matching strains
- Always return at least 1 result
- Results must be real, well-known cannabis strains

Each object must have EXACTLY these fields:
- slug: string (lowercase hyphenated, e.g. "blue-dream")
- name: string (properly capitalized)
- strain_type: "indica" | "sativa" | "hybrid"
- thc_min: number (typical min THC %)
- thc_max: number (typical max THC %)
- cbd_min: number (typical min CBD %, usually 0.1 for most strains)
- cbd_max: number (typical max CBD %)
- typical_effects: array of 3-5 strings (e.g. ["Relaxed", "Happy", "Euphoric"])
- typical_flavors: array of 3-5 strings (e.g. ["Berry", "Sweet", "Earthy"])

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;

    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const results = JSON.parse(cleaned);

    if (!Array.isArray(results)) {
      return NextResponse.json({ results: [], total: 0, page: 0, has_more: false });
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
