import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createServerSupabaseClient } from '@/lib/supabase';
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
  "confidence": number between 0 and 1
}

If a field is not visible or not applicable, use an empty string for text fields or null for numeric fields. Set confidence to reflect how clearly the label was readable (1.0 = perfectly clear, 0.0 = unreadable). Return ONLY the JSON object, no markdown, no explanation.`;


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const userId = formData.get('user_id') as string | null;

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

    // Normalize strain_type to match DB check constraint allowed values
    const ALLOWED_STRAIN_TYPES = ['indica', 'sativa', 'hybrid', 'unknown'];
    const rawStrainType = (extractedData.strain_type ?? '').toLowerCase().trim();
    const strainType = ALLOWED_STRAIN_TYPES.includes(rawStrainType) ? rawStrainType : null;

    // Save to Supabase
    const supabase = createServerSupabaseClient();
    const { error: dbError } = await supabase.from('product_logs').insert({
      user_id: userId || null,
      brand: extractedData.brand ?? '',
      product_type: extractedData.product_type ?? '',
      weight: extractedData.weight ?? '',
      strain_type: strainType,
      strain_name: extractedData.strain_name ?? '',
      strain_bio: extractedData.strain_bio ?? '',
      thc_percent: extractedData.thc_percent ?? null,
      cbd_percent: extractedData.cbd_percent ?? null,
      extraction_confidence: extractedData.confidence ?? null,
      extracted_data_json: extractedData,
    });

    if (dbError) {
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ extractedData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
