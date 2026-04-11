import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { claude } from '@/lib/claude';
import { type ExtractedProduct } from '@/types/product';

// ── Leafly + Claude strain enrichment (mirrors strain-search route) ────────────

const LEAFLY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CannaBaseAI/1.0)',
  'Accept': 'application/json',
};

interface LeaflyStrain {
  name: string;
  category: string;
  most_terpene?: string | null;
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

async function fetchLeaflyStrain(strainName: string): Promise<LeaflyStrain | null> {
  const slug = strainName.toLowerCase().replace(/\s+/g, '-');
  const url = `https://consumer-api.leafly.com/api/strain_playlists/v2?strain_slug=${encodeURIComponent(slug)}&page=0&take=1`;
  try {
    const res = await fetch(url, { headers: LEAFLY_HEADERS, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.strains?.[0] ?? null;
  } catch { return null; }
}

const CLAUDE_STRAIN_PROMPT = `You are a cannabis strain expert. Given a strain name, return strain details in valid JSON.

Return ONLY a JSON object — no markdown, no explanation:
{
  "strain_type": "indica | sativa | hybrid | unknown",
  "strain_bio": "2-4 sentences about the strain",
  "typical_effects": ["up to 5 effects"],
  "typical_flavors": ["up to 3 flavors"],
  "thc_min": number or null,
  "thc_max": number or null,
  "cbd_min": number or null,
  "cbd_max": number or null,
  "confidence": number 0-1,
  "terpenes": [{ "name": "string", "percent": null, "source": "ai_estimated" }]
}

Effects: Relaxed, Happy, Euphoric, Uplifted, Creative, Focused, Sleepy, Hungry, Talkative, Energetic
Flavors: Earthy, Pine, Sweet, Citrus, Berry, Diesel, Skunk, Spicy, Woody, Floral, Tropical, Mint, Grape, Cheese
Common terpenes: Myrcene, Limonene, Caryophyllene, Linalool, Pinene, Terpinolene, Ocimene, Humulene

Rules:
- thc_min/thc_max: typical % range. Null only if truly unknown.
- cbd_min/cbd_max: null if negligible (<1%)
- confidence: 1.0=iconic, 0.7=well known, 0.4=moderately known, 0.2=lesser-known but real
- terpenes: list the 2-4 most characteristic terpenes for this strain. Use source: "ai_estimated".
- Never invent lineage. Only include genuinely documented info.`;

async function claudeStrainFallback(strainName: string) {
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: `${CLAUDE_STRAIN_PROMPT}\n\nStrain: ${strainName.trim()}` }],
  });
  const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function enrichFromStrainName(strainName: string): Promise<Partial<ExtractedProduct> & { strain_enriched_source?: string }> {
  // 1. Try Leafly first for strain metadata
  const leafly = await fetchLeaflyStrain(strainName);
  if (leafly) {
    const d = leafly.strain_playlist_details ?? {};
    const strainType = (leafly.category ?? '').toLowerCase();
    const leaflyTerps: { name: string; percent: number | null; source: 'leafly' }[] = [];
    if (leafly.most_terpene) {
      leaflyTerps.push({ name: leafly.most_terpene, percent: null, source: 'leafly' });
    }

    const leaflyResult = {
      strain_type: ['indica', 'sativa', 'hybrid'].includes(strainType) ? strainType : '',
      strain_bio: d.description ?? '',
      typical_effects: d.top_reported_effects ?? [],
      typical_flavors: d.top_reported_flavors ?? [],
      thc_min: d.thc_min ?? null,
      thc_max: d.thc_max ?? null,
      cbd_min: d.cbd_min ?? null,
      cbd_max: d.cbd_max ?? null,
      strain_enriched_source: 'leafly' as const,
      terpenes: leaflyTerps,
    };

    // Leafly rarely has terpene data — if empty, also ask Claude for characteristic terpenes
    if (leaflyTerps.length === 0) {
      try {
        const claudeResult = await claudeStrainFallback(strainName);
        return {
          ...leaflyResult,
          terpenes: Array.isArray(claudeResult.terpenes) ? claudeResult.terpenes : [],
        };
      } catch {
        return leaflyResult;
      }
    }

    return leaflyResult;
  }

  // 2. Full Claude fallback (Leafly had no result)
  try {
    const result = await claudeStrainFallback(strainName);
    const strainType = (result.strain_type ?? '').toLowerCase();
    return {
      strain_type: ['indica', 'sativa', 'hybrid'].includes(strainType) ? strainType : '',
      strain_bio: result.strain_bio ?? '',
      typical_effects: result.typical_effects ?? [],
      typical_flavors: result.typical_flavors ?? [],
      thc_min: result.thc_min ?? null,
      thc_max: result.thc_max ?? null,
      cbd_min: result.cbd_min ?? null,
      cbd_max: result.cbd_max ?? null,
      strain_enriched_source: 'ai',
      terpenes: Array.isArray(result.terpenes) ? result.terpenes : [],
    };
  } catch { return {}; }
}

