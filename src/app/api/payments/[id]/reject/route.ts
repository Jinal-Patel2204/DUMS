import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectPaymentSchema } from '@/lib/validations/payment';

/**
 * POST /api/payments/[id]/reject
 * Reject a pending payment with mandatory reason.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const validation = rejectPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Rejection reason is required (min 3 characters)', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { rejection_reason } = validation.data;

  // Fetch payment
  const { data: payment } = await supabase
    .from('payments')
    .select('*, customers(linked_user_id, name), stores(owner_id)')
    .eq('id', id)
    .single();

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if ((payment.stores as any)?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (payment.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot reject payment with status: ${payment.status}` },
      { status: 400 }
    );
  }

  // Update payment
  const { error: updateErr } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      rejection_reason,
    })
    .eq('id', id)
    .eq('status', 'pending');

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Record rejection
  await supabase.from('payment_verifications').insert({
    payment_id: id,
    action: 'rejected',
    performed_by: user.id,
    notes: rejection_reason,
  });

  // Notify customer
  const customer = payment.customers as any;
  if (customer?.linked_user_id) {
    await supabase.from('notifications').insert({
      user_id: customer.linked_user_id,
      type: 'payment_received',
      channel: 'in_app',
      title: 'Payment Rejected',
      body: `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} was rejected. Reason: ${rejection_reason}`,
      data: { amount: payment.amount, reason: rejection_reason },
    });
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    store_id: payment.store_id,
    user_id: user.id,
    user_role: 'store_owner',
    action: 'reject_payment',
    entity_type: 'payment',
    entity_id: id,
    changes: {
      before: { status: 'pending' },
      after: { status: 'rejected', rejection_reason },
    },
    metadata: { customerName: customer?.name },
  });

  return NextResponse.json({ success: true, payment: { id, status: 'rejected', rejection_reason } });
}
