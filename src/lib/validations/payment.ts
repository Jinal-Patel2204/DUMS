import { z } from 'zod';

export const recordPaymentSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  bill_id: z.string().optional().or(z.literal('')),
  amount: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().positive('Amount must be > 0')),
  method: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other']),
  reference_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const customerPaymentSchema = z.object({
  store_id: z.string().uuid(),
  amount: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().positive('Amount must be > 0')),
  method: z.enum(['upi', 'bank_transfer', 'cheque', 'other']),
  reference_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type CustomerPaymentInput = z.infer<typeof customerPaymentSchema>;

export const rejectPaymentSchema = z.object({
  rejection_reason: z.string().min(3, 'Reason is required'),
});

export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
