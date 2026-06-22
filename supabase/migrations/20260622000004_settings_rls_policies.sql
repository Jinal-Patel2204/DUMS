-- ============================================================
-- Settings Module RLS Policies
-- Run in Supabase SQL Editor
-- ============================================================

-- Notification Config
DROP POLICY IF EXISTS notification_config_owner ON public.notification_config;
CREATE POLICY notification_config_owner_select ON public.notification_config
  FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY notification_config_owner_insert ON public.notification_config
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY notification_config_owner_update ON public.notification_config
  FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- SMTP Config
DROP POLICY IF EXISTS smtp_config_owner ON public.smtp_config;
CREATE POLICY smtp_config_owner_select ON public.smtp_config
  FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY smtp_config_owner_insert ON public.smtp_config
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY smtp_config_owner_update ON public.smtp_config
  FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Due Reminder Rules
DROP POLICY IF EXISTS reminder_rules_owner ON public.due_reminder_rules;
CREATE POLICY reminder_rules_owner_select ON public.due_reminder_rules
  FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY reminder_rules_owner_insert ON public.due_reminder_rules
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY reminder_rules_owner_update ON public.due_reminder_rules
  FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Scheduled Reports
DROP POLICY IF EXISTS scheduled_reports_owner ON public.scheduled_reports;
CREATE POLICY scheduled_reports_owner_select ON public.scheduled_reports
  FOR SELECT USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY scheduled_reports_owner_insert ON public.scheduled_reports
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY scheduled_reports_owner_update ON public.scheduled_reports
  FOR UPDATE USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
