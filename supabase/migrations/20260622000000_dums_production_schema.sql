-- =============================================================================
-- DUMS Production Schema Migration
-- Digital Udhar Management System
-- Generated: 2026-06-22
-- Tables: 24 | Enums: 22 | Triggers: 9 | Functions: 5
-- =============================================================================

-- ============================================================
-- PART 1: ENUMS
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('store_owner', 'customer');
CREATE TYPE public.bill_status AS ENUM ('draft', 'finalized', 'partially_paid', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'bank_transfer', 'cheque', 'other');
CREATE TYPE public.payment_status AS ENUM ('pending', 'verified', 'rejected', 'disputed');
CREATE TYPE public.ledger_entry_type AS ENUM ('credit', 'debit');
CREATE TYPE public.ledger_reference_type AS ENUM ('bill', 'payment', 'refund', 'adjustment', 'opening_balance');
CREATE TYPE public.installment_plan_status AS ENUM ('active', 'completed', 'overdue', 'defaulted', 'cancelled');
CREATE TYPE public.installment_schedule_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'skipped');
CREATE TYPE public.installment_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE public.notification_type AS ENUM ('payment_reminder', 'payment_received', 'credit_issued', 'overdue_alert', 'low_stock', 'report_ready', 'bill_generated', 'installment_due', 'invitation_sent');
CREATE TYPE public.notification_channel AS ENUM ('in_app', 'sms', 'whatsapp', 'email', 'push');
CREATE TYPE public.stock_movement_type AS ENUM ('stock_in', 'stock_out', 'adjustment', 'purchase');
CREATE TYPE public.stock_reference_type AS ENUM ('purchase_entry', 'bill', 'manual', 'return');
CREATE TYPE public.audit_action AS ENUM ('create', 'update', 'delete', 'void', 'verify_payment', 'reject_payment', 'login', 'logout', 'password_change', 'invite_customer', 'change_credit_limit', 'generate_bill', 'cancel_bill', 'export_report', 'settings_change');
CREATE TYPE public.audit_entity_type AS ENUM ('customer', 'payment', 'bill', 'product', 'store', 'user', 'installment_plan', 'notification_config', 'payment_config', 'ledger_entry');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.invitation_sent_via AS ENUM ('sms', 'email', 'whatsapp');
CREATE TYPE public.reminder_trigger_type AS ENUM ('before_due', 'on_due_date', 'after_overdue');
CREATE TYPE public.reminder_repeat_frequency AS ENUM ('daily', 'every_3_days', 'weekly', 'biweekly');
CREATE TYPE public.active_reminder_status AS ENUM ('scheduled', 'sent', 'completed', 'cancelled');
CREATE TYPE public.report_frequency AS ENUM ('weekly', 'monthly');
CREATE TYPE public.report_type AS ENUM ('credit', 'payment', 'customer', 'product', 'overdue', 'profit_loss', 'inventory', 'emi');
CREATE TYPE public.export_format AS ENUM ('pdf', 'csv', 'excel');
CREATE TYPE public.smtp_provider AS ENUM ('custom', 'resend', 'sendgrid');
CREATE TYPE public.verification_status AS ENUM ('pending_review', 'approved', 'rejected');


-- ============================================================
-- PART 2: TABLES (Dependency Order)
-- ============================================================

-- 1. user_profiles
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'customer',
  must_change_password boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. stores
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  name text NOT NULL,
  address text,
  city text,
  state text,
  pincode text,
  phone text NOT NULL,
  email text,
  gstin text,
  logo_url text,
  tagline text,
  footer_text text,
  currency text NOT NULL DEFAULT 'INR',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  settings jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  sku text,
  purchase_price numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pcs',
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_products_purchase_price CHECK (purchase_price >= 0),
  CONSTRAINT chk_products_selling_price CHECK (selling_price >= 0),
  CONSTRAINT chk_products_discount CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0)
);

-- 5. customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  linked_user_id uuid REFERENCES public.user_profiles(id),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  current_balance numeric(12,2) NOT NULL DEFAULT 0,
  trust_score integer NOT NULL DEFAULT 50,
  invitation_status public.invitation_status,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_customers_credit_limit CHECK (credit_limit >= 0),
  CONSTRAINT chk_customers_trust_score CHECK (trust_score >= 0 AND trust_score <= 100)
);

