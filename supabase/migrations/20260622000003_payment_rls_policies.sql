-- ============================================================
-- Payment Module RLS Policies
-- Run in Supabase SQL Editor
-- ============================================================

-- Payments: Owner full access
DROP POLICY IF EXISTS payments_owner_all ON public.payments;
DROP POLICY IF EXISTS payments_owner_select ON public.payments;
DROP POLICY IF EXISTS payments_owner_insert ON public.payments;
DROP POLICY IF EXISTS payments_owner_update ON public.payments;

CREATE POLICY payments_owner_select ON public.payments
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY payments_owner_insert ON public.payments
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY payments_owner_update ON public.payments
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Payments: Customer can insert own payments
CREATE POLICY payments_customer_insert ON public.payments
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM public.customers WHERE linked_user_id = auth.uid())
  );

-- Payments: Customer can read own payments
CREATE POLICY payments_customer_read ON public.payments
  FOR SELECT USING (
    customer_id IN (SELECT id FROM public.customers WHERE linked_user_id = auth.uid())
  );

-- Payment Verifications: Owner access
DROP POLICY IF EXISTS verifications_owner ON public.payment_verifications;

CREATE POLICY verifications_owner_select ON public.payment_verifications
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY verifications_owner_insert ON public.payment_verifications
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Ledger Entries: Owner insert + read
DROP POLICY IF EXISTS ledger_owner_read ON public.ledger_entries;
DROP POLICY IF EXISTS ledger_owner_insert ON public.ledger_entries;
DROP POLICY IF EXISTS ledger_customer_read ON public.ledger_entries;

CREATE POLICY ledger_owner_select ON public.ledger_entries
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY ledger_owner_insert ON public.ledger_entries
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Payment Config: Owner CRUD + Customer read
DROP POLICY IF EXISTS payment_config_owner ON public.payment_config;
DROP POLICY IF EXISTS payment_config_customer_read ON public.payment_config;

CREATE POLICY payment_config_owner_all ON public.payment_config
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY payment_config_customer_read ON public.payment_config
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM public.customers WHERE linked_user_id = auth.uid() AND is_deleted = false)
  );
