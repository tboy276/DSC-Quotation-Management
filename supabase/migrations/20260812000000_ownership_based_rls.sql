-- ======================================================================
-- MIGRATION: OWNERSHIP-BASED RLS & ROLES REFACTORING
-- Timestamp: 20260812000000
-- ======================================================================

-- 1. SCHEMA UPDATES
-- Add created_by column to rfqs and quotation_documents if they don't exist
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.quotation_documents ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. TRIGGERS FOR created_by AND created_by_email
-- Update set_created_by_email_column to strictly set created_by and created_by_email
CREATE OR REPLACE FUNCTION public.set_created_by_email_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set created_by to the authenticated user's ID
  NEW.created_by := auth.uid();
  -- Always set created_by_email to the authenticated user's email
  NEW.created_by_email := COALESCE(auth.email(), 'user@disoco.vn');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists on rfqs (replaces the existing one if any)
DROP TRIGGER IF EXISTS set_rfqs_created_by_email ON public.rfqs;
CREATE TRIGGER set_rfqs_created_by_email
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by_email_column();

-- Create a similar trigger function for quotation_documents (only created_by)
CREATE OR REPLACE FUNCTION public.set_quotation_documents_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_quotation_documents_created_by ON public.quotation_documents;
CREATE TRIGGER set_quotation_documents_created_by
  BEFORE INSERT ON public.quotation_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_quotation_documents_created_by();


-- 3. DROP EXISTING POLICIES (TO AVOID CONFLICTS)
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

-- Re-drop other potentially existing specific write policies on master data
DROP POLICY IF EXISTS "Write casting_bom_items" ON public.casting_bom_items;
DROP POLICY IF EXISTS "Write casting_grades" ON public.casting_grades;
DROP POLICY IF EXISTS "Write pressing_machine_rates" ON public.pressing_machine_rates;
DROP POLICY IF EXISTS "Write hydraulic_hammer_rates" ON public.hydraulic_hammer_rates;


-- 4. RLS POLICIES REDEFINITION

-- a) rfqs
CREATE POLICY "Insert rfqs" ON public.rfqs
  FOR INSERT WITH CHECK (public.current_user_role() IN ('sales', 'admin'));

CREATE POLICY "Update rfqs" ON public.rfqs
  FOR UPDATE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Delete rfqs" ON public.rfqs
  FOR DELETE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

-- b) rfq_items (Ownership inherited from rfqs via rfq_id)
CREATE POLICY "Insert rfq_items" ON public.rfq_items
  FOR INSERT WITH CHECK (
    public.current_user_role() IN ('sales', 'admin') AND
    EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND (r.created_by = auth.uid() OR public.current_user_role() = 'admin'))
  );

CREATE POLICY "Update rfq_items" ON public.rfq_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_items.rfq_id AND (r.created_by = auth.uid() OR public.current_user_role() = 'admin'))
  );

CREATE POLICY "Delete rfq_items" ON public.rfq_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_items.rfq_id AND (r.created_by = auth.uid() OR public.current_user_role() = 'admin'))
  );

-- c) quotes (Ownership inherited from rfqs via rfq_item_id -> rfq_items.rfq_id)
CREATE POLICY "Write quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.rfq_items ri JOIN public.rfqs r ON r.id = ri.rfq_id
      WHERE ri.id = quotes.rfq_item_id AND (r.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfq_items ri JOIN public.rfqs r ON r.id = ri.rfq_id
      WHERE ri.id = quotes.rfq_item_id AND (r.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  );

-- d) quotation_documents
CREATE POLICY "Insert quotation_documents" ON public.quotation_documents
  FOR INSERT WITH CHECK (public.current_user_role() IN ('sales', 'admin'));

CREATE POLICY "Update quotation_documents" ON public.quotation_documents
  FOR UPDATE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Delete quotation_documents" ON public.quotation_documents
  FOR DELETE USING (created_by = auth.uid() OR public.current_user_role() = 'admin');

-- e) quotation_document_items (Ownership inherited from quotation_documents)
CREATE POLICY "Write quotation_document_items" ON public.quotation_document_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotation_documents d
      WHERE d.id = quotation_document_items.quotation_document_id AND (d.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotation_documents d
      WHERE d.id = quotation_document_items.quotation_document_id AND (d.created_by = auth.uid() OR public.current_user_role() = 'admin')
    )
  );

-- f) Master Data Tables (admin ONLY)
CREATE POLICY "Write materials" ON public.materials FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write price history" ON public.material_price_history FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write rates" ON public.system_unit_rates FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write casting_bom_items" ON public.casting_bom_items FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write casting_grades" ON public.casting_grades FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write pressing_machine_rates" ON public.pressing_machine_rates FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Write hydraulic_hammer_rates" ON public.hydraulic_hammer_rates FOR ALL USING (public.current_user_role() = 'admin');


-- 5. RPC FUNCTION MODIFICATION: create_rfq_dossier_transaction
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
  p_user_email text, -- Kept for signature compatibility, but ignored for determining ownership
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_rfq_id uuid;
  v_item jsonb;
BEGIN
  -- Access Control Check (SECURITY DEFINER bypasses RLS)
  IF public.current_user_role() NOT IN ('sales', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only sales or admin can create RFQ dossiers.';
  END IF;

  -- Insert into rfqs. Note: created_by and created_by_email will be overwritten by the BEFORE INSERT trigger anyway,
  -- but we'll also explicitly set created_by_email using auth.email() here just to be safe.
  INSERT INTO public.rfqs (
    customer_name, customer_address, rfq_code, customer_contact_person,
    rfq_received_date, customer_deadline, trade_terms, delivery_address,
    special_requirements, notes, created_by_email
  ) VALUES (
    p_customer_name, p_customer_address, p_rfq_code, p_contact_person,
    p_received_date, p_deadline, p_trade_terms, p_delivery_address,
    p_special_requirements, p_notes, COALESCE(auth.email(), 'user@disoco.vn')
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
