import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// This endpoint generates due date reminders for bills
// Can be called by external cron (e.g., Vercel Cron, Supabase pg_cron)
// GET /api/cron/reminders

export async function GET(request: NextRequest) {
  // Simple auth check via secret header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let notificationsCreated = 0;

  // 1. Bill Due Reminders (7 days, 3 days, 1 day before, on due date, overdue)
  const { data: bills } = await supabase
    .from('bills')
    .select('id, bill_number, total_amount, due_date, customer_id, store_id, customers(linked_user_id, name)')
    .eq('is_deleted', false)
    .in('status', ['finalized', 'partially_paid'])
    .not('due_date', 'is', null);

  if (bills) {
    for (const bill of bills) {
      const dueDate = new Date(bill.due_date!);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const customer = bill.customers as any;
      const customerUserId = customer?.linked_user_id;

      // Only generate for specific intervals
      if (![7, 3, 1, 0, -1, -3, -7].includes(diffDays)) continue;
      if (!customerUserId) continue;

      // Check if notification already sent today for this bill
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customerUserId)
        .in('type', ['payment_reminder', 'overdue_alert'])
        .gte('sent_at', `${todayStr}T00:00:00`)
        .contains('data', { billNumber: bill.bill_number });

      if (count && count > 0) continue;

      const isOverdue = diffDays < 0;
      const urgency = isOverdue ? `overdue by ${Math.abs(diffDays)} day(s)` : diffDays === 0 ? 'due today' : `due in ${diffDays} day(s)`;

      await supabase.from('notifications').insert({
        user_id: customerUserId,
        type: isOverdue ? 'overdue_alert' : 'payment_reminder',
        channel: 'in_app',
        title: isOverdue ? 'Overdue Bill' : 'Payment Reminder',
        body: `Bill ${bill.bill_number} (₹${Number(bill.total_amount).toLocaleString('en-IN')}) is ${urgency}.`,
        data: { billNumber: bill.bill_number, amount: bill.total_amount, dueDate: bill.due_date, daysUntilDue: diffDays },
      });
      notificationsCreated++;

      // Also notify owner about overdue
      if (isOverdue) {
        const { data: store } = await supabase.from('stores').select('owner_id').eq('id', bill.store_id).single();
        if (store) {
          await supabase.from('notifications').insert({
            user_id: store.owner_id,
            type: 'overdue_alert',
            channel: 'in_app',
            title: 'Customer Overdue',
            body: `${customer?.name}'s bill ${bill.bill_number} (₹${Number(bill.total_amount).toLocaleString('en-IN')}) is overdue by ${Math.abs(diffDays)} day(s).`,
            data: { billNumber: bill.bill_number, customerName: customer?.name, daysOverdue: Math.abs(diffDays) },
          });
          notificationsCreated++;
        }
      }
    }
  }

  // 2. Mark overdue bills
  await supabase
    .from('bills')
    .update({ status: 'overdue' })
    .eq('is_deleted', false)
    .in('status', ['finalized', 'partially_paid'])
    .lt('due_date', todayStr);

  // 3. Installment Reminders
  const { data: schedules } = await supabase
    .from('payment_schedule')
    .select('id, plan_id, installment_number, due_date, amount_due, installment_plans(customer_id, customers(linked_user_id, name))')
    .in('status', ['pending', 'overdue']);

  if (schedules) {
    for (const sched of schedules) {
      const dueDate = new Date(sched.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (![3, 1, 0, -1].includes(diffDays)) continue;

      const plan = sched.installment_plans as any;
      const customerUserId = plan?.customers?.linked_user_id;
      if (!customerUserId) continue;

      // Dedup check
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', customerUserId)
        .eq('type', 'installment_due')
        .gte('sent_at', `${todayStr}T00:00:00`)
        .contains('data', { installmentNumber: sched.installment_number });

      if (count && count > 0) continue;

      const urgency = diffDays < 0 ? 'overdue' : diffDays === 0 ? 'due today' : `due in ${diffDays} day(s)`;

      await supabase.from('notifications').insert({
        user_id: customerUserId,
        type: 'installment_due',
        channel: 'in_app',
        title: 'Installment Due',
        body: `Installment #${sched.installment_number} (₹${Number(sched.amount_due).toLocaleString('en-IN')}) is ${urgency}.`,
        data: { installmentNumber: sched.installment_number, amount: sched.amount_due, dueDate: sched.due_date },
      });
      notificationsCreated++;

      // Mark overdue installments
      if (diffDays < 0) {
        await supabase.from('payment_schedule').update({ status: 'overdue' }).eq('id', sched.id);
      }
    }
  }

  return NextResponse.json({ success: true, notificationsCreated, date: todayStr });
}
