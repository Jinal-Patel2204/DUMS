import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to_email, from_name, from_email } = body;

    if (!to_email) {
      return NextResponse.json({ success: false, error: 'Recipient email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to_email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${from_name || 'DUMS'} <${from_email || 'onboarding@resend.dev'}>`,
      to: [to_email],
      subject: 'DUMS - SMTP Test Connection',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>✅ SMTP Connection Successful</h2>
          <p>This is a test email from your DUMS (Digital Udhar Management System).</p>
          <p>Your email configuration is working correctly.</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Test email sent to ${to_email}`, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to send test email' }, { status: 500 });
  }
}
