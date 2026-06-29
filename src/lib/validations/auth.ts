import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  full_name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone cannot exceed 15 digits')
    .regex(/^\d+$/, 'Phone must contain only digits'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirm_password: z.string(),
  accept_terms: z.literal(true, { message: 'You must accept the terms and conditions' }),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
}).refine((data) => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
