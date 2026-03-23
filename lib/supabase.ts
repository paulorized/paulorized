import { createClient } from '@supabase/supabase-js';
import { env as clientEnv } from '@/lib/env.client';
import { env as serverEnv } from '@/lib/env.server';

export const createBrowserSupabaseClient = () =>
  createClient(clientEnv.nextPublicSupabaseUrl, clientEnv.nextPublicSupabaseAnonKey);

export const createServerSupabaseClient = () =>
  createClient(clientEnv.nextPublicSupabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