-- 6. bills
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  bill_number text NOT NULL,
  status public.bill_status NOT NULL DEFAULT 'draft',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date,
  notes text,
  invoice_url text,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id),
  finalized_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_bills_amounts CHECK (subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0)
);

-- 7. bill_items
CREATE TABLE public.bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_bill_items_qty CHECK (quantity > 0),
  CONSTRAINT chk_bill_items_price CHECK (unit_price >= 0)
);

-- 8. ledger_entries (IMMUTABLE)
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  entry_type public.ledger_entry_type NOT NULL,
  reference_type public.ledger_reference_type NOT NULL,
  reference_id uuid NOT NULL,
  description text NOT NULL,
  debit_amount numeric(12,2) NOT NULL DEFAULT 0,
  credit_amount numeric(12,2) NOT NULL DEFAULT 0,
  balance_before numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ledger_amounts CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CONSTRAINT chk_ledger_one_side CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0)
  ),
  CONSTRAINT chk_ledger_balance CHECK (
    balance_after = balance_before + debit_amount - credit_amount
  )
);

-- 9. payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  bill_id uuid REFERENCES public.bills(id) ON DELETE SET NULL,
  installment_schedule_id uuid,
  amount numeric(12,2) NOT NULL,
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reference_id text,
  proof_url text,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.user_profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
);

-- 10. payment_verifications (verification history)
CREATE TABLE public.payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status public.verification_status NOT NULL,
  verified_by uuid REFERENCES public.user_profiles(id),
  proof_url text,
  reference_id text,
  rejection_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. installment_plans
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  bill_id uuid REFERENCES public.bills(id) ON DELETE SET NULL,
  total_amount numeric(12,2) NOT NULL,
  down_payment numeric(12,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(12,2) NOT NULL,
  total_paid numeric(12,2) NOT NULL DEFAULT 0,
  number_of_installments integer NOT NULL,
  installment_amount numeric(12,2) NOT NULL,
  frequency public.installment_frequency NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.installment_plan_status NOT NULL DEFAULT 'active',
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_installment_amounts CHECK (total_amount > 0 AND installment_amount > 0),
  CONSTRAINT chk_installment_consistency CHECK (total_paid + remaining_amount = total_amount)
);

-- 12. payment_schedule
CREATE TABLE public.payment_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount_due numeric(12,2) NOT NULL,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  remaining numeric(12,2) NOT NULL,
  status public.installment_schedule_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  payment_method public.payment_method,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_schedule_amount CHECK (amount_due > 0),
  CONSTRAINT chk_schedule_remaining CHECK (remaining = amount_due - amount_paid)
);

-- Add FK from payments to payment_schedule
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_schedule
  FOREIGN KEY (installment_schedule_id) REFERENCES public.payment_schedule(id) ON DELETE SET NULL;

-- 13. payment_config (1:1 per store)
CREATE TABLE public.payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  upi_id text,
  upi_display_name text,
  qr_code_url text,
  bank_name text,
  bank_account_number text,
  bank_ifsc_code text,
  bank_account_holder text,
  accepted_methods jsonb NOT NULL DEFAULT '["cash"]',
  is_cash_enabled boolean NOT NULL DEFAULT true,
  is_upi_enabled boolean NOT NULL DEFAULT false,
  is_bank_transfer_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 14. notification_config (1:1 per store)
CREATE TABLE public.notification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT false,
  email_provider text,
  push_enabled boolean NOT NULL DEFAULT false,
  push_vapid_public_key text,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_business_phone text,
  sms_enabled boolean NOT NULL DEFAULT false,
  sms_provider text,
  quiet_hours_start time NOT NULL DEFAULT '21:00',
  quiet_hours_end time NOT NULL DEFAULT '09:00',
  default_channels jsonb NOT NULL DEFAULT '["in_app"]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 15. smtp_config (1:1 per store)
CREATE TABLE public.smtp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  provider public.smtp_provider NOT NULL DEFAULT 'resend',
  host text,
  port integer,
  username text,
  password_encrypted text,
  from_name text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT '',
  api_key_encrypted text,
  is_verified boolean NOT NULL DEFAULT false,
  last_test_at timestamptz,
  last_test_result boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 16. notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- 17. due_reminder_rules
