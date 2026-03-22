import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const createBrowserSupabaseClient = () =>
  createClient(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey);

export const createServerSupabaseClient = () =>
  createClient(env.nextPublicSupabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
