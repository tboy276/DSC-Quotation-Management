-- ======================================================================
-- MIGRATION: THÊM QUYỀN ADMIN QUẢN LÝ USER PROFILES
-- Timestamp: 20260813000005
-- ======================================================================

-- 1. Cho phép admin UPDATE bất kỳ row nào trong user_profiles
CREATE POLICY "Admin can update all profiles" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Cho phép admin DELETE các row khác trong user_profiles (trừ chính họ)
CREATE POLICY "Admin can delete other profiles" ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
