-- ======================================================================
-- MIGRATION: THÊM BẢNG ALLOWED_USERS VÀ TRIGGER ALLOWLIST (BẢN ĐÚNG)
-- Timestamp: 20260815000002
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.allowed_users (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('viewer', 'sales', 'admin')),
  added_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admin manage allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admin full access allowed_users" ON public.allowed_users;
CREATE POLICY "Admin manage allowed_users" ON public.allowed_users
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_allowed_role text;
BEGIN
  SELECT role INTO v_allowed_role
  FROM public.allowed_users
  WHERE lower(email) = lower(NEW.email);

  IF v_allowed_role IS NULL THEN
    RAISE EXCEPTION 'EMAIL_NOT_ALLOWED: % không có trong danh sách được cấp quyền truy cập hệ thống.', NEW.email;
  END IF;

  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_allowed_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
