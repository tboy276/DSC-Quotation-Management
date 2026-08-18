const fs = require('fs');

let content = fs.readFileSync('src/lib/quotation-document-service.ts', 'utf8');

if (!content.includes("import { logAudit }")) {
  content = content.replace("import { supabase } from './supabase';", "import { supabase } from './supabase';\nimport { logAudit } from './audit-service';");
}

content = content.replace(
  "    localDocumentsCache.unshift(formattedDoc);\n    return formattedDoc;\n  }\n  return createdDoc.data as QuotationDocument;",
  "    localDocumentsCache.unshift(formattedDoc);\n    await logAudit('CREATE_DOCUMENT', 'quotation_documents', rpcResult.id, { rfq_code: rfqCode, customer_name: payload.customer_name });\n    return formattedDoc;\n  }\n  await logAudit('CREATE_DOCUMENT', 'quotation_documents', rpcResult.id, { rfq_code: rfqCode, customer_name: payload.customer_name });\n  return createdDoc.data as QuotationDocument;"
);

content = content.replace(
  "  if (error) {\n    throw new Error(`Lỗi cập nhật cấu hình hiển thị Supabase: ${error.message}`);\n  }\n\n  await fetchQuotationDocuments();",
  "  if (error) {\n    throw new Error(`Lỗi cập nhật cấu hình hiển thị Supabase: ${error.message}`);\n  }\n\n  await logAudit('UPDATE_DOCUMENT_CONFIG', 'quotation_documents', documentId, { document_id: documentId });\n  await fetchQuotationDocuments();"
);

content = content.replace(
  "export const voidQuotationDocument = async (documentId: string): Promise<void> => {\n  const { error } = await supabase.rpc('void_quotation_document_transaction', {\n    p_document_id: documentId\n  });\n\n  if (error) {\n    throw new Error(`Lỗi khi thu hồi văn bản báo giá: ${error.message}`);\n  }\n\n  await fetchQuotationDocuments();",
  "export const voidQuotationDocument = async (documentId: string, documentCode?: string, customerName?: string): Promise<void> => {\n  const { error } = await supabase.rpc('void_quotation_document_transaction', {\n    p_document_id: documentId\n  });\n\n  if (error) {\n    throw new Error(`Lỗi khi thu hồi văn bản báo giá: ${error.message}`);\n  }\n\n  await logAudit('VOID_DOCUMENT', 'quotation_documents', documentId, { document_code: documentCode || 'N/A', customer_name: customerName || 'N/A' });\n  await fetchQuotationDocuments();"
);

fs.writeFileSync('src/lib/quotation-document-service.ts', content, 'utf8');
