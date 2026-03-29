import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase.server';
import { claude } from '@/lib/claude';

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query } = body;

  if (!query?.trim()) {
    return new Response('[]', { headers: { 'Content-Type': 'text/event-stream' } });
  }

  const q = normalizeQuery(query);
  const db = createServerSupabaseClient();

  // Check cache — return immediately if hit
  const { data: cached } = await db
    .from('strain_search_cache')
    .select('results')
    .eq('query', q)
    .single();

  if (cached?.results) {
    const results = cached.results as unknown[];
    const stream = new ReadableStream({
      start(controller) {
        for (const r of results) {
          controller.enqueue(`data: ${JSON.stringify(r)}\n\n`);
        }
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Source': 'cache',
      },
    });
  }

  // Stream from Claude — parse JSON objects as they stream in
  const encoder = new TextEncoder();
  const allResults: unknown[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let buffer = '';
        let inArray = false;
        let depth = 0;
        let objectStart = -1;

        const claudeStream = claude.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: `Cannabis strain search: "${q}"

Return a JSON array of up to 10 matching real cannabis strains. If the query is a partial name like "diesel" or "gelato", include all strains with that word in the name. Each object:
{"slug":"blue-dream","name":"Blue Dream","strain_type":"hybrid","thc_min":17,"thc_max":24,"typical_effects":["Relaxed","Happy","Creative"],"typical_flavors":["Berry","Sweet","Earthy"]}

JSON array only, no markdown.`,
          }],
        });

        for await (const chunk of claudeStream) {
          if (chunk.type !== 'content_block_delta') continue;
          if (chunk.delta.type !== 'text_delta') continue;
          buffer += chunk.delta.text;

          // Find the start of the JSON array
          if (!inArray) {
            const arrStart = buffer.indexOf('[');
            if (arrStart !== -1) {
              buffer = buffer.slice(arrStart);
              inArray = true;
            } else {
              continue;
            }
          }

          // Parse complete JSON objects out of the buffer as they arrive
          for (let i = 0; i < buffer.length; i++) {
            const ch = buffer[i];
            if (ch === '{') {
              if (depth === 0) objectStart = i;
              depth++;
            } else if (ch === '}') {
              depth--;
              if (depth === 0 && objectStart !== -1) {
                const objStr = buffer.slice(objectStart, i + 1);
                try {
                  const obj = JSON.parse(objStr);
                  allResults.push(obj);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
                } catch {
                  // malformed partial — skip
                }
                objectStart = -1;
                buffer = buffer.slice(i + 1);
                i = -1; // restart scan on remaining buffer
              }
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // Cache results after streaming completes
        if (allResults.length > 0) {
          void db.from('strain_search_cache')
            .upsert({ query: q, results: allResults as never, created_at: new Date().toISOString() });
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`data: [ERROR] ${err}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'X-Source': 'ai',
    },
  });
}
