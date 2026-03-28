import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { strain_name, lat, lon } = await request.json();
    if (!strain_name || !lat || !lon) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const prompt = `I am looking for cannabis dispensaries near latitude ${lat}, longitude ${lon} that are likely to carry the strain "${strain_name}". Based on your knowledge, list up to 4 real dispensaries that are geographically close to those coordinates. For each, provide the name, a one-line description, and an approximate distance if you can estimate it. If you truly have no knowledge of dispensaries in that area, say so honestly. Respond with JSON: { "dispensaries": [{ "name": string, "description": string, "distance": string }], "location_summary": string }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    return NextResponse.json({
      dispensaries: result.dispensaries ?? [],
      location_summary: result.location_summary ?? '',
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}