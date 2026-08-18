const fs = require('fs');

let content = fs.readFileSync('src/lib/quotation-document-service.ts', 'utf8');

// For createQuotationDocument
content = content.replace(
  /localDocumentsCache\.unshift\(formattedDoc\);\r?\n\s*return formattedDoc;\r?\n\s*\}\r?\n\s*return createdDoc\.data as QuotationDocument;/g,
  "localDocumentsCache.unshift(formattedDoc);\n    await logAudit('CREATE_DOCUMENT', 'quotation_documents', rpcResult.id, { rfq_code: rfqCode, customer_name: payload.customer_name });\n    return formattedDoc;\n  }\n  await logAudit('CREATE_DOCUMENT', 'quotation_documents', rpcResult.id, { rfq_code: rfqCode, customer_name: payload.customer_name });\n  return createdDoc.data as QuotationDocument;"
);

// For updateDocumentDisplayConfig
content = content.replace(
  /if \(error\) \{\r?\n\s*throw new Error\(`Lỗi cập nhật cấu hình hiển thị Supabase: \$\{error\.message\}`\);\r?\n\s*\}\r?\n\r?\n\s*await fetchQuotationDocuments\(\);/g,
  "if (error) {\n    throw new Error(`Lỗi cập nhật cấu hình hiển thị Supabase: ${error.message}`);\n  }\n\n  await logAudit('UPDATE_DOCUMENT_CONFIG', 'quotation_documents', documentId, { document_id: documentId });\n  await fetchQuotationDocuments();"
);

// For voidQuotationDocument
content = content.replace(
  /export const voidQuotationDocument = async \(documentId: string\): Promise<void> => \{\r?\n\s*const \{ error \} = await supabase\.rpc\('void_quotation_document_transaction', \{\r?\n\s*p_document_id: documentId\r?\n\s*\}\);\r?\n\r?\n\s*if \(error\) \{\r?\n\s*throw new Error\(`Lỗi khi thu hồi văn bản báo giá: \$\{error\.message\}`\);\r?\n\s*\}\r?\n\r?\n\s*await fetchQuotationDocuments\(\);/g,
  "export const voidQuotationDocument = async (documentId: string, documentCode?: string, customerName?: string): Promise<void> => {\n  const { error } = await supabase.rpc('void_quotation_document_transaction', {\n    p_document_id: documentId\n  });\n\n  if (error) {\n    throw new Error(`Lỗi khi thu hồi văn bản báo giá: ${error.message}`);\n  }\n\n  await logAudit('VOID_DOCUMENT', 'quotation_documents', documentId, { document_code: documentCode || 'N/A', customer_name: customerName || 'N/A' });\n  await fetchQuotationDocuments();"
);

fs.writeFileSync('src/lib/quotation-document-service.ts', content, 'utf8');

let quote = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

quote = quote.replace(/return mappedRfq;\r?\n\}/g, "await logAudit('CREATE_RFQ', 'rfqs', dossierId, { customer_name: dossier.customer_name, item_count: items.length });\n  return mappedRfq;\n}");
quote = quote.replace(/await fetchQuotes\(\);\r?\n\s*return dbQuote as QuoteRecord;\r?\n\}/g, "await logAudit('SAVE_QUOTE_DRAFT', 'quotes', dbQuote.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n}");
quote = quote.replace(/await fetchQuotes\(\);\r?\n\s*return record;\r?\n\}/g, "await logAudit('SEND_QUOTE', 'quotes', record.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return record;\n}");
quote = quote.replace(/await fetchQuotes\(\);\r?\n\}/g, "await logAudit('UPDATE_QUOTE_STATUS', 'quotes', targetItemId, { product_name: targetItem?.product_name || targetItemId, new_status: itemStatus, cancel_reason: cancelReason });\n  await fetchQuotes();\n}");
quote = quote.replace(/if \(error\) \{\r?\n\s*throw new Error\(`Lỗi cập nhật thông tin sản phẩm RFQ: \$\{error\.message\}`\);\r?\n\s*\}\r?\n\}/g, "if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n  await logAudit('UPDATE_RFQ_ITEM', 'rfq_items', itemId, { product_name: details.product_name || 'N/A' });\n}");
quote = quote.replace(/return list\.find\(\(q\) => q\.rfq_item_id === createdItem\.id\)!;\r?\n\}/g, "await logAudit('CREATE_RFQ_INFEASIBLE', 'rfqs', dossier.id, { product_name: rfqHeader.product_name, customer_name: rfqHeader.customer_name, cancel_reason: cancelReason });\n  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n}");
quote = quote.replace(/if \(error\) \{\r?\n\s*throw new Error\(`Lỗi xóa mã sản phẩm RFQ trên Supabase: \$\{error\.message\}`\);\r?\n\s*\}\r?\n\r?\n\s*await fetchQuotes\(\);\r?\n\}/g, "if (error) {\n    throw new Error(`Lỗi xóa mã sản phẩm RFQ trên Supabase: ${error.message}`);\n  }\n\n  await logAudit('DELETE_RFQ', 'rfq_items', undefined, { count: itemIds.length });\n  await fetchQuotes();\n}");
quote = quote.replace(/resetQuotationDocumentsCache\(\);\r?\n\}/g, "resetQuotationDocumentsCache();\n  await logAudit('RESET_SYSTEM_DATA', 'rfqs');\n}");

fs.writeFileSync('src/lib/quotation-service.ts', quote, 'utf8');
