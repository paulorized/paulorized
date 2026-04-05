import 'server-only';

const getEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

// Lazy getters — env vars only read when accessed at runtime, not at module load.
// This prevents "Collect page data" build step from throwing when vars aren't present.
export const env = {
    get supabaseServiceRoleKey() { return getEnv('SUPABASE_SERVICE_ROLE_KEY'); },
    get openAIApiKey() { return getEnv('OPENAI_API_KEY'); },
    get anthropicApiKey() { return getEnv('ANTHROPIC_API_KEY'); },
};
