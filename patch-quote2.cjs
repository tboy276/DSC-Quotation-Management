const fs = require('fs');

let quote = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

if (!quote.includes("import { logAudit }")) {
  quote = quote.replace("import { supabase } from './supabase';", "import { supabase } from './supabase';\nimport { logAudit } from './audit-service';");
}

quote = quote.replace(
  /export const createRfqDossierWithItems = async \([\s\S]*?return mappedRfq;\r?\n\}/,
  (match) => match.replace("  return mappedRfq;\n}", "  await logAudit('CREATE_RFQ', 'rfqs', dossierId, { customer_name: dossier.customer_name, item_count: items.length });\n  return mappedRfq;\n}")
);

quote = quote.replace(
  /export const saveQuoteDraft = async \([\s\S]*?return dbQuote as QuoteRecord;\r?\n\}/,
  (match) => match.replace("  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n}", "  await logAudit('SAVE_QUOTE_DRAFT', 'quotes', dbQuote.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n}")
);

quote = quote.replace(
  /export const sendQuote = async \([\s\S]*?return record;\r?\n\}/,
  (match) => match.replace("  await fetchQuotes();\n  return record;\n}", "  await logAudit('SEND_QUOTE', 'quotes', record.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return record;\n}")
);

quote = quote.replace(
  /export const updateQuoteStatus = async \([\s\S]*?await fetchQuotes\(\);\r?\n\}/,
  (match) => match.replace("  await fetchQuotes();\n}", "  await logAudit('UPDATE_QUOTE_STATUS', 'quotes', targetItemId, { product_name: targetItem?.product_name || targetItemId, new_status: itemStatus, cancel_reason: cancelReason });\n  await fetchQuotes();\n}")
);

quote = quote.replace(
  /export const updateRfqItemDetails = async \([\s\S]*?if \(error\) \{\r?\n\s*throw new Error\(`Lỗi cập nhật thông tin sản phẩm RFQ: \$\{error.message\}`\);\r?\n\s*\}\r?\n\}/,
  (match) => match.replace("  if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n}", "  if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n  await logAudit('UPDATE_RFQ_ITEM', 'rfq_items', itemId, { product_name: details.product_name || 'N/A' });\n}")
);

quote = quote.replace(
  /export const cancelRfqImmediately = async \([\s\S]*?return list\.find\(\(q\) => q\.rfq_item_id === createdItem\.id\)!;\r?\n\}/,
  (match) => match.replace("  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n}", "  await logAudit('CREATE_RFQ_INFEASIBLE', 'rfqs', dossier.id, { product_name: rfqHeader.product_name, customer_name: rfqHeader.customer_name, cancel_reason: cancelReason });\n  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n}")
);

quote = quote.replace(
  /export const deleteRfqItems = async \([\s\S]*?await fetchQuotes\(\);\r?\n\}/,
  (match) => match.replace("  await fetchQuotes();\n}", "  await logAudit('DELETE_RFQ', 'rfq_items', undefined, { count: itemIds.length });\n  await fetchQuotes();\n}")
);

quote = quote.replace(
  /export const resetSystemData = async \(\): Promise<void> => \{[\s\S]*?resetQuotationDocumentsCache\(\);\r?\n\}/,
  (match) => match.replace("  resetQuotationDocumentsCache();\n}", "  resetQuotationDocumentsCache();\n  await logAudit('RESET_SYSTEM_DATA', 'rfqs');\n}")
);

fs.writeFileSync('src/lib/quotation-service.ts', quote, 'utf8');
