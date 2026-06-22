import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const search = request.nextUrl.searchParams.get('search') || '';

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
