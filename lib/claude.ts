import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env.server';

// Lazy singleton — defer env read + Anthropic client construction until first use at runtime.
let _claude: Anthropic | null = null;
function getClaude(): Anthropic {
  if (!_claude) {
    _claude = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return _claude;
}

// Proxy so existing `claude.messages.create(...)` call sites keep working.
export const claude = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return Reflect.get(getClaude(), prop, getClaude());
  },
});