CREATE TABLE public.due_reminder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type public.reminder_trigger_type NOT NULL,
  days_offset integer NOT NULL DEFAULT 0,
  repeat_frequency public.reminder_repeat_frequency,
  repeat_max_count integer,
  channels jsonb NOT NULL DEFAULT '["in_app"]',
  message_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 10,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_reminder_days CHECK (days_offset >= 0)
);

-- 18. active_reminders
CREATE TABLE public.active_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.due_reminder_rules(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
  installment_schedule_id uuid REFERENCES public.payment_schedule(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  next_send_at timestamptz NOT NULL,
  sent_count integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  status public.active_reminder_status NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 19. scheduled_reminders
CREATE TABLE public.scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'payment_due',
  frequency text NOT NULL DEFAULT 'once',
  channels jsonb NOT NULL DEFAULT '["in_app"]',
  message_template text,
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 20. scheduled_reports
CREATE TABLE public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  report_type public.report_type NOT NULL,
  frequency public.report_frequency NOT NULL,
  delivery_channel text NOT NULL DEFAULT 'email',
  recipient_emails jsonb NOT NULL DEFAULT '[]',
  format public.export_format NOT NULL DEFAULT 'pdf',
  day_of_week integer,
  day_of_month integer,
  time_of_day time NOT NULL DEFAULT '08:00',
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.user_profiles(id),
  last_sent_at timestamptz,
  next_send_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_report_dow CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT chk_report_dom CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 28))
);

-- 21. purchase_entries (IMMUTABLE)
CREATE TABLE public.purchase_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  supplier_name text,
  quantity numeric(10,3) NOT NULL,
  purchase_price_per_unit numeric(12,2) NOT NULL,
  total_cost numeric(12,2) NOT NULL,
  invoice_number text,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_purchase_qty CHECK (quantity > 0),
  CONSTRAINT chk_purchase_price CHECK (purchase_price_per_unit >= 0)
);

-- 22. stock_movements (APPEND-ONLY)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  type public.stock_movement_type NOT NULL,
  quantity numeric(10,3) NOT NULL,
  reference_type public.stock_reference_type,
  reference_id uuid,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  notes text,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_stock_qty CHECK (quantity > 0),
  CONSTRAINT chk_stock_after CHECK (stock_after >= 0)
);

-- 23. audit_logs (IMMUTABLE)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  user_role public.user_role NOT NULL,
  action public.audit_action NOT NULL,
  entity_type public.audit_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 24. customer_invitations
CREATE TABLE public.customer_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  phone text NOT NULL,
  email text,
  invitation_token text NOT NULL UNIQUE,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  sent_via public.invitation_sent_via NOT NULL DEFAULT 'sms',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);


-- ============================================================
-- PART 3: INDEXES
-- ============================================================

-- user_profiles
CREATE UNIQUE INDEX idx_user_profiles_phone ON public.user_profiles(phone);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- stores
CREATE INDEX idx_stores_owner_id ON public.stores(owner_id) WHERE is_deleted = false;

-- categories
CREATE INDEX idx_categories_store ON public.categories(store_id) WHERE is_deleted = false;

