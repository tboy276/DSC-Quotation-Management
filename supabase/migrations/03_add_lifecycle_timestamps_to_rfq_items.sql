-- Bổ sung 2 mốc thời gian còn thiếu vào bảng rfq_items
ALTER TABLE public.rfq_items 
ADD COLUMN IF NOT EXISTS technical_review_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS costing_completed_at TIMESTAMPTZ;
