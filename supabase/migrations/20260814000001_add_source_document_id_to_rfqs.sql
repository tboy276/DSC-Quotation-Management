ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS source_document_id UUID
    REFERENCES public.quotation_documents(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.rfqs.source_document_id IS
  'Trỏ về quotation_documents.id nếu RFQ này được sinh tự động từ nút Cập nhật báo giá (tái báo giá cho 1 đợt sản phẩm đã SUCCESSFUL). NULL nếu là RFQ tạo bình thường qua Tab 1.';
