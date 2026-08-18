-- ======================================================================
-- MIGRATION: UPDATE MATERIAL PRICE RPC WITH AUDIT LOG
-- Timestamp: 20260816000001
-- ======================================================================

CREATE OR REPLACE FUNCTION public.update_material_price(
  p_material_id uuid,
  p_price numeric,
  p_effective_date date,
  p_scrap_price numeric DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_user_email text;
  v_result json;
  v_material_name text;
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

  -- 4. Lấy tên vật tư để log audit
  SELECT name INTO v_material_name 
  FROM public.materials 
  WHERE id = p_material_id;

  -- 5. Thực thi: Insert lịch sử giá mới
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

  -- 6. Thực thi: Update bảng materials (current price)
  UPDATE public.materials
  SET 
    latest_price = p_price,
    scrap_price = p_scrap_price,
    latest_effective_date = p_effective_date,
    updated_at = NOW()
  WHERE id = p_material_id;

  -- 7. Ghi Audit Log
  INSERT INTO public.audit_log (
    actor_email, 
    action, 
    table_name, 
    record_id, 
    details
  ) VALUES (
    v_user_email, 
    'UPDATE_MATERIAL_PRICE', 
    'materials', 
    p_material_id::text, 
    json_build_object(
      'name', v_material_name,
      'new_price', p_price
    )::jsonb
  );

  -- 8. Trả về thông tin bản ghi lịch sử giá vừa tạo (để frontend dùng)
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
