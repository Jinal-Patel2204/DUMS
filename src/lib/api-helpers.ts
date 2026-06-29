import { createClient } from '@/lib/supabase/client';

/**
 * Enterprise-level API helper with consistent error handling,
 * retry logic, and request validation.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validates that the current user owns the specified store.
 * Returns store owner's user ID or throws.
 */
export async function validateStoreOwnership(storeId: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ApiError('Unauthorized', 401);

  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', storeId)
    .eq('is_deleted', false)
    .single();

  if (!store || store.owner_id !== user.id) {
    throw new ApiError('Access denied: you do not own this store', 403);
  }

  return user.id;
}

/**
 * Sanitize user input for safe use in queries
 */
export function sanitizeSearchInput(input: string): string {
  // Remove SQL special characters that could be used for injection
  return input.replace(/[%_\\'";\-\-]/g, '').trim().slice(0, 100);
}

/**
 * Format currency for INR
 */
export function formatCurrency(amount: number): string {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Validate that a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Rate limiter for client-side operations (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
