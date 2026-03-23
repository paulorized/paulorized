import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env';

const requiredEnvVars = [
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['OPENAI_API_KEY', OPENAI_API_KEY],
] as const;

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
  thc_source: z.string().optional(),
  cbd_source: z.string().optional(),
});

const CannabinoidLookupSchema = z.object({
  thc_percent: z.number().nullable(),
  cbd_percent: z.number().nullable(),
});

const extractionPrompt =
  'Extract cannabis product label information. Return ONLY JSON with this exact shape: {"brand":"","product_type":"","weight":"","strain_type":"","strain_name":"","strain_bio":"","thc_percent":null,"cbd_percent":null,"confidence":0}';

const isValidNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

async function callOpenAI(input: Array<Record<string, unknown>>) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { output_text?: string };
  return payload.output_text || '';
}

export async function POST(request: Request) {
  const missingEnv = requiredEnvVars.find(([, value]) => !value);

  if (missingEnv) {
    return NextResponse.json(
      { error: `Missing environment variable: ${missingEnv[0]}` },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll('images')
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    const imageInputs = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          type: 'input_image',
          image_url: `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`,
        };
      }),
    );

    const extractionText = await callOpenAI([
      {
        role: 'user',
        content: [
          { type: 'input_text', text: extractionPrompt },
          ...imageInputs,
        ],
      },
    ]);

    const extractedData = ExtractedProductSchema.parse(JSON.parse(extractionText));

    if (extractedData.thc_percent == null || extractedData.cbd_percent == null) {
      try {
        const lookupText = await callOpenAI([
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text:
                  `Find THC and CBD percentages for this cannabis product:\nBrand: ${extractedData.brand}\nStrain: ${extractedData.strain_name}\nProduct Type: ${extractedData.product_type}\n\nReturn ONLY JSON:\n{\n  "thc_percent": number | null,\n  "cbd_percent": number | null\n}`,
              },
            ],
          },
        ]);

        const lookup = CannabinoidLookupSchema.parse(JSON.parse(lookupText));

        if (extractedData.thc_percent == null && isValidNumber(lookup.thc_percent)) {
          extractedData.thc_percent = lookup.thc_percent;
          extractedData.thc_source = 'lookup';
        }

        if (extractedData.cbd_percent == null && isValidNumber(lookup.cbd_percent)) {
          extractedData.cbd_percent = lookup.cbd_percent;
          extractedData.cbd_source = 'lookup';
        }
      } catch (lookupError) {
        console.error('THC/CBD enrichment failed:', lookupError);
      }
    }

    return NextResponse.json({ extractedData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
