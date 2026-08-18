const fs = require('fs');

let content = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

if (!content.includes("import { logAudit }")) {
  content = content.replace("import { supabase } from './supabase';", "import { supabase } from './supabase';\nimport { logAudit } from './audit-service';");
}

content = content.replace(
  "  return mappedRfq;\n}",
  "  await logAudit('CREATE_RFQ', 'rfqs', dossierId, { customer_name: dossier.customer_name, item_count: items.length });\n  return mappedRfq;\n}"
);

content = content.replace(
  "  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n}",
  "  await logAudit('SAVE_QUOTE_DRAFT', 'quotes', dbQuote.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n}"
);

content = content.replace(
  "  await supabase\n    .from('quotes')\n    .update({ status: 'QUOTED_SENT' })\n    .eq('id', record.id);\n\n  await fetchQuotes();\n  return record;\n}",
  "  await supabase\n    .from('quotes')\n    .update({ status: 'QUOTED_SENT' })\n    .eq('id', record.id);\n\n  await logAudit('SEND_QUOTE', 'quotes', record.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return record;\n}"
);

content = content.replace(
  "  if (Object.keys(timestampPayload).length > 0) {\n    await supabase.from('rfq_items').update(timestampPayload).eq('id', targetItemId);\n  }\n\n  await fetchQuotes();\n}",
  "  if (Object.keys(timestampPayload).length > 0) {\n    await supabase.from('rfq_items').update(timestampPayload).eq('id', targetItemId);\n  }\n\n  await logAudit('UPDATE_QUOTE_STATUS', 'quotes', targetItemId, { product_name: targetItem?.product_name || targetItemId, new_status: itemStatus, cancel_reason: cancelReason });\n  await fetchQuotes();\n}"
);

content = content.replace(
  "  if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n}",
  "  if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n  await logAudit('UPDATE_RFQ_ITEM', 'rfq_items', itemId, { product_name: details.product_name || 'N/A' });\n}"
);

content = content.replace(
  "  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n}",
  "  await logAudit('CREATE_RFQ_INFEASIBLE', 'rfqs', dossier.id, { product_name: rfqHeader.product_name, customer_name: rfqHeader.customer_name, cancel_reason: cancelReason });\n  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n}"
);

content = content.replace(
  "  if (error) {\n    throw new Error(`Lỗi xóa mã sản phẩm RFQ trên Supabase: ${error.message}`);\n  }\n\n  await fetchQuotes();\n}",
  "  if (error) {\n    throw new Error(`Lỗi xóa mã sản phẩm RFQ trên Supabase: ${error.message}`);\n  }\n\n  await logAudit('DELETE_RFQ', 'rfq_items', undefined, { count: itemIds.length });\n  await fetchQuotes();\n}"
);

content = content.replace(
  "  localDossiersCache = [];\n  localItemsCache = [];\n  resetQuotationDocumentsCache();\n}",
  "  localDossiersCache = [];\n  localItemsCache = [];\n  resetQuotationDocumentsCache();\n  await logAudit('RESET_SYSTEM_DATA', 'rfqs');\n}"
);

fs.writeFileSync('src/lib/quotation-service.ts', content, 'utf8');
