-- ======================================================================
-- MIGRATION: THÊM BẢNG AUDIT_LOG
-- Timestamp: 20260815000003
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read audit_log" ON public.audit_log;
CREATE POLICY "Admin read audit_log" ON public.audit_log
  FOR SELECT USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Authenticated insert audit_log" ON public.audit_log;
CREATE POLICY "Authenticated insert audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
