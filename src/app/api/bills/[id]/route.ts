import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Use backend API: GET /api/bills/{id}' }, { status: 501 });
}