const EXTRACTION_PROMPT = `You are a cannabis product label parser. Extract the following fields from the product label image(s) provided and return ONLY valid JSON matching this exact structure:

{
  "brand": "string",
  "product_type": "string (e.g. flower, edible, concentrate, vape, tincture, topical, pre-roll)",
  "weight": "string (e.g. 3.5g, 1oz)",
  "strain_type": "string (indica, sativa, hybrid, or unknown)",
  "strain_name": "string",
  "strain_bio": "string (any descriptive text about the strain)",
  "thc_percent": number or null,
  "cbd_percent": number or null,
  "thc_mg": number or null,
  "cbd_mg": number or null,
  "mg_per_piece": number or null,
  "confidence": number between 0 and 1,
  "terpenes": [{ "name": "string", "percent": number or null, "source": "label" }]
}

For flower/concentrates/vapes use thc_percent and cbd_percent. For edibles use thc_mg (total mg per package), cbd_mg (total mg per package), and mg_per_piece (mg per single piece/serving) — look for values like "100mg THC", "10mg per gummy". For terpenes: read any terpene panel on the label — look for words like Myrcene, Limonene, Caryophyllene, Linalool, Pinene, Terpinolene, Ocimene, Humulene, Bisabolol, Nerolidol and their associated percentages. If no terpene data is visible, return an empty array for terpenes. If a field is not visible or not applicable, use an empty string for text fields or null for numeric fields. Set confidence to reflect how clearly the label was readable (1.0 = perfectly clear, 0.0 = unreadable). Return ONLY the JSON object, no markdown, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided.' }, { status: 400 });
    }

    // Convert images to base64 for OpenAI vision
    const imageContents = await Promise.all(
      images.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: 'high' as const,
          },
        };
      }),
    );

    // Extract from image
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 1500,
    });

    const rawText = completion.choices[0]?.message?.content ?? '';

    let extractedData: ExtractedProduct;
    try {
      const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      extractedData = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response as JSON.', raw: rawText },
        { status: 500 },
      );
    }

    // Normalize THC/CBD — OpenAI sometimes returns "28%" or "28.5%" as strings
    const parsePercent = (val: unknown): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const n = parseFloat(String(val).replace('%', '').trim());
      return isNaN(n) ? null : n;
    };
    extractedData.thc_percent = parsePercent(extractedData.thc_percent);
    extractedData.cbd_percent = parsePercent(extractedData.cbd_percent);
    extractedData.thc_mg = parsePercent(extractedData.thc_mg);
    extractedData.cbd_mg = parsePercent(extractedData.cbd_mg);
    extractedData.mg_per_piece = parsePercent(extractedData.mg_per_piece);

    // Normalize strain_type — only store real values, never "unknown"
    const REAL_STRAIN_TYPES = ['indica', 'sativa', 'hybrid'];
    const rawStrainType = (extractedData.strain_type ?? '').toLowerCase().trim();
    extractedData.strain_type = REAL_STRAIN_TYPES.includes(rawStrainType) ? rawStrainType : '';

    // If strain name is known, enrich via Leafly → Claude
    if (extractedData.strain_name) {
      const productTypeLower = (extractedData.product_type ?? '').toLowerCase();
      const isEdible = productTypeLower.includes('edible') || productTypeLower.includes('gummy') || productTypeLower.includes('chocolate');

      const missingStrainType = !extractedData.strain_type;
      const missingThc = isEdible ? extractedData.thc_mg == null : extractedData.thc_percent == null;
      const labelBio = (extractedData.strain_bio ?? '').trim();
      const weakBio = labelBio.length < 80;

      {
        const enriched = await enrichFromStrainName(extractedData.strain_name);

        if (missingStrainType && enriched.strain_type) {
          extractedData.strain_type = enriched.strain_type;
        }
        if (enriched.strain_bio && enriched.strain_bio.length > labelBio.length && (weakBio || enriched.strain_bio.length > labelBio.length + 40)) {
          extractedData.strain_bio = enriched.strain_bio;
        } else if (!labelBio && enriched.strain_bio) {
          extractedData.strain_bio = enriched.strain_bio;
        }
        if (enriched.typical_effects) extractedData.typical_effects = enriched.typical_effects;
        if (enriched.typical_flavors) extractedData.typical_flavors = enriched.typical_flavors;

        if (missingThc) {
          if (isEdible) {
            if (extractedData.thc_mg == null && enriched.thc_max != null) {
              extractedData.thc_mg = enriched.thc_max;
              extractedData.thc_estimated = true;
            }
            if (extractedData.cbd_mg == null && enriched.cbd_max != null) {
              extractedData.cbd_mg = enriched.cbd_max;
            }
          } else {
            if (extractedData.thc_percent == null && enriched.thc_max != null) {
              extractedData.thc_percent = enriched.thc_max;
              extractedData.thc_estimated = true;
            }
            if (extractedData.cbd_percent == null && enriched.cbd_max != null) {
              extractedData.cbd_percent = enriched.cbd_max;
            }
          }
        }

        if (enriched.strain_enriched_source) {
          extractedData.strain_enriched_source = enriched.strain_enriched_source;
        }
        // Only fill in terps from strain enrichment if label didn't already have them
        if (enriched.terpenes && enriched.terpenes.length > 0 && (!extractedData.terpenes || extractedData.terpenes.length === 0)) {
          extractedData.terpenes = enriched.terpenes;
        }
      }
    }

    // Return extracted data only — saving happens separately via /api/save
    return NextResponse.json({ extractedData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
