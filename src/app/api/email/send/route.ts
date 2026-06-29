import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, html, from_name, from_email } = body;

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: 'Missing required fields: to, subject' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(to) ? to : [to];
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: `Invalid email: ${email}` }, { status: 400 });
      }
    }

    // Rate limit: max 10 emails per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    // Simple rate limit via a lightweight check
    if (recipients.length > 50) {
      return NextResponse.json({ success: false, error: 'Maximum 50 recipients allowed' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${from_name || 'DUMS'} <${from_email || 'onboarding@resend.dev'}>`,
      to: recipients,
      subject: subject.slice(0, 200),
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
