-- ======================================================================
-- MIGRATION: BATCH TRANSACTIONS & RPCS
-- Timestamp: 20260813000001
-- ======================================================================

-- 1. RPC: create_quotation_document_transaction
-- Wraps document insertion, item insertion and quote/rfq_item status updates into one transaction.
CREATE OR REPLACE FUNCTION public.create_quotation_document_transaction(
  p_doc_data jsonb,
  p_quote_ids uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_doc_id uuid;
  v_doc_code text;
  v_quote_id uuid;
  v_rfq_item_id uuid;
  v_order int := 1;
BEGIN
  -- Insert the main document
  INSERT INTO public.quotation_documents (
    document_code, rfq_code, revision, customer_name, contact_person, contact_email,
    quotation_date, trade_terms, currency, exchange_rate,
    payment_terms, delivery_notes, display_config
  ) VALUES (
    p_doc_data->>'document_code',
    p_doc_data->>'rfq_code',
    (p_doc_data->>'revision')::integer,
    p_doc_data->>'customer_name',
    p_doc_data->>'contact_person',
    p_doc_data->>'contact_email',
    (p_doc_data->>'quotation_date')::date,
    p_doc_data->>'trade_terms',
    p_doc_data->>'currency',
    (p_doc_data->>'exchange_rate')::numeric,
    p_doc_data->>'payment_terms',
    p_doc_data->>'delivery_notes',
    (p_doc_data->>'display_config')::jsonb
  ) RETURNING id, document_code INTO v_doc_id, v_doc_code;

  -- Loop through quote_ids
  FOREACH v_quote_id IN ARRAY p_quote_ids
  LOOP
    -- Get the parent rfq_item_id
    SELECT rfq_item_id INTO v_rfq_item_id FROM public.quotes WHERE id = v_quote_id;

    -- Insert into quotation_document_items
    INSERT INTO public.quotation_document_items (
      quotation_document_id, quote_id, display_order
    ) VALUES (
      v_doc_id, v_quote_id, v_order
    );
    
    v_order := v_order + 1;

    -- Update quotes status to QUOTED_SENT
    UPDATE public.quotes SET status = 'QUOTED_SENT', sent_at = NOW() WHERE id = v_quote_id;

    -- Update rfq_items status to QUOTED_SENT
    UPDATE public.rfq_items SET status = 'QUOTED_SENT', quoted_sent_at = NOW() WHERE id = v_rfq_item_id;
  END LOOP;

  RETURN jsonb_build_object('id', v_doc_id, 'document_code', v_doc_code);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 2. RPC: get_quote_counts
-- Aggregates counts by status using a single fast query
CREATE OR REPLACE FUNCTION public.get_quote_counts()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Uses COALESCE to replace NULL with 'TOTAL' in case we do rollup, 
  -- but we'll use UNION ALL for simplicity and explicit mapping.
  SELECT jsonb_object_agg(COALESCE(status, 'TOTAL'), cnt)
  INTO v_result
  FROM (
    SELECT status::text, count(*) as cnt FROM public.rfq_items GROUP BY status
    UNION ALL
    SELECT 'TOTAL' as status, count(*) as cnt FROM public.rfq_items
  ) t;
  
  -- Return `{}` if table is completely empty (jsonb_object_agg returns NULL)
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- 3. RPC: delete_rfq_items_transaction
-- Deletes items and automatically cleans up parent rfqs if empty.
CREATE OR REPLACE FUNCTION public.delete_rfq_items_transaction(
  p_item_ids uuid[]
) RETURNS void AS $$
DECLARE
  v_affected_rfq_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT rfq_id) INTO v_affected_rfq_ids
  FROM public.rfq_items
  WHERE id = ANY(p_item_ids) AND rfq_id IS NOT NULL;

  DELETE FROM public.rfq_items WHERE id = ANY(p_item_ids);
  
  DELETE FROM public.rfqs
  WHERE id = ANY(v_affected_rfq_ids)
    AND NOT EXISTS (SELECT 1 FROM public.rfq_items WHERE rfq_id = rfqs.id);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
