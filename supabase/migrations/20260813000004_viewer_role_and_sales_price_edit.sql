-- ======================================================================
-- MIGRATION: THÊM ROLE VIEWER VÀ MỞ QUYỀN SỬA GIÁ VẬT TƯ CHO SALES
-- Timestamp: 20260813000004
-- ======================================================================

-- 1. Cập nhật lại Check Constraint trên bảng user_profiles
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('viewer', 'sales', 'admin', 'estimator'));

-- 2. Cập nhật Trigger tự động gán role 'viewer' cho tài khoản tạo mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer', -- Default mới thay vì sales
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- 3. Tạo RPC để cập nhật giá vật tư (bảo mật SECURITY DEFINER)
-- Chỉ Sales và Admin được phép gọi.
CREATE OR REPLACE FUNCTION public.update_material_price(
  p_material_id uuid,
  p_price numeric,
  p_effective_date date,
  p_scrap_price numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền của owner để bypass RLS (vì RLS của bảng chặn sales update)
AS $$
DECLARE
  v_role text;
  v_user_email text;
  v_result json;
BEGIN
  -- 1. Kiểm tra Authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_user_email := auth.email();

  -- 2. Lấy role của user hiện tại
  SELECT role INTO v_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();

  -- 3. Kiểm tra Authorization
  IF v_role NOT IN ('admin', 'sales') THEN
    RAISE EXCEPTION 'Permission denied. Only sales and admin can update material prices.';
  END IF;

  -- 4. Thực thi: Insert lịch sử giá mới
  INSERT INTO public.material_price_history (
    material_id, 
    price, 
    effective_date, 
    scrap_price, 
    updated_by
  ) VALUES (
    p_material_id, 
    p_price, 
    p_effective_date, 
    p_scrap_price, 
    v_user_email
  );

  -- 5. Thực thi: Update bảng materials (current price)
  UPDATE public.materials
  SET 
    current_price = p_price,
    scrap_price = p_scrap_price,
    updated_at = NOW()
  WHERE id = p_material_id;

  -- 6. Trả về thông tin bản ghi lịch sử giá vừa tạo (để frontend dùng)
  SELECT row_to_json(h) INTO v_result
  FROM (
    SELECT * 
    FROM public.material_price_history
    WHERE material_id = p_material_id 
      AND effective_date = p_effective_date
    ORDER BY created_at DESC 
    LIMIT 1
  ) h;

  RETURN v_result;
END;
$$;
