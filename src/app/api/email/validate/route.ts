import { NextRequest, NextResponse } from 'next/server';

// Basic email validation + MX record check via DNS
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ valid: false, error: 'Email is required' }, { status: 400 });
    }

    // Format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ valid: false, error: 'Invalid email format' });
    }

    // Extract domain
    const domain = email.split('@')[1];

    // Check if domain has MX records (real domain check)
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const dnsData = await response.json();

      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return NextResponse.json({ valid: false, error: `Domain "${domain}" does not accept emails (no MX records)` });
      }

      return NextResponse.json({ valid: true, domain, mx_records: dnsData.Answer.length });
    } catch {
      // DNS check failed — still allow (might be network issue)
      return NextResponse.json({ valid: true, domain, mx_records: null, warning: 'Could not verify MX records' });
    }
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
