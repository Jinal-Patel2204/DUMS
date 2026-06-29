import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid bill ID format' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: bill, error } = await supabase
    .from('bills')
    .select(`
      *,
      customers(id, name, phone, email, current_balance, credit_limit),
      bill_items(*, products(name, unit)),
      ledger_entries(id, entry_type, debit_amount, credit_amount, balance_after, created_at)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.code === 'PGRST116' ? 'Bill not found' : error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    );
  }

  // Verify user has access to this bill's store
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', bill.store_id)
    .single();

  // Allow access if user is store owner OR the linked customer
  const isOwner = store?.owner_id === user.id;
  const { data: customerLink } = await supabase
    .from('customers')
    .select('linked_user_id')
    .eq('id', bill.customer_id)
    .single();

  const isLinkedCustomer = customerLink?.linked_user_id === user.id;

  if (!isOwner && !isLinkedCustomer) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json(bill);
}
