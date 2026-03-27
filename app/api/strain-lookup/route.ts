import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

const LOOKUP_PROMPT = `You are a cannabis strain database. Given a brand name and/or strain name, return everything you know about this product in valid JSON.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "brand": "string or empty string",
  "strain_name": "string or empty string",
  "strain_type": "indica | sativa | hybrid | unknown",
  "strain_bio": "string — 1-3 sentence description of the strain's effects, flavor, and origin. Empty string if unknown.",
  "thc_percent": number or null,
  "cbd_percent": number or null,
  "thc_mg": null,
  "cbd_mg": null,
  "mg_per_piece": null,
  "weight": "",
  "product_type": "",
  "thc_estimated": true,
  "confidence": number between 0 and 1
}

Rules:
- For thc_percent and cbd_percent: use typical/average values if well-known, otherwise null. Set thc_estimated to true.
- Never invent strain_bio — only include real, generally accepted info. If uncertain, return an empty string.
- strain_type must be one of: indica, sativa, hybrid, unknown
- Do not guess product_type or weight — always return empty string for those.
- confidence: how confident you are this is a real/known strain (1.0 = very well known, 0.0 = never heard of it)`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, strain } = body;

    if (!brand && !strain) {
      return NextResponse.json({ error: 'Brand or strain name is required.' }, { status: 400 });
    }

    const userPrompt = [
      brand ? `Brand: ${brand}` : '',
      strain ? `Strain: ${strain}` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: LOOKUP_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    let product: Record<string, unknown>;
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      product = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse strain data.' }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
