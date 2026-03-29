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

Return a JSON array of cannabis strains that match or are closely related to this search term. Include the exact strain if it exists, plus any similar strains with that name or key term in the name.

Rules:
- If the query is a specific strain name, return that strain first, then up to 7 related strains that share that name or are closely related
- If the query is a partial name (like "diesel" or "gelato"), return ALL strains that contain that word in their name, up to 12 results
- If the query is a general type/effect (like "sleepy indica"), return up to 8 best matching strains
- Always return at least 1 result — use your best judgment for the closest match
- Results must be real, well-known cannabis strains

Each object in the array must have EXACTLY these fields:
- slug: string (lowercase hyphenated slug, e.g. "blue-dream")
- name: string (properly capitalized official name)
- strain_type: "indica" | "sativa" | "hybrid"
- thc_min: number (e.g. 18)
- thc_max: number (e.g. 24)
- nugshot_url: null

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;

    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
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
