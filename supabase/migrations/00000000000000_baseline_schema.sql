-- ============================================================================
-- BASELINE SCHEMA — dựng lại từ kết quả truy vấn information_schema
-- (Bước 1 trong kế hoạch production-readiness, phương án B — SQL Editor)
--
-- CẬP NHẬT (sau khi đối chiếu với code + phát hiện 2 bảng bị thiếu thật trên
-- DB): đã bổ sung casting_factory_settings, casting_molding_recipes, và 3 cột
-- description/name còn thiếu — xem chi tiết PHẦN 3 ở cuối file. 2 bảng này đã
-- được tạo thật trên Supabase qua migration
-- 20260815000001_fix_missing_casting_tables.sql, baseline file này chỉ đồng
-- bộ lại cho khớp thực tế.
-- ============================================================================
--
-- QUAN TRỌNG — ĐỌC TRƯỚC KHI DÙNG:
--
-- 1. File này CHỈ để làm tài liệu (documentation) đưa vào Git, KHÔNG cần và
--    KHÔNG NÊN chạy lên project Supabase hiện tại — 13 bảng này đã tồn tại
--    sẵn trên DB thật rồi. Mọi câu lệnh dưới đây đều dùng IF NOT EXISTS /
--    DO-block bắt lỗi trùng, nên nếu lỡ chạy nhầm trên DB hiện tại cũng sẽ
--    tự bỏ qua an toàn, không phá dữ liệu — nhưng về nguyên tắc, file này chỉ
--    thật sự cần chạy khi dựng 1 project Supabase HOÀN TOÀN MỚI (môi trường
--    staging/backup/disaster-recovery sau này).
--
-- 2. Phạm vi file này CHỈ gồm: CREATE TABLE + cột (đúng kiểu dữ liệu,
--    NULL/NOT NULL, giá trị mặc định) + PRIMARY KEY + FOREIGN KEY — dựng từ
--    information_schema.tables/columns/table_constraints qua SQL Editor.
--
-- 3. File này KHÔNG chứa (theo đúng giới hạn đã nêu trong kế hoạch gốc):
--    - RLS (ENABLE ROW LEVEL SECURITY + toàn bộ policies)
--    - Functions/Triggers (handle_new_user, current_user_role(),
--      update_quote_status_transaction, create_rfq_dossier_transaction,
--      void_quotation_document_transaction, create_quotation_document_transaction...)
--    - CHECK constraints (vd status IN (...), role IN (...))
--    - UNIQUE constraints ngoài PK (vd rfqs.rfq_code unique,
--      quotation_documents.document_code unique)
--    - Index, sequence
--    Toàn bộ các phần trên ĐÃ NẰM SẴN trong các file migration khác của dự án
--    (01_rls_policies.sql, 02_update_quotes_segment_check.sql,
--    03_add_lifecycle_timestamps_to_rfq_items.sql,
--    20260807000000_update_quote_status_rpc.sql,
--    20260811000000_add_quotation_document_code.sql,
--    20260811000001_add_rfq_code_unique_constraint.sql,
--    20260812000000_ownership_based_rls.sql, và các migration của Việc 2/
--    Việc 3 nếu đã tạo) — các file đó chạy SAU file baseline này theo đúng
--    thứ tự timestamp, sẽ tự bổ sung đầy đủ phần còn thiếu.
--
-- 4. Timestamp "00000000000000" đặt cố ý nhỏ nhất, để nó luôn là migration
--    ĐẦU TIÊN được áp dụng nếu ai đó dựng lại project từ đầu bằng
--    `supabase db reset` hoặc tương đương, đảm bảo các migration khác (vốn
--    dùng ALTER TABLE trên các bảng này) chạy sau, không bị lỗi "table does
--    not exist".
--
-- 5. Một số cột uuid (rfqs.created_by, quotation_documents.created_by) rất
--    có thể tham chiếu tới auth.users(id) trên thực tế, nhưng câu truy vấn
--    Câu 3 KHÔNG trả về ràng buộc FOREIGN KEY nào cho các cột này — nghĩa là
--    trên DB thật hiện KHÔNG có FK tường minh (chỉ là uuid thường, được gán
--    đúng qua code ở tầng ứng dụng/trigger). File này giữ nguyên đúng thực
--    tế đó, không tự thêm FK không có thật.
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PHẦN 1: TẠO BẢNG (không kèm FK — thêm FK ở Phần 2 để tránh phụ thuộc thứ tự)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quotation_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_person text,
  contact_email text,
  quotation_date date NOT NULL DEFAULT CURRENT_DATE,
  trade_terms text DEFAULT 'FOB'::text,
  currency text DEFAULT 'VND'::text,
  exchange_rate numeric DEFAULT 1.0,
  payment_terms text DEFAULT 'Thanh toán 100% bằng chuyển khoản T/T trong vòng 30 ngày kể từ ngày nhận hàng và hóa đơn hợp lệ.'::text,
  delivery_notes text DEFAULT 'Thời gian giao hàng: 30 - 45 ngày kể từ ngày xác nhận đơn hàng và ký kết hợp đồng.'::text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  display_config jsonb,
  document_code text,
  rfq_code text,
  revision integer DEFAULT 1,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text DEFAULT 'kg'::text,
  category text NOT NULL,
  scrap_price numeric DEFAULT 0,
  notes text,
  latest_price numeric DEFAULT 0,
  latest_effective_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.casting_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.hydraulic_hammer_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  energy_min numeric NOT NULL,
  energy_max numeric NOT NULL,
  rate_per_hour numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pressing_machine_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tonnage_min numeric NOT NULL,
  tonnage_max numeric NOT NULL,
  rate_per_hour numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_unit_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rate_key text NOT NULL,
  rate_name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  value numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'sales'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rfqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  annual_volume numeric NOT NULL DEFAULT 1,
  trade_terms text NOT NULL DEFAULT 'FOB'::text,
  target_price numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  rfq_code text,
  customer_address text,
  customer_contact_person text,
  rfq_received_date date,
  customer_deadline date,
  delivery_address text,
  special_requirements text,
  notes text,
  created_by_email text,
  source_document_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rfq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rfq_id uuid,
  item_code text,
  product_name text NOT NULL,
  part_number text,
  annual_volume numeric DEFAULT 0,
  quantity_unit text DEFAULT 'pcs/năm'::text,
  target_price numeric DEFAULT 0,
  technology_requirement text,
  status text DEFAULT 'IN_COSTING'::text,
  cancel_reason text,
  quoted_sent_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  technical_review_completed_at timestamptz,
  costing_completed_at timestamptz,
  search_text text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  segment text NOT NULL,
  inputs_json jsonb NOT NULL,
  results_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT'::text,
  currency text DEFAULT 'VND'::text,
  exchange_rate numeric DEFAULT 1.0,
  die_cost_treatment text DEFAULT 'amortized'::text,
  final_quoted_price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  rfq_item_id uuid,
  created_by_email text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quotation_document_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quotation_document_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.material_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid,
  price numeric NOT NULL,
  scrap_price numeric DEFAULT 0,
  effective_date date NOT NULL,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.casting_bom_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  casting_grade_id uuid,
  material_id uuid,
  weight_kg numeric NOT NULL DEFAULT 0,
  is_return_scrap boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);


