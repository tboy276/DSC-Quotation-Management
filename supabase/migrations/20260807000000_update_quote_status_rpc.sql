-- Hàm thực thi transaction update đồng thời trạng thái ở 2 bảng rfq_items và quotes
CREATE OR REPLACE FUNCTION update_quote_status_transaction(
  p_item_id UUID,
  p_item_status TEXT,
  p_quote_status TEXT,
  p_cancel_reason TEXT DEFAULT NULL,
  p_resolved_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- 1. Cập nhật bảng rfq_items
  UPDATE rfq_items
  SET 
    status = p_item_status,
    cancel_reason = COALESCE(p_cancel_reason, cancel_reason), -- Giữ nguyên nếu null
    resolved_at = COALESCE(p_resolved_at, resolved_at) -- Giữ nguyên nếu null
  WHERE id = p_item_id;

  -- 2. Cập nhật bảng quotes
  UPDATE quotes
  SET status = p_quote_status
  WHERE rfq_item_id = p_item_id;

END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Gán quyền cho các role thao tác
GRANT EXECUTE ON FUNCTION update_quote_status_transaction(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION update_quote_status_transaction(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
