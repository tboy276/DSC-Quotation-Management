-- ============================================================================
-- Bổ sung 2 bảng bị thiếu (casting_factory_settings, casting_molding_recipes)
-- + 3 cột hiển thị bị thiếu (description/name) — phát hiện qua đối chiếu
-- baseline schema (00000000000000_baseline_schema.sql) với code thực tế
-- trong src/lib/master-data-service.ts.
--
-- Đã CHẠY THẬT trên Supabase SQL Editor — file này lưu lại vào repo để đồng
-- bộ lịch sử migration, không cần chạy lại (dùng IF NOT EXISTS / DROP POLICY
-- IF EXISTS nên chạy lại nhiều lần cũng an toàn, không lỗi, không mất dữ liệu).
-- ============================================================================


-- 1. Bảng cài đặt xưởng đúc — dạng "singleton" (luôn chỉ có đúng 1 dòng, id = 1),
--    khớp với cách code gọi upsert({ id: 1, ...settings }) trong
--    saveCastingSettings() (src/lib/master-data-service.ts).
CREATE TABLE IF NOT EXISTS public.casting_factory_settings (
  id integer PRIMARY KEY DEFAULT 1,
  furnace_lining_cost numeric NOT NULL DEFAULT 50000000,
  furnace_lifespan_batches numeric NOT NULL DEFAULT 500,
  ladle_lining_cost numeric NOT NULL DEFAULT 3000000,
  ladle_lifespan_batches numeric NOT NULL DEFAULT 150,
  resin_core_sand_rate_per_kg numeric NOT NULL DEFAULT 12500,
  finishing_material_rate numeric NOT NULL DEFAULT 771.82,
  utility_rate numeric NOT NULL DEFAULT 3687.6,
  labor_rate numeric NOT NULL DEFAULT 2461,
  workshop_mgmt_rate numeric NOT NULL DEFAULT 0,
  equipment_depreciation_rate numeric NOT NULL DEFAULT 4000,
  CONSTRAINT casting_factory_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.casting_factory_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read casting_factory_settings" ON public.casting_factory_settings;
CREATE POLICY "Read casting_factory_settings" ON public.casting_factory_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin write casting_factory_settings" ON public.casting_factory_settings;
CREATE POLICY "Admin write casting_factory_settings" ON public.casting_factory_settings
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Seed sẵn 1 dòng mặc định (khớp giá trị hard-code hiện có trong
-- src/lib/master-data-service.ts) để fetchCastingSettings() có dữ liệu thật
-- ngay từ đầu, không rơi vào nhánh fallback im lặng nữa.
INSERT INTO public.casting_factory_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;


-- 2. Bảng công thức khuôn / vật tư khuôn — id kiểu TEXT (không phải uuid),
--    vì code sinh id dạng chuỗi "rec-<timestamp>" ở client
--    (saveMoldingRecipeItem() trong master-data-service.ts). Nếu để kiểu uuid,
--    upsert sẽ lỗi "invalid input syntax for type uuid".
CREATE TABLE IF NOT EXISTS public.casting_molding_recipes (
  id text PRIMARY KEY,
  material_id uuid,
  material_name text NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  category text NOT NULL DEFAULT 'Vật tư khuôn',
  quantity_per_1000kg numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  is_outsourced boolean NOT NULL DEFAULT false,
  outsourced_cost_per_1000kg numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.casting_molding_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read casting_molding_recipes" ON public.casting_molding_recipes;
CREATE POLICY "Read casting_molding_recipes" ON public.casting_molding_recipes
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin write casting_molding_recipes" ON public.casting_molding_recipes;
CREATE POLICY "Admin write casting_molding_recipes" ON public.casting_molding_recipes
  FOR ALL USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Không thêm FK material_id -> materials(id): code hiện không thực sự dùng
-- field này ở đâu (kiểm tra không thấy tham chiếu), để tự do, tránh ràng
-- buộc không cần thiết. Có thể bổ sung sau nếu tính năng này được phát triển
-- tiếp và thực sự cần liên kết tới bảng materials.


-- 3. Bổ sung 3 cột hiển thị còn thiếu (không ảnh hưởng runtime — chỉ đọc qua
--    select('*'), không hàm ghi nào đụng tới — nhưng thiếu thì UI hiện trống).
ALTER TABLE public.system_unit_rates
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.pressing_machine_rates
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.hydraulic_hammer_rates
  ADD COLUMN IF NOT EXISTS name text;

-- ============================================================================
-- HẾT FILE
-- ============================================================================
