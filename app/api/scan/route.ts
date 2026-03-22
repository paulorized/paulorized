import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { openai } from '@/lib/openai';
import { emptyProduct } from '@/types/product';

const ExtractedProductSchema = z.object({
  brand: z.string(),
  product_type: z.string(),
  weight: z.string(),
  strain_type: z.string(),
  strain_name: z.string(),
  strain_bio: z.string(),
  thc_percent: z.number().nullable(),
  cbd_percent: z.number().nullable(),
  confidence: z.number(),
});

export async function POST(request: Request) {
  try {
    console.info('[api/scan] Request received');
    const formData = await request.formData();
    const files = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0);

    console.info(`[api/scan] Files loaded: ${files.length}`);

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    const imageInputs = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          type: 'input_image' as const,
          image_url: `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`,
        };
      }),
    );

    console.info('[api/scan] OpenAI request starting');
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Extract cannabis product label information. Return strict JSON only. Use null for unknown numeric values and empty strings for unknown text fields.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Extract this exact JSON shape: {"brand":"","product_type":"","weight":"","strain_type":"","strain_name":"","strain_bio":"","thc_percent":null,"cbd_percent":null,"confidence":0}',
            },
            ...imageInputs,
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'cannabis_product_extraction',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              brand: { type: 'string' },
              product_type: { type: 'string' },
              weight: { type: 'string' },
              strain_type: { type: 'string' },
              strain_name: { type: 'string' },
              strain_bio: { type: 'string' },
              thc_percent: { type: ['number', 'null'] },
              cbd_percent: { type: ['number', 'null'] },
              confidence: { type: 'number' },
            },
            required: [
              'brand',
              'product_type',
              'weight',
              'strain_type',
              'strain_name',
              'strain_bio',
              'thc_percent',
              'cbd_percent',
              'confidence',
            ],
          },
        },
      },
    });

    console.info('[api/scan] OpenAI response received');
    const outputText = response.output_text || JSON.stringify(emptyProduct);
    const extractedData = ExtractedProductSchema.parse(JSON.parse(outputText));

    console.info('[api/scan] Supabase insert starting');
    const supabase = createServerSupabaseClient();
    const { data: insertedRow, error } = await supabase
      .from('product_logs')
      .insert({
        brand: extractedData.brand,
        product_type: extractedData.product_type,
        weight: extractedData.weight,
        strain_type: extractedData.strain_type,
        strain_name: extractedData.strain_name,
        strain_bio: extractedData.strain_bio,
        thc_percent: extractedData.thc_percent,
        cbd_percent: extractedData.cbd_percent,
        extraction_confidence: extractedData.confidence ?? null,
        extracted_data_json: extractedData,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert product log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[api/scan] Supabase insert succeeded');
    return NextResponse.json({ extractedData, insertedRow });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    console.error('[api/scan] Unhandled error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
