import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { type ExtractedProduct } from '@/types/product';

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
  "confidence": number between 0 and 1
}

For flower/concentrates/vapes use thc_percent and cbd_percent. For edibles use thc_mg (total mg per package), cbd_mg (total mg per package), and mg_per_piece (mg per single piece/serving) — look for values like "100mg THC", "10mg per gummy". If a field is not visible or not applicable, use an empty string for text fields or null for numeric fields. Set confidence to reflect how clearly the label was readable (1.0 = perfectly clear, 0.0 = unreadable). Return ONLY the JSON object, no markdown, no explanation.`;

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
      max_tokens: 1000,
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

    // Normalize strain_type to match DB check constraint allowed values
    const ALLOWED_STRAIN_TYPES = ['indica', 'sativa', 'hybrid', 'unknown'];
    const rawStrainType = (extractedData.strain_type ?? '').toLowerCase().trim();
    extractedData.strain_type = ALLOWED_STRAIN_TYPES.includes(rawStrainType) ? rawStrainType : '';

    // If strain_type is missing and we have a strain name, look it up via GPT knowledge
    if (!extractedData.strain_type && extractedData.strain_name) {
      try {
        const lookupCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `What is the strain type for the cannabis strain "${extractedData.strain_name}"? Reply with exactly one word: indica, sativa, or hybrid. If unknown, reply: unknown.`,
            },
          ],
          max_tokens: 10,
        });
        const lookedUp = (lookupCompletion.choices[0]?.message?.content ?? '').toLowerCase().trim();
        if (ALLOWED_STRAIN_TYPES.includes(lookedUp)) {
          extractedData.strain_type = lookedUp;
        }
      } catch {
        // Best-effort — don't fail the scan if lookup errors
      }
    }

    // Return extracted data only — saving happens separately via /api/save
    return NextResponse.json({ extractedData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