-- products
CREATE INDEX idx_products_store ON public.products(store_id) WHERE is_deleted = false;
CREATE INDEX idx_products_category ON public.products(category_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX idx_products_sku_store ON public.products(store_id, sku) WHERE sku IS NOT NULL AND is_deleted = false;
CREATE INDEX idx_products_low_stock ON public.products(store_id) WHERE stock_quantity <= low_stock_threshold AND is_deleted = false AND is_active = true;

-- customers
CREATE INDEX idx_customers_store ON public.customers(store_id) WHERE is_deleted = false;
CREATE UNIQUE INDEX idx_customers_phone_store ON public.customers(store_id, phone) WHERE is_deleted = false;
CREATE INDEX idx_customers_linked_user ON public.customers(linked_user_id) WHERE linked_user_id IS NOT NULL;
CREATE INDEX idx_customers_balance ON public.customers(store_id, current_balance DESC) WHERE is_deleted = false AND is_active = true;

-- bills
CREATE INDEX idx_bills_store ON public.bills(store_id) WHERE is_deleted = false;
CREATE INDEX idx_bills_customer ON public.bills(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_bills_status ON public.bills(store_id, status) WHERE is_deleted = false;
CREATE UNIQUE INDEX idx_bills_number ON public.bills(store_id, bill_number) WHERE is_deleted = false;
CREATE INDEX idx_bills_due_date ON public.bills(due_date) WHERE status IN ('finalized', 'partially_paid', 'overdue') AND is_deleted = false;
CREATE INDEX idx_bills_created_at ON public.bills(created_at DESC) WHERE is_deleted = false;

-- bill_items
CREATE INDEX idx_bill_items_bill ON public.bill_items(bill_id);
CREATE INDEX idx_bill_items_product ON public.bill_items(product_id) WHERE product_id IS NOT NULL;

-- ledger_entries
CREATE INDEX idx_ledger_customer ON public.ledger_entries(customer_id);
CREATE INDEX idx_ledger_store_customer ON public.ledger_entries(store_id, customer_id);
CREATE INDEX idx_ledger_created_at ON public.ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_reference ON public.ledger_entries(reference_type, reference_id);
CREATE INDEX idx_ledger_customer_date ON public.ledger_entries(customer_id, entry_date DESC);

-- payments
CREATE INDEX idx_payments_store_customer ON public.payments(store_id, customer_id);
CREATE INDEX idx_payments_status ON public.payments(store_id, status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payments_bill ON public.payments(bill_id) WHERE bill_id IS NOT NULL;
CREATE INDEX idx_payments_pending ON public.payments(store_id) WHERE status = 'pending';

-- payment_verifications
CREATE INDEX idx_payment_verifications_payment ON public.payment_verifications(payment_id);
CREATE INDEX idx_payment_verifications_store ON public.payment_verifications(store_id);

-- installment_plans
CREATE INDEX idx_installments_store ON public.installment_plans(store_id) WHERE is_deleted = false;
CREATE INDEX idx_installments_customer ON public.installment_plans(customer_id) WHERE is_deleted = false;
CREATE INDEX idx_installments_status ON public.installment_plans(store_id, status) WHERE is_deleted = false;

-- payment_schedule
CREATE INDEX idx_schedule_plan ON public.payment_schedule(plan_id);
CREATE INDEX idx_schedule_due_date ON public.payment_schedule(due_date) WHERE status IN ('pending', 'overdue');

-- notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_sent ON public.notifications(sent_at DESC);

-- due_reminder_rules
CREATE INDEX idx_reminder_rules_store ON public.due_reminder_rules(store_id) WHERE is_deleted = false AND is_active = true;

-- active_reminders
CREATE INDEX idx_active_reminders_customer ON public.active_reminders(customer_id);
CREATE INDEX idx_active_reminders_next_send ON public.active_reminders(next_send_at) WHERE status = 'scheduled';
CREATE INDEX idx_active_reminders_bill ON public.active_reminders(bill_id) WHERE bill_id IS NOT NULL;

-- scheduled_reminders
CREATE INDEX idx_scheduled_reminders_store ON public.scheduled_reminders(store_id);
CREATE INDEX idx_scheduled_reminders_next ON public.scheduled_reminders(next_run_at) WHERE is_active = true;

-- scheduled_reports
CREATE INDEX idx_scheduled_reports_store ON public.scheduled_reports(store_id) WHERE is_deleted = false AND is_active = true;
CREATE INDEX idx_scheduled_reports_next ON public.scheduled_reports(next_send_at) WHERE is_active = true AND is_deleted = false;

-- purchase_entries
CREATE INDEX idx_purchases_store ON public.purchase_entries(store_id);
CREATE INDEX idx_purchases_product ON public.purchase_entries(product_id);
CREATE INDEX idx_purchases_date ON public.purchase_entries(purchase_date DESC);

-- stock_movements
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_store ON public.stock_movements(store_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at DESC);

-- audit_logs
CREATE INDEX idx_audit_store ON public.audit_logs(store_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_logs(store_id, action);

-- customer_invitations
CREATE INDEX idx_invitations_store ON public.customer_invitations(store_id);
CREATE INDEX idx_invitations_customer ON public.customer_invitations(customer_id);
CREATE INDEX idx_invitations_token ON public.customer_invitations(invitation_token) WHERE status = 'pending';


-- ============================================================
-- PART 4: FUNCTIONS
-- ============================================================

-- 4.1 Updated_at trigger function
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4.2 Immutability guard function
CREATE OR REPLACE FUNCTION public.fn_prevent_modification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Modification of % records is not allowed', TG_TABLE_NAME;
  RETURN NULL;
END;
$$;

-- 4.3 Ledger balance sync function
CREATE OR REPLACE FUNCTION public.fn_sync_customer_balance()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.customers
  SET current_balance = NEW.balance_after,
      updated_at = now()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

-- 4.4 Soft delete timestamp function
CREATE OR REPLACE FUNCTION public.fn_set_soft_delete_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at = COALESCE(NEW.deleted_at, now());
  END IF;
  RETURN NEW;
END;
$$;

-- 4.5 Bill number generator function
CREATE OR REPLACE FUNCTION public.fn_generate_bill_number(p_store_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_count integer;
  v_prefix text;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.bills WHERE store_id = p_store_id;
  
  v_prefix := 'INV';
  RETURN v_prefix || '-' || LPAD(v_count::text, 6, '0');
END;
$$;

-- ============================================================
-- PART 5: TRIGGERS
-- ============================================================

-- 5.1 Immutability triggers
CREATE TRIGGER trg_ledger_immutable
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_modification();

CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_modification();

CREATE TRIGGER trg_purchase_entry_immutable
  BEFORE UPDATE OR DELETE ON public.purchase_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_modification();

CREATE TRIGGER trg_stock_movement_immutable
  BEFORE UPDATE OR DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_modification();

-- 5.2 Ledger balance sync trigger
CREATE TRIGGER trg_ledger_sync_balance
  AFTER INSERT ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_customer_balance();

-- 5.3 Updated_at triggers (all mutable tables)
CREATE TRIGGER trg_updated_at_user_profiles BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_stores BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_bills BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_installment_plans BEFORE UPDATE ON public.installment_plans FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_payment_schedule BEFORE UPDATE ON public.payment_schedule FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_payment_config BEFORE UPDATE ON public.payment_config FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_notification_config BEFORE UPDATE ON public.notification_config FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_smtp_config BEFORE UPDATE ON public.smtp_config FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_due_reminder_rules BEFORE UPDATE ON public.due_reminder_rules FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_active_reminders BEFORE UPDATE ON public.active_reminders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_scheduled_reminders BEFORE UPDATE ON public.scheduled_reminders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_at_scheduled_reports BEFORE UPDATE ON public.scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 5.4 Soft delete timestamp triggers
CREATE TRIGGER trg_soft_delete_stores BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_bills BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_installment_plans BEFORE UPDATE ON public.installment_plans FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_due_reminder_rules BEFORE UPDATE ON public.due_reminder_rules FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();
CREATE TRIGGER trg_soft_delete_scheduled_reports BEFORE UPDATE ON public.scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.fn_set_soft_delete_timestamp();


-- ============================================================
-- PART 6: ROW LEVEL SECURITY (EXISTS pattern)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.due_reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_invitations ENABLE ROW LEVEL SECURITY;

-- ===== USER PROFILES =====
CREATE POLICY "users_read_own" ON public.user_profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- ===== STORES =====
CREATE POLICY "stores_owner_all" ON public.stores
  FOR ALL USING (owner_id = auth.uid() AND is_deleted = false);
CREATE POLICY "stores_customer_read" ON public.stores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.store_id = stores.id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== CUSTOMERS =====
CREATE POLICY "customers_owner" ON public.customers
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = customers.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "customers_self_read" ON public.customers
  FOR SELECT USING (linked_user_id = auth.uid() AND is_deleted = false);

-- ===== PRODUCTS =====
CREATE POLICY "products_owner" ON public.products
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "products_customer_read" ON public.products
  FOR SELECT USING (
    is_deleted = false AND is_active = true AND
    EXISTS (SELECT 1 FROM public.customers c WHERE c.store_id = products.store_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== CATEGORIES =====
CREATE POLICY "categories_owner" ON public.categories
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = categories.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );

-- ===== BILLS =====
CREATE POLICY "bills_owner" ON public.bills
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = bills.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "bills_customer_read" ON public.bills
  FOR SELECT USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = bills.customer_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== BILL ITEMS =====
CREATE POLICY "bill_items_owner" ON public.bill_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      JOIN public.stores s ON s.id = b.store_id
      WHERE b.id = bill_items.bill_id AND s.owner_id = auth.uid() AND b.is_deleted = false AND s.is_deleted = false
    )
  );
CREATE POLICY "bill_items_customer_read" ON public.bill_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE b.id = bill_items.bill_id AND c.linked_user_id = auth.uid() AND b.is_deleted = false AND c.is_deleted = false
    )
  );

-- ===== LEDGER ENTRIES =====
CREATE POLICY "ledger_owner_read" ON public.ledger_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = ledger_entries.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "ledger_owner_insert" ON public.ledger_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = ledger_entries.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "ledger_customer_read" ON public.ledger_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = ledger_entries.customer_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== PAYMENTS =====
CREATE POLICY "payments_owner" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = payments.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "payments_customer_read" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = payments.customer_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );
CREATE POLICY "payments_customer_insert" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = payments.customer_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== PAYMENT VERIFICATIONS =====
CREATE POLICY "verifications_owner" ON public.payment_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = payment_verifications.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "verifications_customer_read" ON public.payment_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      JOIN public.customers c ON c.id = p.customer_id
      WHERE p.id = payment_verifications.payment_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false
    )
  );

