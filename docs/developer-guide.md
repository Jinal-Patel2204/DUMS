# DUMS Developer Guide — Page-to-Table Mapping

## Quick Reference: Which table feeds which page?

---

## Authentication

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Login | `/login` | `auth.users` | signInWithPassword |
| Signup | `/signup` | `auth.users` → trigger → `user_profiles` → trigger → `stores` | signUp |
| Forgot Password | `/forgot-password` | `auth.users` | resetPasswordForEmail |
| Reset Password | `/reset-password` | `auth.users` | updateUser |

---

## Owner Portal — Dashboard

| Page | Route | Tables Used | Query |
|------|-------|-------------|-------|
| Dashboard | `/store/dashboard` | `customers` | SUM(current_balance) → Total Outstanding |
| | | `payments` | WHERE status='verified' AND verified_at >= today → Today's Collection |
| | | `payments` | WHERE status='verified' AND verified_at >= month_start → Monthly Collection |
| | | `products` | (selling_price - purchase_price) → Total Profit |
| | | `payments` | WHERE status='pending' COUNT → Pending Verifications |
| | | `products` | WHERE stock_quantity < 5 COUNT → Low Stock |
| | | `customers` | ORDER BY current_balance DESC LIMIT 5 → Top Debtors |

---

## Owner Portal — Customers

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Customer List | `/store/customers` | `customers` | SELECT WHERE store_id = current_store AND is_deleted = false |
| Add Customer | `/store/customers/new` | `customers` | INSERT (name, phone, email, address, credit_limit, store_id) |
| Customer Detail | `/store/customers/:id` | `customers` | SELECT WHERE id = :id |
| Edit Customer | `/store/customers/:id?edit=true` | `customers` | UPDATE (name, phone, email, address, credit_limit) |
| Customer Ledger | `/store/customers/:id/ledger` | `ledger_entries` | SELECT WHERE customer_id = :id ORDER BY created_at DESC |
| Customer Bills | `/store/customers/:id/bills` | `bills` | SELECT WHERE customer_id = :id |

---

## Owner Portal — Bills

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Bill List | `/store/bills` | `bills` | SELECT WHERE store_id = current_store |
| Create Bill | `/store/bills/new` | `bills`, `bill_items`, `products`, `customers` | INSERT bill → INSERT bill_items |
| Bill Detail | `/store/bills/:id` | `bills`, `bill_items`, `payments` | SELECT bill + items + linked payments |
| Finalize Bill | `/store/bills/:id` (action) | `bills`, `ledger_entries`, `customers`, `stock_movements`, `products` | UPDATE bill.status → INSERT ledger_entry → UPDATE customer.current_balance → deduct stock |
| Cancel Bill | `/store/bills/:id` (action) | `bills` | UPDATE status = 'cancelled' |

---

## Owner Portal — Payments

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Payment List | `/store/payments` | `payments`, `customers` | SELECT payments JOIN customers.name |
| Payment Detail | `/store/payments/:id` | `payments`, `payment_verifications` | SELECT payment + verification history |
| Verify Payment | `/store/payments/:id` (action) | `payments`, `ledger_entries`, `customers`, `payment_verifications` | UPDATE status=verified → INSERT ledger_entry (debit) → UPDATE customer.current_balance |
| Reject Payment | `/store/payments/:id` (action) | `payments`, `payment_verifications` | UPDATE status=rejected, rejection_reason |

---

## Owner Portal — Products

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Product List | `/store/products` | `products`, `categories` | SELECT WHERE store_id AND is_deleted=false |
| Add Product | `/store/products/new` | `products`, `categories` | INSERT (name, sku, purchase_price, selling_price, discount_percent, unit, stock_quantity, category_id) |
| Edit Product | `/store/products/:id` | `products` | UPDATE |
| Product Detail | `/store/products/:id` | `products`, `stock_movements` | SELECT product + recent movements |

---

