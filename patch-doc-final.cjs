const fs = require('fs');

let doc = fs.readFileSync('src/lib/quotation-document-service.ts', 'utf8');

doc = doc.replace(
  /export const updateDocumentDisplayConfig = async \([\s\S]*?await fetchQuotationDocuments\(\);\s*\};/,
  `export const updateDocumentDisplayConfig = async (
  documentId: string,
  displayConfig: NonNullable<QuotationDocument['display_config']>
): Promise<void> => {
  const { data: docData } = await supabase.from('quotation_documents').select('document_code').eq('id', documentId).single();
  const { error } = await supabase
    .from('quotation_documents')
    .update({ display_config: displayConfig })
    .eq('id', documentId);

  if (error) {
    throw new Error(\`Lỗi cập nhật cấu hình hiển thị Supabase: \${error.message}\`);
  }

  await logAudit('UPDATE_DOCUMENT_CONFIG', 'quotation_documents', documentId, { document_code: docData?.document_code || documentId });
  await fetchQuotationDocuments();
};`
);

fs.writeFileSync('src/lib/quotation-document-service.ts', doc, 'utf8');
