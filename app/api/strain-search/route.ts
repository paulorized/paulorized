import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

const SEARCH_PROMPT = `You are an expert cannabis strain database. Given any strain name or query, return detailed information about the strain in valid JSON.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "strain_name": "canonical strain name",
  "strain_type": "indica | sativa | hybrid | unknown",
  "strain_bio": "2-4 sentence description covering origin, lineage, and what makes this strain unique",
  "typical_effects": ["effect1", "effect2", "effect3", "effect4", "effect5"],
  "typical_flavors": ["flavor1", "flavor2", "flavor3"],
  "thc_min": number or null,
  "thc_max": number or null,
  "cbd_min": number or null,
  "cbd_max": number or null,
  "best_for": "1 sentence on ideal use case or time of day",
  "also_known_as": ["alias1", "alias2"],
  "confidence": number between 0 and 1,
  "not_found": false
}

If the strain is not recognized or the query is too vague, return:
{
  "not_found": true,
  "message": "Brief explanation of what you couldn't find"
}

Rules:
- typical_effects: use only well-known effects like Relaxed, Happy, Euphoric, Uplifted, Creative, Focused, Sleepy, Hungry, Talkative, Energetic, Giggly, Tingly
- typical_flavors: common flavor descriptors like Earthy, Pine, Sweet, Citrus, Berry, Diesel, Skunk, Spicy, Woody, Floral, Tropical, Mint
- thc_min/thc_max: typical percentage range (e.g. 18, 24). Null if truly unknown.
- cbd_min/cbd_max: null if negligible (under 1%)
- confidence: 1.0 = very well-known strain, 0.5 = moderately known, 0.0 = not recognized
- Do NOT invent information. Only include what is generally accepted.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SEARCH_PROMPT },
        { role: 'user', content: `Search for strain: ${query.trim()}` },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    let result: Record<string, unknown>;
    try {
      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse strain data.' }, { status: 500 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}