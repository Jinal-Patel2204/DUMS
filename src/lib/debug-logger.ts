import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

/**
 * Debug logger that only writes to the database in development mode.
 * In production, only errors are logged to console.
 */
export async function debugLog(
  page: string,
  action: string,
  message: string,
  level: LogLevel = 'info',
  metadata?: Record<string, unknown>
) {
  // In production, only log errors to console (no DB writes)
  if (process.env.NODE_ENV === 'production') {
    if (level === 'error') {
      console.error(`[${page}/${action}]`, message);
    }
    return;
  }

  // In development, write to debug_logs table
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    await supabase.from('debug_logs').insert({
      user_id: session?.user?.id || null,
      page,
      action,
      level,
      message,
      metadata: metadata || null,
    });
  } catch (err) {
    // Silent fail - debug logging should never crash the app
    if (process.env.NODE_ENV === 'development') {
      console.error('[DebugLogger] Failed to write log:', err);
    }
  }
}
