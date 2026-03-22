const getEnv = (name: keyof NodeJS.ProcessEnv) => {
  const value = process.env[name];

  if (!value) {
    console.error('Missing environment variable:', name);
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

export const env = {
  nextPublicSupabaseUrl: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  nextPublicSupabaseAnonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  openAIApiKey: getEnv('OPENAI_API_KEY'),
};
