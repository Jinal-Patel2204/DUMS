-- ============================================================
-- Audit Log Triggers - Auto-track all changes
-- Run in Supabase SQL Editor
-- ============================================================

-- RLS for audit_logs (read-only for owner, insert via triggers/service)
DROP POLICY IF EXISTS audit_logs_owner_read ON public.audit_logs;
CREATE POLICY audit_logs_owner_read ON public.audit_logs
  FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Allow insert from authenticated users (for client-side audit logging)
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- ============================================================
-- Auto-audit trigger function for customers
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_customers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
    VALUES (NEW.store_id, auth.uid(), 'store_owner', 'create', 'customer', NEW.id,
      jsonb_build_object('after', jsonb_build_object('name', NEW.name, 'phone', NEW.phone, 'credit_limit', NEW.credit_limit)));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if soft delete
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'delete', 'customer', NEW.id,
        jsonb_build_object('before', jsonb_build_object('name', OLD.name)));
    ELSE
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'update', 'customer', NEW.id,
        jsonb_build_object('before', jsonb_build_object('name', OLD.name, 'phone', OLD.phone, 'credit_limit', OLD.credit_limit),
                           'after', jsonb_build_object('name', NEW.name, 'phone', NEW.phone, 'credit_limit', NEW.credit_limit)));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers
  AFTER INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_customers();

-- ============================================================
-- Auto-audit trigger for products
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_products()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
    VALUES (NEW.store_id, auth.uid(), 'store_owner', 'create', 'product', NEW.id,
      jsonb_build_object('after', jsonb_build_object('name', NEW.name, 'sku', NEW.sku, 'selling_price', NEW.selling_price)));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'delete', 'product', NEW.id,
        jsonb_build_object('before', jsonb_build_object('name', OLD.name)));
    ELSE
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'update', 'product', NEW.id,
        jsonb_build_object('before', jsonb_build_object('name', OLD.name, 'selling_price', OLD.selling_price, 'stock_quantity', OLD.stock_quantity),
                           'after', jsonb_build_object('name', NEW.name, 'selling_price', NEW.selling_price, 'stock_quantity', NEW.stock_quantity)));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_products();

-- ============================================================
-- Auto-audit trigger for bills
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_bills()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
    VALUES (NEW.store_id, auth.uid(), 'store_owner', 'create', 'bill', NEW.id,
      jsonb_build_object('after', jsonb_build_object('bill_number', NEW.bill_number, 'total_amount', NEW.total_amount, 'status', NEW.status)));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'finalized' AND OLD.status = 'draft' THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'generate_bill', 'bill', NEW.id,
        jsonb_build_object('before', jsonb_build_object('status', OLD.status), 'after', jsonb_build_object('status', NEW.status, 'total_amount', NEW.total_amount)));
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'cancel_bill', 'bill', NEW.id,
        jsonb_build_object('before', jsonb_build_object('status', OLD.status), 'after', jsonb_build_object('status', 'cancelled')));
    ELSE
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, auth.uid(), 'store_owner', 'update', 'bill', NEW.id,
        jsonb_build_object('before', jsonb_build_object('status', OLD.status, 'total_amount', OLD.total_amount),
                           'after', jsonb_build_object('status', NEW.status, 'total_amount', NEW.total_amount)));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_bills ON public.bills;
CREATE TRIGGER trg_audit_bills
  AFTER INSERT OR UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_bills();

-- ============================================================
-- Auto-audit trigger for payments
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_payments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
    VALUES (NEW.store_id, COALESCE(auth.uid(), NEW.verified_by), 'store_owner', 'create', 'payment', NEW.id,
      jsonb_build_object('after', jsonb_build_object('amount', NEW.amount, 'method', NEW.method, 'status', NEW.status)));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'verified' AND OLD.status = 'pending' THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, COALESCE(auth.uid(), NEW.verified_by), 'store_owner', 'verify_payment', 'payment', NEW.id,
        jsonb_build_object('before', jsonb_build_object('status', 'pending'), 'after', jsonb_build_object('status', 'verified', 'amount', NEW.amount)));
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
      VALUES (NEW.store_id, COALESCE(auth.uid(), NEW.verified_by), 'store_owner', 'reject_payment', 'payment', NEW.id,
        jsonb_build_object('before', jsonb_build_object('status', 'pending'), 'after', jsonb_build_object('status', 'rejected', 'reason', NEW.rejection_reason)));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_payments ON public.payments;
CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_payments();

-- ============================================================
-- Auto-audit trigger for ledger entries
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_audit_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (store_id, user_id, user_role, action, entity_type, entity_id, changes)
  VALUES (NEW.store_id, auth.uid(), 'store_owner', 'create', 'ledger_entry', NEW.id,
    jsonb_build_object('after', jsonb_build_object('entry_type', NEW.entry_type, 'debit_amount', NEW.debit_amount, 'credit_amount', NEW.credit_amount, 'balance_after', NEW.balance_after)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_ledger ON public.ledger_entries;
CREATE TRIGGER trg_audit_ledger
  AFTER INSERT ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_ledger();
