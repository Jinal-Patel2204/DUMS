import { createClient } from '@/lib/supabase/client';

type NotificationType = 'payment_reminder' | 'payment_received' | 'credit_issued' | 'overdue_alert' | 'low_stock' | 'report_ready' | 'bill_generated' | 'installment_due' | 'invitation_sent';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = createClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    channel: 'in_app',
    title: params.title,
    body: params.body,
    data: params.data || null,
  });
  return { error };
}

export async function notifyBillCreated(ownerId: string, customerUserId: string | null, billNumber: string, amount: number, customerName: string) {
  // Notify owner
  await createNotification({
    userId: ownerId,
    type: 'bill_generated',
    title: 'New Bill Created',
    body: `Bill ${billNumber} for ₹${amount.toLocaleString('en-IN')} created for ${customerName}`,
    data: { billNumber, amount, customerName },
  });
  // Notify customer if linked
  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: 'credit_issued',
      title: 'New Bill',
      body: `A bill of ₹${amount.toLocaleString('en-IN')} (${billNumber}) has been generated for you`,
      data: { billNumber, amount },
    });
  }
}

export async function notifyPaymentSubmitted(ownerId: string, customerName: string, amount: number, method: string) {
  await createNotification({
    userId: ownerId,
    type: 'payment_received',
    title: 'Payment Submitted',
    body: `${customerName} submitted ₹${amount.toLocaleString('en-IN')} via ${method}. Awaiting verification.`,
    data: { customerName, amount, method },
  });
}

export async function notifyPaymentApproved(customerUserId: string, amount: number) {
  await createNotification({
    userId: customerUserId,
    type: 'payment_received',
    title: 'Payment Approved',
    body: `Your payment of ₹${amount.toLocaleString('en-IN')} has been verified and approved.`,
    data: { amount },
  });
}

export async function notifyPaymentRejected(customerUserId: string, amount: number, reason?: string) {
  await createNotification({
    userId: customerUserId,
    type: 'payment_received',
    title: 'Payment Rejected',
    body: `Your payment of ₹${amount.toLocaleString('en-IN')} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
    data: { amount, reason },
  });
}

export async function notifyDueReminder(customerUserId: string, billNumber: string, amount: number, dueDate: string, daysUntilDue: number) {
  const urgency = daysUntilDue <= 0 ? 'overdue' : daysUntilDue <= 1 ? 'due tomorrow' : `due in ${daysUntilDue} days`;
  await createNotification({
    userId: customerUserId,
    type: daysUntilDue <= 0 ? 'overdue_alert' : 'payment_reminder',
    title: daysUntilDue <= 0 ? 'Overdue Bill' : 'Payment Reminder',
    body: `Bill ${billNumber} (₹${amount.toLocaleString('en-IN')}) is ${urgency}. Due: ${dueDate}`,
    data: { billNumber, amount, dueDate, daysUntilDue },
  });
}

export async function notifyInstallmentDue(customerUserId: string, installmentNumber: number, amount: number, dueDate: string) {
  await createNotification({
    userId: customerUserId,
    type: 'installment_due',
    title: 'Installment Due',
    body: `Installment #${installmentNumber} of ₹${amount.toLocaleString('en-IN')} is due on ${dueDate}`,
    data: { installmentNumber, amount, dueDate },
  });
}
