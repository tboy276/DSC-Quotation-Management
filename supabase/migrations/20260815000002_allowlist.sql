-- ======================================================================
-- MIGRATION: THÊM BẢNG ALLOWED_USERS VÀ CẬP NHẬT TRIGGER ALLOWLIST
-- Timestamp: 20260815000002
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.allowed_users (
    email text PRIMARY KEY,
    role text NOT NULL DEFAULT 'viewer',
    added_by text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access allowed_users" ON public.allowed_users;
CREATE POLICY "Admin full access allowed_users" ON public.allowed_users
  FOR ALL USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Anyone read allowed_users" ON public.allowed_users;
CREATE POLICY "Anyone read allowed_users" ON public.allowed_users
  FOR SELECT USING (true);

-- Cập nhật Trigger tự động gán role từ allowed_users cho tài khoản tạo mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.allowed_users WHERE email = NEW.email;

  IF v_role IS NULL THEN
    v_role := 'viewer';
  END IF;

  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;
