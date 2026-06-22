import { z } from 'zod';

export const billItemSchema = z.object({
  product_id: z.string().uuid('Select a product'),
  description: z.string().min(1, 'Description required'),
  quantity: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0.001, 'Quantity must be > 0')
  ),
  unit_price: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'Price must be >= 0')
  ),
  discount_percent: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0).max(100)
  ),
});

export const createBillSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  notes: z.string().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  items: z.array(billItemSchema).min(1, 'Add at least one item'),
});

export type BillItemInput = z.infer<typeof billItemSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
