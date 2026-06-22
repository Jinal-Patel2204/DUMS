import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export async function debugLog(
  page: string,
  action: string,
  message: string,
  level: LogLevel = 'info',
  metadata?: Record<string, unknown>
) {
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
    console.error('[DebugLogger] Failed to write log:', err);
  }
}
