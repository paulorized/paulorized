import OpenAI from 'openai';
import { env } from '@/lib/env.server';

// Lazy singleton — defer env read + client construction until first use at runtime.
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: env.openAIApiKey });
  }
  return _openai;
}

// Proxy so existing `openai.chat.completions.create(...)` call sites keep working.
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return Reflect.get(getOpenAI(), prop, getOpenAI());
  },
});