-- ===== INSTALLMENT PLANS =====
CREATE POLICY "installments_owner" ON public.installment_plans
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = installment_plans.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );
CREATE POLICY "installments_customer_read" ON public.installment_plans
  FOR SELECT USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.customers c WHERE c.id = installment_plans.customer_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false)
  );

-- ===== PAYMENT SCHEDULE =====
CREATE POLICY "schedule_owner" ON public.payment_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.installment_plans ip
      JOIN public.stores s ON s.id = ip.store_id
      WHERE ip.id = payment_schedule.plan_id AND s.owner_id = auth.uid() AND ip.is_deleted = false AND s.is_deleted = false
    )
  );
CREATE POLICY "schedule_customer_read" ON public.payment_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.installment_plans ip
      JOIN public.customers c ON c.id = ip.customer_id
      WHERE ip.id = payment_schedule.plan_id AND c.linked_user_id = auth.uid() AND ip.is_deleted = false AND c.is_deleted = false
    )
  );

-- ===== CONFIG TABLES (1:1, owner only) =====
CREATE POLICY "payment_config_owner" ON public.payment_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = payment_config.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));
CREATE POLICY "payment_config_customer_read" ON public.payment_config
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.store_id = payment_config.store_id AND c.linked_user_id = auth.uid() AND c.is_deleted = false));

