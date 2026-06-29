import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createBillSchema } from '@/lib/validations/bill';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const supabase = await createServerSupabaseClient();

  // Verify user owns this store
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', storeId)
    .eq('is_deleted', false)
    .single();

  if (!store || store.owner_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

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
    // Sanitize search to prevent SQL injection via ilike patterns
    const sanitized = search.replace(/[%_\\]/g, '').trim().slice(0, 50);
    if (sanitized) {
      query = query.or(`bill_number.ilike.%${sanitized}%,customers.name.ilike.%${sanitized}%`);
    }
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
  const supabase = await createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify store ownership
  const { data: store } = await supabase
    .from('stores')
    .select('owner_id')
    .eq('id', storeId)
    .eq('is_deleted', false)
    .single();

  if (!store || store.owner_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Parse and validate request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Map to schema format for validation
  const validationData = {
    customer_id: body.customerId,
    notes: body.notes || '',
    due_date: body.dueDate || '',
    items: (body.items || []).map((item: any) => ({
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
    })),
  };

  const result = createBillSchema.safeParse(validationData);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { customer_id: customerId, items, notes, due_date: dueDate } = result.data;

  // Verify customer belongs to this store
  const { data: customer } = await supabase
    .from('customers')
    .select('id, current_balance, credit_limit, is_active, name, linked_user_id')
    .eq('id', customerId)
    .eq('store_id', storeId)
    .eq('is_deleted', false)
    .single();

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found or does not belong to this store' }, { status: 404 });
  }

  if (!customer.is_active) {
    return NextResponse.json({ error: 'Cannot create bill for inactive customer' }, { status: 400 });
  }

  // Validate stock availability for all items
  const productIds = items.map((item) => item.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, stock_quantity, is_active')
    .in('id', productIds)
    .eq('store_id', storeId)
    .eq('is_deleted', false);

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 400 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Check stock and active status
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 });
    }
    if (!product.is_active) {
      return NextResponse.json({ error: `Product "${product.name}" is inactive` }, { status: 400 });
    }
    if (product.stock_quantity < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}` },
        { status: 400 }
      );
    }
  }

  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  const processedItems = items.map((item, index) => {
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

  // Credit limit check (warning, not blocking)
  const currentBalance = Number(customer.current_balance);
  const creditLimit = Number(customer.credit_limit);
  const wouldExceedLimit = creditLimit > 0 && (currentBalance + totalAmount) > creditLimit;

  // Generate bill number
  const { data: billNumberData } = await supabase.rpc('fn_generate_bill_number', { p_store_id: storeId });
  const billNumber = billNumberData || `INV-${Date.now()}`;

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
  const billItems = processedItems.map((item) => ({ ...item, bill_id: bill.id }));
  const { error: itemsError } = await supabase.from('bill_items').insert(billItems);

  if (itemsError) {
    await supabase.from('bills').delete().eq('id', bill.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Create ledger entry
  const balanceBefore = currentBalance;
  const balanceAfter = balanceBefore + totalAmount;

  const { error: ledgerError } = await supabase.from('ledger_entries').insert({
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
    console.error('[BillCreate] Ledger entry failed:', ledgerError.message);
  }

  // Deduct stock
  for (const item of items) {
    await supabase.rpc('fn_deduct_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    }).then(({ error }) => {
      // Fallback: manual update if RPC doesn't exist
      if (error) {
        const product = productMap.get(item.product_id)!;
        supabase.from('products').update({
          stock_quantity: product.stock_quantity - item.quantity,
        }).eq('id', item.product_id);
      }
    });

    // Record stock movement
    await supabase.from('stock_movements').insert({
      store_id: storeId,
      product_id: item.product_id,
      type: 'stock_out',
      quantity: item.quantity,
      reference_type: 'bill',
      reference_id: bill.id,
      notes: `Bill ${billNumber}`,
    });
  }

  // Notifications
  if (customer.linked_user_id) {
    await supabase.from('notifications').insert({
      user_id: customer.linked_user_id,
      type: 'credit_issued',
      channel: 'in_app',
      title: 'New Bill',
      body: `A bill of ₹${totalAmount.toLocaleString('en-IN')} (${billNumber}) has been generated.`,
      data: { billNumber, amount: totalAmount },
    });
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'bill_generated',
    channel: 'in_app',
    title: 'Bill Created',
    body: `Bill ${billNumber} for ₹${totalAmount.toLocaleString('en-IN')} created for ${customer.name}.`,
    data: { billNumber, amount: totalAmount, customerName: customer.name },
  });

  // Audit log
  await supabase.from('audit_logs').insert({
    store_id: storeId,
    user_id: user.id,
    user_role: 'store_owner',
    action: 'generate_bill',
    entity_type: 'bill',
    entity_id: bill.id,
    changes: { after: { billNumber, totalAmount, customerId, itemCount: items.length } },
    metadata: { creditLimitExceeded: wouldExceedLimit },
  });

  return NextResponse.json(
    { ...bill, creditLimitWarning: wouldExceedLimit },
    { status: 201 }
  );
}
