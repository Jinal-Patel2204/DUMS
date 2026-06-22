export type UserRole = 'store_owner' | 'customer';
export type BillStatus = 'draft' | 'finalized' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'disputed';
export type LedgerEntryType = 'credit' | 'debit';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  logo_url: string | null;
  currency: string;
  timezone: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  linked_user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  trust_score: number;
  invitation_status: InvitationStatus | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  purchase_price: number;
  selling_price: number;
  discount_percent: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  store_id: string;
  customer_id: string;
  bill_number: string;
  status: BillStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  due_date: string | null;
  notes: string | null;
  invoice_url: string | null;
  created_by: string;
  finalized_at: string | null;
  cancelled_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  store_id: string;
  customer_id: string;
  bill_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference_id: string | null;
  proof_url: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_price: number;
  sort_order: number;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  store_id: string;
  customer_id: string;
  entry_type: LedgerEntryType;
  reference_type: string;
  reference_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance_before: number;
  balance_after: number;
  entry_date: string;
  created_at: string;
}