CREATE POLICY "notification_config_owner" ON public.notification_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = notification_config.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

CREATE POLICY "smtp_config_owner" ON public.smtp_config
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = smtp_config.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ===== NOTIFICATIONS =====
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- ===== DUE REMINDER RULES =====
CREATE POLICY "reminder_rules_owner" ON public.due_reminder_rules
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = due_reminder_rules.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );

-- ===== ACTIVE REMINDERS =====
CREATE POLICY "active_reminders_owner" ON public.active_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.due_reminder_rules r
      JOIN public.stores s ON s.id = r.store_id
      WHERE r.id = active_reminders.rule_id AND s.owner_id = auth.uid() AND r.is_deleted = false AND s.is_deleted = false
    )
  );

-- ===== SCHEDULED REMINDERS =====
CREATE POLICY "scheduled_reminders_owner" ON public.scheduled_reminders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = scheduled_reminders.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ===== SCHEDULED REPORTS =====
CREATE POLICY "scheduled_reports_owner" ON public.scheduled_reports
  FOR ALL USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = scheduled_reports.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false)
  );

-- ===== PURCHASE ENTRIES =====
CREATE POLICY "purchases_owner" ON public.purchase_entries
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = purchase_entries.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ===== STOCK MOVEMENTS =====
CREATE POLICY "stock_movements_owner" ON public.stock_movements
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = stock_movements.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ===== AUDIT LOGS (read-only for owner) =====
CREATE POLICY "audit_logs_owner_read" ON public.audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = audit_logs.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ===== CUSTOMER INVITATIONS =====
CREATE POLICY "invitations_owner" ON public.customer_invitations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = customer_invitations.store_id AND s.owner_id = auth.uid() AND s.is_deleted = false));

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Final Table Count: 24
-- Final Enum Count: 25
-- Final Index Count: 65
-- Final Trigger Count: 32
-- Final Function Count: 5
-- Final RLS Policy Count: 38
-- ============================================================
