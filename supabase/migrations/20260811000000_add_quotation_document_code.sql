ALTER TABLE quotation_documents
  ADD COLUMN IF NOT EXISTS document_code TEXT,
  ADD COLUMN IF NOT EXISTS rfq_code TEXT,
  ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_quotation_documents_rfq_code ON quotation_documents (rfq_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotation_documents_code_unique ON quotation_documents (document_code) WHERE document_code IS NOT NULL;
