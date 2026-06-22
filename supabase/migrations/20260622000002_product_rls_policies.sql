-- ============================================================
-- Products & Inventory RLS Policies
-- Run in Supabase SQL Editor
-- ============================================================

-- Products: Full CRUD for store owner
DROP POLICY IF EXISTS products_owner_select ON public.products;
DROP POLICY IF EXISTS products_owner_insert ON public.products;
DROP POLICY IF EXISTS products_owner_update ON public.products;
DROP POLICY IF EXISTS products_owner_delete ON public.products;

CREATE POLICY products_owner_select ON public.products
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_insert ON public.products
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_update ON public.products
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY products_owner_delete ON public.products
  FOR DELETE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Categories: Full CRUD for store owner
DROP POLICY IF EXISTS categories_owner ON public.categories;
DROP POLICY IF EXISTS categories_owner_select ON public.categories;
DROP POLICY IF EXISTS categories_owner_insert ON public.categories;
DROP POLICY IF EXISTS categories_owner_update ON public.categories;
DROP POLICY IF EXISTS categories_owner_delete ON public.categories;

CREATE POLICY categories_owner_select ON public.categories
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY categories_owner_insert ON public.categories
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY categories_owner_update ON public.categories
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY categories_owner_delete ON public.categories
  FOR DELETE USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Purchase Entries: Insert + Select for store owner
DROP POLICY IF EXISTS purchases_owner ON public.purchase_entries;
DROP POLICY IF EXISTS purchases_owner_select ON public.purchase_entries;
DROP POLICY IF EXISTS purchases_owner_insert ON public.purchase_entries;

CREATE POLICY purchases_owner_select ON public.purchase_entries
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY purchases_owner_insert ON public.purchase_entries
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

-- Stock Movements: Insert + Select for store owner
DROP POLICY IF EXISTS stock_movements_owner ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_owner_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_owner_insert ON public.stock_movements;

CREATE POLICY stock_movements_owner_select ON public.stock_movements
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );

CREATE POLICY stock_movements_owner_insert ON public.stock_movements
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  );
