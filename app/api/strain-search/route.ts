import { NextRequest, NextResponse } from 'next/server';
import { claude } from '@/lib/claude';

// ── Leafly consumer API helpers ──────────────────────────────────────────────

const LEAFLY_BASE = 'https://consumer-api.leafly.com/api/strain_playlists/v2';
const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

interface LeaflyStrain {
  strain_slug: string;
  name: string;
  category: string; // indica / sativa / hybrid
  subtitle?: string;
  nugshot?: { url: string };
  phenotype?: string;
  most_terpene?: string;
  strain_playlist_details?: {
    thc_max?: number;
    thc_min?: number;
    cbd_max?: number;
    cbd_min?: number;
    top_reported_effects?: string[];
    top_reported_flavors?: string[];
    description?: string;
  };
}

async function searchLeafly(query: string): Promise<LeaflyStrain[]> {
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}&page=0&take=1`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.strains ?? [];
  } catch { return []; }
}

async function leaflyAutocomplete(query: string): Promise<LeaflyStrain[]> {
  // Leafly's search/filter endpoint
  const url = `${LEAFLY_BASE}?strain_slug=&filters={"strain_slug":{"contains":"${encodeURIComponent(query.toLowerCase())}"}}}&page=0&take=10`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.strains ?? [];
  } catch { return []; }
}

function leaflyToResult(s: LeaflyStrain) {
  const d = s.strain_playlist_details ?? {};
  return {
    strain_name: s.name,
    strain_type: (s.category ?? 'unknown').toLowerCase(),
    strain_bio: d.description ?? '',
    typical_effects: d.top_reported_effects ?? [],
    typical_flavors: d.top_reported_flavors ?? [],
    thc_min: d.thc_min ?? null,
    thc_max: d.thc_max ?? null,
    cbd_min: d.cbd_min ?? null,
    cbd_max: d.cbd_max ?? null,
    best_for: '',
    also_known_as: [],
    confidence: 1.0,
    source: 'leafly',
    not_found: false,
  };
}

// ── Claude fallback ───────────────────────────────────────────────────────────

const CLAUDE_PROMPT = `You are a cannabis strain expert. Given a strain name, return everything known about it in valid JSON.

Return ONLY a JSON object — no markdown, no explanation:
{
  "strain_name": "canonical strain name",
  "strain_type": "indica | sativa | hybrid | unknown",
  "strain_bio": "2-4 sentences: origin, lineage, what makes it unique",
  "typical_effects": ["up to 5 effects"],
  "typical_flavors": ["up to 3 flavors"],
  "thc_min": number or null,
  "thc_max": number or null,
  "cbd_min": number or null,
  "cbd_max": number or null,
  "best_for": "1 sentence on ideal use case or time of day",
  "also_known_as": ["aliases if any"],
  "confidence": number 0-1,
  "source": "ai",
  "not_found": false
}

Only return not_found:true if the query is clearly not a cannabis strain (gibberish, pure food item with zero strain history, non-cannabis term).
If it could plausibly be a real strain — even lesser-known or regional — return your best knowledge with a low confidence score.

Effects: Relaxed, Happy, Euphoric, Uplifted, Creative, Focused, Sleepy, Hungry, Talkative, Energetic, Giggly, Tingly
Flavors: Earthy, Pine, Sweet, Citrus, Berry, Diesel, Skunk, Spicy, Woody, Floral, Tropical, Mint, Vanilla, Grape, Cheese

Rules:
- thc_min/thc_max: typical % range. Null only if truly unknown.
- cbd_min/cbd_max: null if negligible (<1%)
- confidence: 1.0=iconic, 0.7=well known, 0.4=moderately known, 0.2=lesser-known but real
- Never invent lineage or effects. Only include what is genuinely documented.
- When in doubt return low-confidence result, NOT not_found.`;

async function claudeFallback(query: string) {
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `${CLAUDE_PROMPT}\n\nStrain to look up: ${query.trim()}`,
      },
    ],
  });

  const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    // 1. Try Leafly first
    const leaflyHits = await searchLeafly(query);
    if (leaflyHits.length > 0) {
      return NextResponse.json({ result: leaflyToResult(leaflyHits[0]) });
    }

    // 2. Claude fallback with clear "ai estimate" marker
    try {
      const result = await claudeFallback(query);
      return NextResponse.json({ result });
    } catch {
      return NextResponse.json({ error: 'Failed to look up strain.' }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
