import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Use backend API: GET /api/bills/store/{storeId}' }, { status: 501 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Use backend API: POST /api/bills' }, { status: 501 });
}
