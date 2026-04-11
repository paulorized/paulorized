import { NextRequest, NextResponse } from 'next/server';
import { claude } from '@/lib/claude';

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

async function fetchLeaflyStrain(strainName: string) {
  const slug = strainName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=${encodeURIComponent(slug)}&page=0&take=1`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.strains?.[0] ?? null;
  } catch { return null; }
}

const CLAUDE_LOOKUP_PROMPT = `You are a cannabis strain database. Given a brand name and/or strain name, return everything you know about this product in valid JSON.

Return ONLY a JSON object — no markdown, no explanation:
{
  "brand": "string or empty string",
  "strain_name": "canonical strain name or empty string",
  "strain_type": "indica | sativa | hybrid | unknown",
  "strain_bio": "1-3 sentence description of the strain. Empty string if unknown.",
  "thc_percent": number or null,
  "cbd_percent": number or null,
  "thc_mg": null,
  "cbd_mg": null,
  "mg_per_piece": null,
  "weight": "",
  "product_type": "",
  "thc_estimated": true,
  "confidence": number 0-1,
  "typical_effects": ["up to 5 effects"],
  "typical_flavors": ["up to 3 flavors"],
  "terpenes": [{ "name": "string", "percent": null, "source": "ai_estimated" }]
}

Rules:
- thc_percent: typical average %. Null only if truly unknown.
- Never invent strain_bio — only real documented info. Empty string if uncertain.
- strain_type must be: indica, sativa, hybrid, or unknown
- Do not guess product_type or weight — always empty string.
- confidence: 1.0=iconic, 0.7=well known, 0.4=moderately known, 0.2=lesser-known
- terpenes: list 2-4 most characteristic terpenes. Use source: "ai_estimated". Percent null unless well-known.
- When in doubt return low-confidence result rather than empty

Effects: Relaxed, Happy, Euphoric, Uplifted, Creative, Focused, Sleepy, Hungry, Talkative, Energetic
Flavors: Earthy, Pine, Sweet, Citrus, Berry, Diesel, Skunk, Spicy, Woody, Floral, Tropical, Mint, Grape, Cheese
Common terpenes: Myrcene, Limonene, Caryophyllene, Linalool, Pinene, Terpinolene, Ocimene, Humulene`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, strain } = body;

    if (!brand && !strain) {
      return NextResponse.json({ error: 'Brand or strain name is required.' }, { status: 400 });
    }

    const strainName = (strain ?? '').trim();

    // 1. Try Leafly first if we have a strain name
    if (strainName) {
      const leafly = await fetchLeaflyStrain(strainName);
      if (leafly) {
        const d = leafly.strain_playlist_details ?? {};
        const strainType = (leafly.category ?? 'unknown').toLowerCase();
        const leaflyTerps = leafly.most_terpene
          ? [{ name: leafly.most_terpene, percent: null as null, source: 'leafly' as const }]
          : [];
        const product = {
          brand: (brand ?? '').trim(),
          strain_name: leafly.name,
          strain_type: ['indica', 'sativa', 'hybrid'].includes(strainType) ? strainType : 'unknown',
          strain_bio: d.description ?? '',
          thc_percent: d.thc_max ?? null,
          cbd_percent: d.cbd_max ?? null,
          thc_mg: null,
          cbd_mg: null,
          mg_per_piece: null,
          weight: '',
          product_type: '',
          thc_estimated: true,
          confidence: 1.0,
          typical_effects: d.top_reported_effects ?? [],
          typical_flavors: d.top_reported_flavors ?? [],
          terpenes: leaflyTerps,
          source: 'leafly',
        };
        return NextResponse.json({ product });
      }
    }

    // 2. Claude fallback
    const userPrompt = [
      brand ? `Brand: ${brand}` : '',
      strainName ? `Strain: ${strainName}` : '',
    ].filter(Boolean).join('\n');

    const msg = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: `${CLAUDE_LOOKUP_PROMPT}\n\n${userPrompt}` }],
    });

    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let product: Record<string, unknown>;
    try {
      product = JSON.parse(cleaned);
      product.source = 'ai';
    } catch {
      return NextResponse.json({ error: 'Failed to parse strain data.' }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
