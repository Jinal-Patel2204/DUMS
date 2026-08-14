import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Use backend API: PATCH /api/payments/{id}/status' }, { status: 501 });
}
