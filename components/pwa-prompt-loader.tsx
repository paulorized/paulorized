'use client';
import dynamic from 'next/dynamic';
const PWAPrompt = dynamic(() => import('./pwa-prompt').then(m => m.PWAPrompt), { ssr: false });
export function PWAPromptLoader() {
  return <PWAPrompt />;
}
