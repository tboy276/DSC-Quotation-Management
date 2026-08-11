CREATE UNIQUE INDEX IF NOT EXISTS rfqs_rfq_code_key ON rfqs (rfq_code);
ALTER TABLE rfqs ADD CONSTRAINT rfqs_rfq_code_key UNIQUE USING INDEX rfqs_rfq_code_key;
