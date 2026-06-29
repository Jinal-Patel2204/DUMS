/**
 * Environment variable validation.
 * Fails fast with clear error messages if required vars are missing.
 */

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const;

const optionalVars = [
  'RESEND_API_KEY',
  'CRON_SECRET',
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  resendApiKey: process.env.RESEND_API_KEY,
  cronSecret: process.env.CRON_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