## Owner Portal — Inventory

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Inventory Overview | `/store/inventory` | `products` | SELECT (aggregate stock values) |
| Purchase Entries | `/store/inventory/purchases` | `purchase_entries`, `products` | SELECT purchase_entries; INSERT new purchase → UPDATE product.stock_quantity |
| Stock Movements | `/store/inventory/movements` | `stock_movements`, `products` | SELECT stock_movements ORDER BY created_at DESC |

---

## Owner Portal — Installments

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Installment List | `/store/installments` | `installment_plans`, `customers` | SELECT WHERE store_id |
| Create Plan | `/store/installments/new` | `installment_plans`, `payment_schedule`, `bills`, `customers` | INSERT plan → INSERT schedule entries |
| Plan Detail | `/store/installments/:id` | `installment_plans`, `payment_schedule`, `payments` | SELECT plan + schedule + linked payments |
| Record Installment Payment | `/store/installments/:id` (action) | `payment_schedule`, `installment_plans`, `payments`, `ledger_entries`, `customers` | UPDATE schedule → UPDATE plan totals → INSERT payment → INSERT ledger_entry |

---

## Owner Portal — Reports

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Reports Overview | `/store/reports` | — | Static page with links |
| Credit Report | `/store/reports/credit` | `ledger_entries`, `bills` | SELECT WHERE entry_type='credit' grouped by date |
| Payment Report | `/store/reports/payments` | `payments` | SELECT WHERE status='verified' grouped by method/date |
| Overdue Report | `/store/reports/overdue` | `bills`, `customers` | SELECT WHERE status IN ('overdue','finalized') AND due_date < today |
| Profit Report | `/store/reports/profit` | `bill_items`, `products` | (selling_price - purchase_price) * quantity |
| Inventory Report | `/store/reports/inventory` | `products`, `stock_movements`, `purchase_entries` | Aggregated stock values |

---

## Owner Portal — Settings

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Shop Info | `/store/settings/shop-info` | `stores` | SELECT/UPDATE (name, address, phone, gstin, logo_url) |
| Payment Config | `/store/settings/payment` | `payment_config` | SELECT/UPDATE (upi_id, qr_code_url, bank details) |
| Notification Config | `/store/settings/notifications` | `notification_config` | SELECT/UPDATE (channels, quiet hours) |
| SMTP Config | `/store/settings/smtp` | `smtp_config` | SELECT/UPDATE (provider, host, credentials) |
| Reminder Rules | `/store/settings/reminders` | `due_reminder_rules` | SELECT/INSERT/UPDATE/DELETE rules |
| Report Schedule | `/store/settings/reports` | `scheduled_reports` | SELECT/INSERT/UPDATE/DELETE schedules |

---

## Owner Portal — Other

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Audit Logs | `/store/audit-logs` | `audit_logs` | SELECT WHERE store_id (read-only) |
| Notifications | `/store/notifications` | `notifications` | SELECT WHERE user_id; UPDATE is_read |

---

## Customer Portal

| Page | Route | Tables Used | Operations |
|------|-------|-------------|------------|
| Customer Dashboard | `/customer/dashboard` | `customers`, `bills`, `installment_plans` | SELECT linked stores + balances + upcoming dues |
| Store Detail | `/customer/stores/:storeId` | `customers`, `bills`, `payments`, `payment_config` | Balance + recent activity + payment methods |
| My Bills | `/customer/bills` | `bills`, `bill_items` | SELECT WHERE customer linked to user |
| Payments | `/customer/payments` | `payments` | SELECT WHERE customer linked to user |
| Make Payment | `/customer/payments/new` | `payments`, `payment_config` | INSERT payment (status: pending) |
| Installments | `/customer/installments` | `installment_plans`, `payment_schedule` | SELECT WHERE customer linked to user |
| Profile | `/customer/profile` | `user_profiles`, `auth.users` | UPDATE profile; updateUser (password) |

---

