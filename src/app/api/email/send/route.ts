import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, from_name, from_email } = body;

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: 'Missing to or subject' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${from_name || 'DUMS'} <${from_email || 'onboarding@resend.dev'}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || `<p>${subject}</p>`,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}
