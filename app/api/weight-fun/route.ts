import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { grams } = await request.json();
    if (!grams || grams <= 0) return NextResponse.json({ error: 'No grams' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    const prompt = `The user has scanned ${grams.toFixed(1)} grams of cannabis products in their log. Give me ONE fun, surprising, or funny real-world weight comparison for exactly ${grams.toFixed(1)} grams. Be creative and vary wildly - use animals, food, tech gadgets, sports equipment, space objects, historical items, baby animals, fruit, office supplies - anything goes. Make it feel delightful and shareable. Keep it to 1-2 sentences max. Start with the object name then the comparison. Examples of the tone: "That's roughly the weight of a baby hamster." or "You could balance ${grams.toFixed(1)}g of weed against a stack of 12 US quarters." or "That's about as heavy as a hummingbird's heart." Be playful. Respond with JSON: { "item": "short item name", "comparison": "full fun sentence" }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 1.1,
      max_tokens: 120,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return NextResponse.json({ item: result.item ?? '', comparison: result.comparison ?? '' });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
