-- 1. Add status column to quotation_documents
ALTER TABLE public.quotation_documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE', 'VOIDED'));

-- 2. Create RPC to void document in a transaction
CREATE OR REPLACE FUNCTION public.void_quotation_document_transaction(p_document_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_status text;
  v_quote_id uuid;
  v_rfq_item_id uuid;
BEGIN
  -- Lock row to prevent race conditions
  SELECT status INTO v_status FROM public.quotation_documents WHERE id = p_document_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Văn bản báo giá không tồn tại';
  END IF;

  IF v_status = 'VOIDED' THEN
    RAISE EXCEPTION 'Văn bản này đã được thu hồi trước đó';
  END IF;

  -- 1. Update document status
  UPDATE public.quotation_documents SET status = 'VOIDED' WHERE id = p_document_id;

  -- 2. Revert quote/item statuses
  FOR v_quote_id IN
    SELECT quote_id FROM public.quotation_document_items WHERE quotation_document_id = p_document_id
  LOOP
    SELECT rfq_item_id INTO v_rfq_item_id FROM public.quotes WHERE id = v_quote_id;

    IF v_rfq_item_id IS NOT NULL THEN
      UPDATE public.rfq_items SET status = 'READY_FOR_QUOTE', updated_at = NOW() WHERE id = v_rfq_item_id;
      UPDATE public.quotes SET status = 'DRAFT', updated_at = NOW() WHERE id = v_quote_id;
    END IF;
  END LOOP;
END;
$$;
