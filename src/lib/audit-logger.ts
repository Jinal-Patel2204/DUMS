import { createClient } from '@/lib/supabase/client';

export type AuditModule = 'customer' | 'product' | 'bill' | 'payment' | 'ledger' | 'store' | 'notification_config' | 'payment_config' | 'user' | 'installment' | 'report' | 'settings';
export type AuditAction = 'create' | 'update' | 'delete' | 'void' | 'verify_payment' | 'reject_payment' | 'login' | 'logout' | 'password_change' | 'invite_customer' | 'change_credit_limit' | 'generate_bill' | 'cancel_bill' | 'export_report' | 'settings_change' | 'finalize_bill';

interface AuditLogInput {
  action: AuditAction;
  entity_type: AuditModule;
  entity_id: string;
  description: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}

/**
 * Enterprise audit logger.
 * Records all significant business actions with before/after state.
 * Used for compliance, debugging, and security auditing.
 */
export async function auditLog(input: AuditLogInput) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get user profile for role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Get store_id
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', session.user.id)
      .eq('is_deleted', false)
      .limit(1);

    const storeId = stores?.[0]?.id;
    if (!storeId) return;

    await supabase.from('audit_logs').insert({
      store_id: storeId,
      user_id: session.user.id,
      user_role: profile?.role || 'store_owner',
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      description: input.description,
      changes: input.changes || null,
      metadata: {
        ...input.metadata,
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      },
      ip_address: null, // Cannot reliably get from client-side
    });
  } catch (err) {
    // Audit logging should never crash the application
    if (process.env.NODE_ENV === 'development') {
      console.error('[AuditLog] Failed:', err);
    }
  }
}

/**
 * Convenience function for settings change audit
 */
export async function auditSettingsChange(settingType: string, changes: { before: any; after: any }) {
  await auditLog({
    action: 'settings_change',
    entity_type: 'settings',
    entity_id: settingType,
    description: `Updated ${settingType} settings`,
    changes,
  });
}
