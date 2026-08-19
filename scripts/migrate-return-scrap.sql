-- ==============================================================================
-- MIGRATION SCRIPT: Tách logic Đơn Giá Hồi Liệu (DG_cast_scrap)
-- Chạy đoạn script này trên Supabase SQL Editor
-- ==============================================================================

-- 1. Thêm cột return_scrap_material_id vào bảng casting_grades
ALTER TABLE public.casting_grades 
ADD COLUMN IF NOT EXISTS return_scrap_material_id uuid REFERENCES public.materials(id);

-- 2. Đẩy dữ liệu cũ (migrate) từ casting_bom_items.is_return_scrap = true lên casting_grades
UPDATE public.casting_grades cg
SET return_scrap_material_id = sub.material_id
FROM (
  SELECT DISTINCT ON (casting_grade_id) casting_grade_id, material_id
  FROM public.casting_bom_items
  WHERE is_return_scrap = true
  ORDER BY casting_grade_id, created_at DESC
) sub
WHERE cg.id = sub.casting_grade_id
  AND cg.return_scrap_material_id IS NULL; -- Chỉ gán nếu chưa có

-- 3. (Tùy chọn, KHÔNG BẮT BUỘC) Bỏ cờ is_return_scrap sau một thời gian theo dõi
-- ALTER TABLE public.casting_bom_items DROP COLUMN IF EXISTS is_return_scrap;
