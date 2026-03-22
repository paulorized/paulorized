const getEnv = (key) => { const value = process.env[key]; if (!value) { throw new Error(`Missing environment variable: ${key}`); } return value; }; 

export const env = { 
  nextPublicSupabaseUrl: getEnv('NEXT_PUBLIC_SUPABASE_URL'), 
  nextPublicSupabaseAnonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), 
};