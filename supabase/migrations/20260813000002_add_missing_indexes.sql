-- ======================================================================
-- MIGRATION: ADD MISSING INDEXES
-- Timestamp: 20260813000002
-- ======================================================================

-- 1. Tối ưu query lọc/tìm kiếm trong buildQuotesQuery() và get_quote_counts()
-- Tăng tốc đáng kể khi lấy danh sách item theo rfq_id. Cụ thể:
-- - createRfqDossierWithItems(): join ngược từ rfqs sang rfq_items.
-- - deleteRfqDossier() / resetSystemData(): giúp Postgres tra cứu và xóa cascade các rfq_items con nhanh chóng khi xóa rfq cha.
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id 
ON public.rfq_items (rfq_id);

-- Tăng tốc cho hàm get_quote_counts() và buildQuotesQuery() khi lọc theo tab (PENDING_REVIEW, QUOTED_SENT,...)
CREATE INDEX IF NOT EXISTS idx_rfq_items_status 
ON public.rfq_items (status);

-- Tăng tốc mặc định cho phân trang trong fetchPaginatedQuotes() luôn .order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_rfq_items_created_at_desc 
ON public.rfq_items (created_at DESC);


-- 2. Tối ưu query JOIN bảng Quotes
-- Tăng tốc khi lookup quote dựa trên item id trong quá trình fetch quotes với .select('..., quote:quotes(*)')
CREATE INDEX IF NOT EXISTS idx_quotes_rfq_item_id 
ON public.quotes (rfq_item_id);


-- 3. Tối ưu query gộp Báo giá (Quotation Documents)
-- Tăng tốc truy xuất danh sách item thuộc một văn bản trong fetchQuotationDocuments()
CREATE INDEX IF NOT EXISTS idx_quotation_document_items_doc_id 
ON public.quotation_document_items (quotation_document_id);

-- Tăng tốc khi update/tham chiếu ngược tới bảng quotes trong updateDocumentItemsOrder()
CREATE INDEX IF NOT EXISTS idx_quotation_document_items_quote_id 
ON public.quotation_document_items (quote_id);
