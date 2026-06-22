import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const supabase = await createServerSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('bills')
    .select('*, customers!inner(name, phone)', { count: 'exact' })
    .eq('store_id', storeId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`bill_number.ilike.%${search}%,customers.name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], total: count || 0 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const body = await request.json();
  const { customerId, items, notes, dueDate } = body;

  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate bill number
  const { data: billNumberData } = await supabase.rpc('fn_generate_bill_number', { p_store_id: storeId });
  const billNumber = billNumberData || `INV-${Date.now()}`;

  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  const processedItems = items.map((item: any, index: number) => {
    const lineTotal = item.quantity * item.unit_price;
    const discountAmt = (lineTotal * item.discount_percent) / 100;
    const itemTotal = lineTotal - discountAmt;
    subtotal += lineTotal;
    totalDiscount += discountAmt;
    return {
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      discount_amount: discountAmt,
      tax_percent: 0,
      tax_amount: 0,
      total_price: itemTotal,
      sort_order: index,
    };
  });

  const totalAmount = subtotal - totalDiscount;

  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      store_id: storeId,
      customer_id: customerId,
      bill_number: billNumber,
      status: 'finalized',
      subtotal,
      discount_amount: totalDiscount,
      tax_amount: 0,
      total_amount: totalAmount,
      due_date: dueDate || null,
      notes: notes || null,
      created_by: user.id,
      finalized_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (billError) {
    return NextResponse.json({ error: billError.message }, { status: 500 });
  }

  // Create bill items
  const billItems = processedItems.map((item: any) => ({
    ...item,
    bill_id: bill.id,
  }));

  const { error: itemsError } = await supabase
    .from('bill_items')
    .insert(billItems);

  if (itemsError) {
    // Rollback bill
    await supabase.from('bills').delete().eq('id', bill.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Get customer current balance for ledger entry
  const { data: customer } = await supabase
    .from('customers')
    .select('current_balance')
    .eq('id', customerId)
    .single();

  const balanceBefore = Number(customer?.current_balance || 0);
  const balanceAfter = balanceBefore + totalAmount;

  // Create ledger entry (credit = customer owes more)
  const { error: ledgerError } = await supabase
    .from('ledger_entries')
    .insert({
      store_id: storeId,
      customer_id: customerId,
      entry_type: 'credit',
      reference_type: 'bill',
      reference_id: bill.id,
      description: `Bill ${billNumber}`,
      debit_amount: totalAmount,
      credit_amount: 0,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      entry_date: new Date().toISOString().split('T')[0],
    });

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  // Send notifications
  // Notify customer if linked
  const { data: custInfo } = await supabase
    .from('customers')
    .select('linked_user_id, name')
    .eq('id', customerId)
    .single();

  if (custInfo?.linked_user_id) {
    await supabase.from('notifications').insert({
      user_id: custInfo.linked_user_id,
      type: 'credit_issued',
      channel: 'in_app',
      title: 'New Bill',
      body: `A bill of ₹${totalAmount.toLocaleString('en-IN')} (${billNumber}) has been generated.`,
      data: { billNumber, amount: totalAmount },
    });
  }

  // Notify owner
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'bill_generated',
    channel: 'in_app',
    title: 'Bill Created',
    body: `Bill ${billNumber} for ₹${totalAmount.toLocaleString('en-IN')} created for ${custInfo?.name || 'customer'}.`,
    data: { billNumber, amount: totalAmount, customerName: custInfo?.name },
  });

  return NextResponse.json(bill, { status: 201 });
}
