import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Use backend API: GET /api/products/store/{storeId}' }, { status: 501 });
}
