import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

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
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json(bill);
}
