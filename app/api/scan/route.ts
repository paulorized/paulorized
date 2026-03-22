import { NextResponse } from 'next/server';
import {
  OPENAI_API_KEY,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from '@/lib/env';

const requiredEnvVars = [
  ['NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
  ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
  ['OPENAI_API_KEY', OPENAI_API_KEY],
] as const;

export async function POST() {
  const missingEnv = requiredEnvVars.find(([, value]) => !value);

  if (missingEnv) {
    return NextResponse.json(
      { error: `Missing environment variable: ${missingEnv[0]}` },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: 'Scan route is not implemented on this branch.' },
    { status: 501 },
  );
}
