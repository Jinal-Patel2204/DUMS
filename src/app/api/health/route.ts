import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check Supabase connection
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('stores').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check environment variables
  checks.env = (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) ? 'ok' : 'error';

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