## Complete Table List (24 Tables)

| # | Table | Used By Pages |
|---|-------|---------------|
| 1 | `user_profiles` | Auth, Profile, TopBar (user name) |
| 2 | `stores` | Dashboard, Settings/Shop Info, All owner queries (store_id filter) |
| 3 | `categories` | Products (filter/group) |
| 4 | `products` | Products, Bills (item selection), Inventory, Dashboard (low stock) |
| 5 | `customers` | Customers, Bills, Payments, Dashboard, Installments |
| 6 | `bills` | Bills, Customer Detail, Dashboard, Reports |
| 7 | `bill_items` | Bill Detail, Bill Create, Reports |
| 8 | `ledger_entries` | Customer Ledger, Bill Finalize, Payment Verify, Reports |
| 9 | `payments` | Payments, Dashboard, Bill Detail, Installments |
| 10 | `payment_verifications` | Payment Detail (verification history) |
| 11 | `installment_plans` | Installments, Customer Dashboard |
| 12 | `payment_schedule` | Installment Detail, Customer Installments |
| 13 | `payment_config` | Settings/Payment, Customer Make Payment (show QR/UPI) |
| 14 | `notification_config` | Settings/Notifications |
| 15 | `smtp_config` | Settings/SMTP |
| 16 | `notifications` | Notifications page, TopBar badge |
| 17 | `due_reminder_rules` | Settings/Reminders |
| 18 | `active_reminders` | Internal (cron processed) |
| 19 | `scheduled_reminders` | Internal (cron processed) |
| 20 | `scheduled_reports` | Settings/Reports |
| 21 | `purchase_entries` | Inventory/Purchases |
| 22 | `stock_movements` | Inventory/Movements, Product Detail |
| 23 | `audit_logs` | Audit Logs page |
| 24 | `customer_invitations` | Customer Invite (from customer detail) |

---

## Key Data Flows

### Bill → Ledger → Balance (Critical Financial Flow)
```
Bill Finalized
  → INSERT ledger_entries (entry_type: 'credit', debit_amount: bill.total_amount)
  → trigger: UPDATE customers.current_balance = ledger_entry.balance_after
  → INSERT stock_movements (type: 'stock_out') for each bill_item
  → UPDATE products.stock_quantity -= bill_item.quantity
```

### Payment Verified → Ledger → Balance
```
Payment Verified
  → INSERT ledger_entries (entry_type: 'debit', credit_amount: payment.amount)
  → trigger: UPDATE customers.current_balance = ledger_entry.balance_after
  → UPDATE bills.status if fully paid
```

---

## Development Checklist

Developers: Check off as you implement each module.

- [x] Auth (Login, Signup, Forgot Password, Reset)
- [x] Owner Layout (AppShell, Sidebar, TopBar)
- [x] Dashboard (live metrics from Supabase)
- [x] Customers (List, Add, Edit, Detail)
- [ ] Customer Ledger view
- [ ] Bills (List, Create, Detail, Finalize, Cancel)
- [ ] Payments (List, Detail, Verify, Reject)
- [ ] Products (List, Add, Edit, Detail)
- [ ] Categories (CRUD)
- [ ] Inventory (Overview, Purchases, Movements)
- [ ] Installments (List, Create, Detail, Record Payment)
- [ ] Reports (Credit, Payment, Overdue, Profit, Inventory)
- [ ] Settings — Shop Info
- [ ] Settings — Payment Config
- [ ] Settings — Notification Config
- [ ] Settings — SMTP Config
- [ ] Settings — Reminder Rules
- [ ] Settings — Report Schedules
- [ ] Audit Logs
- [ ] Notifications (list + mark read)
- [ ] Customer Portal — Dashboard
- [ ] Customer Portal — Bills
- [ ] Customer Portal — Payments (+ Make Payment)
- [ ] Customer Portal — Installments
- [ ] Customer Portal — Profile
- [ ] Customer Invitation Flow
