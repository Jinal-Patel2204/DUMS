-- =============================================================================
-- Seed Products for existing store
-- Run this after signing up (store is auto-created via trigger)
-- Replace YOUR_STORE_ID with actual store id from stores table
-- =============================================================================

-- First, find your store_id:
-- SELECT id FROM stores WHERE is_deleted = false LIMIT 1;

-- Then replace 'YOUR_STORE_ID' below with that UUID and run:

DO $$
DECLARE
  v_store_id uuid;
BEGIN
  -- Auto-pick the first active store
  SELECT id INTO v_store_id FROM public.stores WHERE is_deleted = false LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Sign up first to auto-create a store.';
  END IF;

  -- Categories
  INSERT INTO public.categories (id, store_id, name, description, sort_order) VALUES
    (gen_random_uuid(), v_store_id, 'Grocery', 'Daily grocery items', 1),
    (gen_random_uuid(), v_store_id, 'Dairy', 'Milk, curd, paneer etc.', 2),
    (gen_random_uuid(), v_store_id, 'Beverages', 'Tea, coffee, cold drinks', 3),
    (gen_random_uuid(), v_store_id, 'Snacks', 'Chips, biscuits, namkeen', 4),
    (gen_random_uuid(), v_store_id, 'Personal Care', 'Soap, shampoo, toothpaste', 5),
    (gen_random_uuid(), v_store_id, 'Household', 'Cleaning supplies, utensils', 6);

  -- Products (using subquery to get category_id)
  INSERT INTO public.products (store_id, category_id, name, sku, purchase_price, selling_price, discount_percent, unit, stock_quantity, low_stock_threshold) VALUES
    -- Grocery
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Toor Dal (1kg)', 'GR-001', 120.00, 145.00, 0, 'kg', 50, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Basmati Rice (5kg)', 'GR-002', 320.00, 399.00, 0, 'bag', 30, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Aashirvaad Atta (10kg)', 'GR-003', 380.00, 450.00, 0, 'bag', 25, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Sugar (1kg)', 'GR-004', 38.00, 45.00, 0, 'kg', 100, 20),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Mustard Oil (1L)', 'GR-005', 155.00, 185.00, 0, 'ltr', 40, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Salt (1kg)', 'GR-006', 18.00, 22.00, 0, 'kg', 80, 15),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Chana Dal (1kg)', 'GR-007', 95.00, 115.00, 0, 'kg', 45, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Grocery' LIMIT 1), 'Moong Dal (1kg)', 'GR-008', 110.00, 135.00, 0, 'kg', 40, 10),
    -- Dairy
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Dairy' LIMIT 1), 'Amul Milk (1L)', 'DR-001', 54.00, 62.00, 0, 'ltr', 30, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Dairy' LIMIT 1), 'Amul Butter (500g)', 'DR-002', 230.00, 275.00, 0, 'pcs', 20, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Dairy' LIMIT 1), 'Paneer (200g)', 'DR-003', 70.00, 90.00, 0, 'pcs', 15, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Dairy' LIMIT 1), 'Dahi (400g)', 'DR-004', 30.00, 40.00, 0, 'pcs', 25, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Dairy' LIMIT 1), 'Amul Cheese Slice (10pcs)', 'DR-005', 120.00, 150.00, 0, 'pcs', 18, 5),
    -- Beverages
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Beverages' LIMIT 1), 'Tata Tea Gold (500g)', 'BV-001', 200.00, 250.00, 0, 'pcs', 35, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Beverages' LIMIT 1), 'Nescafe Classic (100g)', 'BV-002', 250.00, 310.00, 0, 'pcs', 20, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Beverages' LIMIT 1), 'Thums Up (2L)', 'BV-003', 72.00, 90.00, 0, 'btl', 40, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Beverages' LIMIT 1), 'Frooti (1.2L)', 'BV-004', 55.00, 70.00, 0, 'btl', 30, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Beverages' LIMIT 1), 'Bisleri Water (1L)', 'BV-005', 15.00, 20.00, 0, 'btl', 100, 20),
    -- Snacks
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Snacks' LIMIT 1), 'Lays Classic (52g)', 'SN-001', 15.00, 20.00, 0, 'pcs', 60, 15),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Snacks' LIMIT 1), 'Parle-G Biscuit (800g)', 'SN-002', 70.00, 89.00, 0, 'pcs', 40, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Snacks' LIMIT 1), 'Haldiram Bhujia (400g)', 'SN-003', 110.00, 140.00, 0, 'pcs', 25, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Snacks' LIMIT 1), 'Maggi Noodles (Pack of 12)', 'SN-004', 130.00, 168.00, 0, 'pcs', 35, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Snacks' LIMIT 1), 'Kurkure (90g)', 'SN-005', 15.00, 20.00, 0, 'pcs', 50, 12),
    -- Personal Care
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Personal Care' LIMIT 1), 'Dove Soap (100g)', 'PC-001', 42.00, 55.00, 0, 'pcs', 40, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Personal Care' LIMIT 1), 'Head & Shoulders (340ml)', 'PC-002', 280.00, 350.00, 0, 'btl', 15, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Personal Care' LIMIT 1), 'Colgate MaxFresh (150g)', 'PC-003', 85.00, 108.00, 0, 'pcs', 30, 8),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Personal Care' LIMIT 1), 'Dettol Handwash (250ml)', 'PC-004', 65.00, 85.00, 0, 'btl', 25, 6),
    -- Household
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Household' LIMIT 1), 'Vim Dishwash Bar (500g)', 'HH-001', 32.00, 42.00, 0, 'pcs', 35, 10),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Household' LIMIT 1), 'Harpic (500ml)', 'HH-002', 90.00, 115.00, 0, 'btl', 20, 5),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Household' LIMIT 1), 'Surf Excel (1kg)', 'HH-003', 180.00, 225.00, 0, 'pcs', 28, 6),
    (v_store_id, (SELECT id FROM public.categories WHERE store_id = v_store_id AND name = 'Household' LIMIT 1), 'Lizol Floor Cleaner (500ml)', 'HH-004', 95.00, 125.00, 0, 'btl', 18, 5);

END $$;
