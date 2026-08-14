import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Email service not configured' }, { status: 501 });
}
