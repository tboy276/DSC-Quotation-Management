-- ======================================================================
-- MIGRATION: ADD SEARCH_TEXT COLUMN, GIN INDEX, AND COMPUTED COLUMNS
-- Timestamp: 20260813000000
-- ======================================================================

-- 1. Create the search_text column
ALTER TABLE public.rfq_items ADD COLUMN IF NOT EXISTS search_text TEXT;

-- 2. Create function to generate search text for a single rfq_item_id
CREATE OR REPLACE FUNCTION public.generate_rfq_item_search_text(p_item_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_search_text TEXT;
BEGIN
  SELECT 
    COALESCE(i.product_name, '') || ' ' || 
    COALESCE(i.part_number, '') || ' ' || 
    COALESCE(i.id::text, '') || ' ' || 
    COALESCE(r.customer_name, '') || ' ' || 
    COALESCE(r.created_by_email, '') || ' ' ||
    COALESCE(r.rfq_code, '')
  INTO v_search_text
  FROM public.rfq_items i
  LEFT JOIN public.rfqs r ON r.id = i.rfq_id
  WHERE i.id = p_item_id;

  RETURN v_search_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for rfq_items (BEFORE INSERT OR UPDATE)
-- Since we need to join with rfqs to get customer_name etc., a BEFORE trigger can query rfqs.
CREATE OR REPLACE FUNCTION public.update_rfq_item_search_text_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- We query the rfqs table directly using the NEW.rfq_id
  NEW.search_text := (
    SELECT 
      COALESCE(NEW.product_name, '') || ' ' || 
      COALESCE(NEW.part_number, '') || ' ' || 
      COALESCE(NEW.id::text, '') || ' ' || 
      COALESCE(r.customer_name, '') || ' ' || 
      COALESCE(r.created_by_email, '') || ' ' ||
      COALESCE(r.rfq_code, '')
    FROM public.rfqs r 
    WHERE r.id = NEW.rfq_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rfq_item_search_text ON public.rfq_items;
CREATE TRIGGER trg_update_rfq_item_search_text
  BEFORE INSERT OR UPDATE OF product_name, part_number, rfq_id
  ON public.rfq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rfq_item_search_text_trigger();

-- 4. Trigger for rfqs (AFTER UPDATE)
-- When an RFQ is updated (e.g. customer_name changes), update all child rfq_items
CREATE OR REPLACE FUNCTION public.update_rfqs_search_text_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- We just touch the rfq_items so their BEFORE trigger fires,
  -- or we manually update their search_text here to be more efficient.
  UPDATE public.rfq_items
  SET search_text = COALESCE(product_name, '') || ' ' || 
                    COALESCE(part_number, '') || ' ' || 
                    COALESCE(id::text, '') || ' ' || 
                    COALESCE(NEW.customer_name, '') || ' ' || 
                    COALESCE(NEW.created_by_email, '') || ' ' ||
                    COALESCE(NEW.rfq_code, '')
  WHERE rfq_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_rfqs_search_text ON public.rfqs;
CREATE TRIGGER trg_update_rfqs_search_text
  AFTER UPDATE OF customer_name, created_by_email, rfq_code
  ON public.rfqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rfqs_search_text_trigger();

-- 5. Backfill existing records
UPDATE public.rfq_items SET search_text = public.generate_rfq_item_search_text(id) WHERE search_text IS NULL;

-- 6. Enable pg_trgm and create GIN index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS idx_rfq_items_search_text_trgm;
CREATE INDEX idx_rfq_items_search_text_trgm 
  ON public.rfq_items USING gin (search_text gin_trgm_ops);

-- 7. Computed column for quote_segment to allow direct filtering via PostgREST
CREATE OR REPLACE FUNCTION public.quote_segment(item public.rfq_items)
RETURNS TEXT AS $$
  SELECT segment FROM public.quotes WHERE rfq_item_id = item.id LIMIT 1;
$$ LANGUAGE sql STABLE;
