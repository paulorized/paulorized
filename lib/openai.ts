import OpenAI from 'openai';
import { env } from '@/lib/env.server';

export const openai = new OpenAI({
  apiKey: env.openAIApiKey,
});