-- ----------------------------------------------------------------------------
-- PHẦN 2: FOREIGN KEY (8 khóa ngoại, đúng theo kết quả Câu 3)
-- Dùng DO-block bắt lỗi "duplicate_object" để chạy lại nhiều lần không báo lỗi
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  ALTER TABLE public.quotation_document_items
    ADD CONSTRAINT quotation_document_items_quotation_document_id_fkey
    FOREIGN KEY (quotation_document_id) REFERENCES public.quotation_documents(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.quotation_document_items
    ADD CONSTRAINT quotation_document_items_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.material_price_history
    ADD CONSTRAINT material_price_history_material_id_fkey
    FOREIGN KEY (material_id) REFERENCES public.materials(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.casting_bom_items
    ADD CONSTRAINT casting_bom_items_casting_grade_id_fkey
    FOREIGN KEY (casting_grade_id) REFERENCES public.casting_grades(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.casting_bom_items
    ADD CONSTRAINT casting_bom_items_material_id_fkey
    FOREIGN KEY (material_id) REFERENCES public.materials(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rfq_items
    ADD CONSTRAINT rfq_items_rfq_id_fkey
    FOREIGN KEY (rfq_id) REFERENCES public.rfqs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.quotes
    ADD CONSTRAINT quotes_rfq_item_id_fkey
    FOREIGN KEY (rfq_item_id) REFERENCES public.rfq_items(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.rfqs
    ADD CONSTRAINT rfqs_source_document_id_fkey
    FOREIGN KEY (source_document_id) REFERENCES public.quotation_documents(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- PHẦN 3: 2 bảng + 3 cột bổ sung sau khi phát hiện thiếu qua đối chiếu code
-- (đã chạy thật trên Supabase qua migration
-- 20260815000001_fix_missing_casting_tables.sql — chép lại đây để baseline
-- luôn phản ánh đúng schema hiện tại)
-- ----------------------------------------------------------------------------

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

-- id kiểu TEXT (không phải uuid) — code sinh id dạng "rec-<timestamp>" ở client
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

ALTER TABLE public.system_unit_rates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.pressing_machine_rates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.hydraulic_hammer_rates ADD COLUMN IF NOT EXISTS name text;

-- ============================================================================
-- HẾT FILE — 15/15 bảng, 8/8 khóa ngoại, đã đồng bộ với thực tế sau fix.
-- (RLS của 2 bảng mới nằm trong 20260815000001_fix_missing_casting_tables.sql,
-- không lặp lại ở đây theo đúng nguyên tắc baseline chỉ chứa cấu trúc bảng.)
-- ============================================================================
