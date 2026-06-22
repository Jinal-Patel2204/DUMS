import { z } from 'zod';

export const shopInfoSchema = z.object({
  name: z.string().min(2, 'Shop name is required'),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
});
export type ShopInfoInput = z.infer<typeof shopInfoSchema>;

export const paymentConfigSchema = z.object({
  upi_id: z.string().optional().or(z.literal('')),
  upi_display_name: z.string().optional().or(z.literal('')),
  bank_name: z.string().optional().or(z.literal('')),
  bank_account_number: z.string().optional().or(z.literal('')),
  bank_ifsc_code: z.string().optional().or(z.literal('')),
  bank_account_holder: z.string().optional().or(z.literal('')),
  is_cash_enabled: z.boolean().default(true),
  is_upi_enabled: z.boolean().default(false),
  is_bank_transfer_enabled: z.boolean().default(false),
});
export type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;

export const smtpConfigSchema = z.object({
  provider: z.enum(['custom', 'resend', 'sendgrid']).default('resend'),
  host: z.string().optional().or(z.literal('')),
  port: z.preprocess((v) => (v === '' ? null : Number(v)), z.number().nullable().optional()),
  username: z.string().optional().or(z.literal('')),
  password_encrypted: z.string().optional().or(z.literal('')),
  from_name: z.string().min(1, 'From name required'),
  from_email: z.string().email('Invalid email'),
  api_key_encrypted: z.string().optional().or(z.literal('')),
});
export type SmtpConfigInput = z.infer<typeof smtpConfigSchema>;

export const notificationConfigSchema = z.object({
  email_enabled: z.boolean().default(false),
  push_enabled: z.boolean().default(false),
  whatsapp_enabled: z.boolean().default(false),
  sms_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().default('21:00'),
  quiet_hours_end: z.string().default('09:00'),
});
export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>;

export const reminderRuleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  trigger_type: z.enum(['before_due', 'on_due_date', 'after_overdue']),
  days_offset: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0)),
  repeat_frequency: z.enum(['daily', 'every_3_days', 'weekly', 'biweekly']).nullable().optional(),
  repeat_max_count: z.preprocess((v) => (v === '' || v === null ? null : Number(v)), z.number().nullable().optional()),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  message_template: z.string().min(5, 'Message template required'),
  is_active: z.boolean().default(true),
});
export type ReminderRuleInput = z.infer<typeof reminderRuleSchema>;

export const scheduledReportSchema = z.object({
  report_type: z.enum(['credit', 'payment', 'customer', 'product', 'overdue', 'profit_loss', 'inventory', 'emi']),
  frequency: z.enum(['weekly', 'monthly']),
  format: z.enum(['pdf', 'csv', 'excel']).default('pdf'),
  recipient_emails: z.string().min(5, 'Add at least one email'),
  day_of_week: z.preprocess((v) => (v === '' || v === null ? null : Number(v)), z.number().nullable().optional()),
  day_of_month: z.preprocess((v) => (v === '' || v === null ? null : Number(v)), z.number().nullable().optional()),
  time_of_day: z.string().default('08:00'),
  is_active: z.boolean().default(true),
});
export type ScheduledReportInput = z.infer<typeof scheduledReportSchema>;
