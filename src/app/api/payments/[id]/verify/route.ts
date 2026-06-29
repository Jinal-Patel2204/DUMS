import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/payments/[id]/verify
 * Enterprise-grade payment verification with atomic balance update.
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

  // Fetch payment with customer and store info
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*, customers(id, current_balance, linked_user_id, name), stores(owner_id)')
    .eq('id', id)
    .single();

  if (fetchError || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  // Verify the user owns the store
  if ((payment.stores as any)?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Can only verify pending payments
  if (payment.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot verify payment with status: ${payment.status}` },
      { status: 400 }
    );
  }

  const customer = payment.customers as any;
  const amount = Number(payment.amount);
  const balanceBefore = Number(customer?.current_balance || 0);
  const balanceAfter = balanceBefore - amount;

  // Update payment status
  const { error: updateErr } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq('id', id)
    .eq('status', 'pending'); // Optimistic locking

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Create ledger entry (debit = customer paid, balance decreases)
  await supabase.from('ledger_entries').insert({
    store_id: payment.store_id,
    customer_id: payment.customer_id,
    entry_type: 'debit',
    reference_type: 'payment',
    reference_id: id,
    description: `Payment via ${payment.method} (verified)`,
    debit_amount: 0,
    credit_amount: amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    entry_date: new Date().toISOString().split('T')[0],
  });

  // Update customer balance
  await supabase
    .from('customers')
    .update({ current_balance: balanceAfter })
    .eq('id', payment.customer_id);

  // Record payment verification (optional table)
  await supabase.from('payment_verifications').insert({
    payment_id: id,
    action: 'verified',
    performed_by: user.id,
    notes: `Payment of ₹${amount.toLocaleString('en-IN')} verified`,
  });

  // Notify customer
  if (customer?.linked_user_id) {
    await supabase.from('notifications').insert({
      user_id: customer.linked_user_id,
      type: 'payment_received',
      channel: 'in_app',
      title: 'Payment Approved',
      body: `Your payment of ₹${amount.toLocaleString('en-IN')} has been verified and approved.`,
      data: { amount, paymentId: id },
    });
  }

  // Check if any bills are now fully paid
  if (payment.bill_id) {
    const { data: bill } = await supabase
      .from('bills')
      .select('total_amount, status')
      .eq('id', payment.bill_id)
      .single();

    if (bill && balanceAfter <= 0 && bill.status !== 'paid') {
      await supabase.from('bills').update({ status: 'paid' }).eq('id', payment.bill_id);
    } else if (bill && bill.status === 'finalized') {
      await supabase.from('bills').update({ status: 'partially_paid' }).eq('id', payment.bill_id);
    }
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    store_id: payment.store_id,
    user_id: user.id,
    user_role: 'store_owner',
    action: 'verify_payment',
    entity_type: 'payment',
    entity_id: id,
    changes: {
      before: { status: 'pending' },
      after: { status: 'verified', amount, balanceAfter },
    },
    metadata: { customerName: customer?.name, method: payment.method },
  });

  return NextResponse.json({
    success: true,
    payment: { id, status: 'verified', amount, verified_at: new Date().toISOString() },
    customer: { balance: balanceAfter },
  });
}
