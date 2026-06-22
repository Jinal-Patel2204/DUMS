import { z } from 'zod';

export const COUNTRY_CODES = [
  { code: '+91', country: 'India', maxDigits: 10 },
  { code: '+1', country: 'USA/Canada', maxDigits: 10 },
  { code: '+44', country: 'UK', maxDigits: 10 },
  { code: '+61', country: 'Australia', maxDigits: 9 },
  { code: '+971', country: 'UAE', maxDigits: 9 },
  { code: '+966', country: 'Saudi Arabia', maxDigits: 9 },
  { code: '+65', country: 'Singapore', maxDigits: 8 },
  { code: '+60', country: 'Malaysia', maxDigits: 10 },
  { code: '+977', country: 'Nepal', maxDigits: 10 },
  { code: '+92', country: 'Pakistan', maxDigits: 10 },
  { code: '+880', country: 'Bangladesh', maxDigits: 10 },
  { code: '+94', country: 'Sri Lanka', maxDigits: 9 },
];

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  country_code: z.string().default('+91'),
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .max(10, 'Phone cannot exceed 10 digits')
    .regex(/^\d+$/, 'Phone must contain only digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  credit_limit: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, 'Credit limit must be >= 0')
  ),
});

export type CustomerInput = z.infer<typeof customerSchema>;
