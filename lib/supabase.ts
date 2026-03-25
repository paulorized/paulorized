import { createClient } from '@supabase/supabase-js';
import { env as clientEnv } from '@/lib/env.client';
import { env as serverEnv } from '@/lib/env.server';

// Browser client — used in client components ('use client')
export const createBrowserSupabaseClient = () =>
  createClient(clientEnv.nextPublicSupabaseUrl, clientEnv.nextPublicSupabaseAnonKey);

// Server client with service role — bypasses RLS, used in API routes only
export const createServerSupabaseClient = () =>
  createClient(clientEnv.nextPublicSupabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
