-- ======================================================================
-- SUPABASE MIGRATION 01: RLS POLICIES, ROLE SECURITY & TRANSACTIONS
-- EXCLUSIVELY TARGETING THE 13 EXISTING TABLES IN DATABASE
-- ======================================================================

-- 1. ENABLE ROW LEVEL SECURITY (SAFE WITH IF EXISTS)
ALTER TABLE IF EXISTS public.casting_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.casting_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hydraulic_hammer_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.material_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pressing_machine_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotation_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_unit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTION TO FETCH USER ROLE WITHOUT RECURSION
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. DROP EXISTING POLICIES TO ALLOW CLEAN RE-RUN
DROP POLICY IF EXISTS "User read self or admin" ON public.user_profiles;

DROP POLICY IF EXISTS "Read casting_bom_items" ON public.casting_bom_items;
DROP POLICY IF EXISTS "Read casting_grades" ON public.casting_grades;
DROP POLICY IF EXISTS "Read hydraulic_hammer_rates" ON public.hydraulic_hammer_rates;
DROP POLICY IF EXISTS "Read material_price_history" ON public.material_price_history;
DROP POLICY IF EXISTS "Read materials" ON public.materials;
DROP POLICY IF EXISTS "Read pressing_machine_rates" ON public.pressing_machine_rates;
DROP POLICY IF EXISTS "Read quotation_document_items" ON public.quotation_document_items;
DROP POLICY IF EXISTS "Read quotation_documents" ON public.quotation_documents;
DROP POLICY IF EXISTS "Read quotes" ON public.quotes;
DROP POLICY IF EXISTS "Read rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "Read rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Read system_unit_rates" ON public.system_unit_rates;

DROP POLICY IF EXISTS "Insert rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Update rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "Delete rfqs" ON public.rfqs;

DROP POLICY IF EXISTS "Insert rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "Update rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "Delete rfq_items" ON public.rfq_items;

DROP POLICY IF EXISTS "Write quotes" ON public.quotes;
DROP POLICY IF EXISTS "Delete quotes" ON public.quotes;

DROP POLICY IF EXISTS "Write quotation_documents" ON public.quotation_documents;
DROP POLICY IF EXISTS "Delete quotation_documents" ON public.quotation_documents;

DROP POLICY IF EXISTS "Write materials" ON public.materials;
DROP POLICY IF EXISTS "Write price history" ON public.material_price_history;
DROP POLICY IF EXISTS "Write rates" ON public.system_unit_rates;

-- 4. USER PROFILES POLICY (Standalone policy avoiding infinite recursion)
CREATE POLICY "User read self or admin" ON public.user_profiles 
  FOR SELECT USING (id = auth.uid() OR public.current_user_role() = 'admin');

-- 5. PUBLIC READ POLICIES FOR AUTHENTICATED USERS (Avoid deny-by-default on UI)
CREATE POLICY "Read casting_bom_items" ON public.casting_bom_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read casting_grades" ON public.casting_grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read hydraulic_hammer_rates" ON public.hydraulic_hammer_rates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read material_price_history" ON public.material_price_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read materials" ON public.materials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read pressing_machine_rates" ON public.pressing_machine_rates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read quotation_document_items" ON public.quotation_document_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read quotation_documents" ON public.quotation_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read quotes" ON public.quotes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read rfq_items" ON public.rfq_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read rfqs" ON public.rfqs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read system_unit_rates" ON public.system_unit_rates FOR SELECT USING (auth.role() = 'authenticated');

-- 6. WRITE & DELETE POLICIES RESTRICTED BY ROLE
-- RFQs & RFQ Items: Sales, Estimator & Admin can insert; Estimator & Admin can update; ONLY Admin can delete.
CREATE POLICY "Insert rfqs" ON public.rfqs FOR INSERT WITH CHECK (public.current_user_role() IN ('sales', 'estimator', 'admin'));
CREATE POLICY "Update rfqs" ON public.rfqs FOR UPDATE USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Delete rfqs" ON public.rfqs FOR DELETE USING (public.current_user_role() = 'admin');

CREATE POLICY "Insert rfq_items" ON public.rfq_items FOR INSERT WITH CHECK (public.current_user_role() IN ('sales', 'estimator', 'admin'));
CREATE POLICY "Update rfq_items" ON public.rfq_items FOR UPDATE USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Delete rfq_items" ON public.rfq_items FOR DELETE USING (public.current_user_role() = 'admin');

-- Quotes & Documents: Estimator & Admin can insert/update; ONLY Admin can delete.
CREATE POLICY "Write quotes" ON public.quotes FOR ALL USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Delete quotes" ON public.quotes FOR DELETE USING (public.current_user_role() = 'admin');

CREATE POLICY "Write quotation_documents" ON public.quotation_documents FOR ALL USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Delete quotation_documents" ON public.quotation_documents FOR DELETE USING (public.current_user_role() = 'admin');

-- Master Data Tables: Estimator & Admin can write
CREATE POLICY "Write materials" ON public.materials FOR ALL USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Write price history" ON public.material_price_history FOR ALL USING (public.current_user_role() IN ('estimator', 'admin'));
CREATE POLICY "Write rates" ON public.system_unit_rates FOR ALL USING (public.current_user_role() IN ('estimator', 'admin'));

-- 7. SERVER-SIDE TRIGGER TO AUTOMATICALLY SET CREATED_BY_EMAIL
CREATE OR REPLACE FUNCTION public.set_created_by_email_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_email IS NULL OR NEW.created_by_email = '' THEN
    NEW.created_by_email := COALESCE(auth.email(), 'user@disoco.vn');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_rfqs_created_by_email ON public.rfqs;
CREATE TRIGGER set_rfqs_created_by_email
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by_email_column();

-- 8. POSTGRES RPC TRANSACTION FUNCTION FOR RFQ DOSSIERS & ITEMS
CREATE OR REPLACE FUNCTION public.create_rfq_dossier_transaction(
  p_customer_name text,
  p_customer_address text,
  p_rfq_code text,
  p_contact_person text,
  p_received_date date,
  p_deadline date,
  p_trade_terms text,
  p_delivery_address text,
  p_special_requirements text,
  p_notes text,
  p_user_email text,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_rfq_id uuid;
  v_item jsonb;
BEGIN
  INSERT INTO public.rfqs (
    customer_name, customer_address, rfq_code, customer_contact_person,
    rfq_received_date, customer_deadline, trade_terms, delivery_address,
    special_requirements, notes, created_by_email
  ) VALUES (
    p_customer_name, p_customer_address, p_rfq_code, p_contact_person,
    p_received_date, p_deadline, p_trade_terms, p_delivery_address,
    p_special_requirements, p_notes, COALESCE(p_user_email, auth.email())
  ) RETURNING id INTO v_rfq_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.rfq_items (
      rfq_id, item_code, product_name, part_number, annual_volume,
      quantity_unit, target_price, technology_requirement, status, cancel_reason
    ) VALUES (
      v_rfq_id,
      v_item->>'item_code',
      v_item->>'product_name',
      v_item->>'part_number',
      (v_item->>'annual_volume')::numeric,
      COALESCE(v_item->>'quantity_unit', 'pcs/năm'),
      (v_item->>'target_price')::numeric,
      COALESCE(v_item->>'technology_requirement', 'Rèn+Gia công'),
      COALESCE(v_item->>'status', 'IN_COSTING'),
      v_item->>'cancel_reason'
    );
  END LOOP;

  RETURN jsonb_build_object('rfq_id', v_rfq_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
