import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1, 'Product code is required'),
  name: z.string().min(2, 'Product name is required'),
  category_id: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  purchase_price: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0, 'Must be >= 0')),
  selling_price: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0, 'Must be >= 0')),
  discount_percent: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0).max(100)),
  unit: z.string().min(1, 'Unit is required').default('pcs'),
  stock_quantity: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0, 'Must be >= 0')),
  low_stock_threshold: z.preprocess((v) => (v === '' ? 5 : Number(v)), z.number().min(0)),
});

export type ProductInput = z.infer<typeof productSchema>;

export const purchaseEntrySchema = z.object({
  product_id: z.string().uuid('Select a product'),
  quantity: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().positive('Quantity must be > 0')),
  purchase_price_per_unit: z.preprocess((v) => (v === '' ? 0 : Number(v)), z.number().min(0)),
  supplier_name: z.string().optional().or(z.literal('')),
  invoice_number: z.string().optional().or(z.literal('')),
  purchase_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional().or(z.literal('')),
});

export type PurchaseEntryInput = z.infer<typeof purchaseEntrySchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().or(z.literal('')),
});

export type CategoryInput = z.infer<typeof categorySchema>;
