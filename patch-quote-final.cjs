const fs = require('fs');

let quote = fs.readFileSync('src/lib/quotation-service.ts', 'utf8');

quote = quote.replace(
  /export const createRfqDossierWithItems = async [\s\S]*?return mappedRfq;\s*\};/,
  (match) => match.replace(/return mappedRfq;\s*\};/, "await logAudit('CREATE_RFQ', 'rfqs', dossierId, { customer_name: dossier.customer_name, item_count: items.length });\n  return mappedRfq;\n};")
);

quote = quote.replace(
  /export const saveQuoteDraft = async [\s\S]*?return dbQuote as QuoteRecord;\s*\};/,
  (match) => match.replace(/await fetchQuotes\(\);\s*return dbQuote as QuoteRecord;\s*\};/, "await logAudit('SAVE_QUOTE_DRAFT', 'quotes', dbQuote.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return dbQuote as QuoteRecord;\n};")
);

quote = quote.replace(
  /export const sendQuote = async [\s\S]*?return record;\s*\};/,
  (match) => match.replace(/await fetchQuotes\(\);\s*return record;\s*\};/, "await logAudit('SEND_QUOTE', 'quotes', record.id, { product_name: rfqItem.product_name });\n  await fetchQuotes();\n  return record;\n};")
);

quote = quote.replace(
  /export const updateQuoteStatus = async [\s\S]*?await fetchQuotes\(\);\s*\};/,
  (match) => {
    let result = match.replace(/await fetchQuotes\(\);\s*\};/, "const { data: itemData } = await supabase.from('rfq_items').select('product_name').eq('id', targetItem?.rfq_item_id || '').single();\n  await logAudit('UPDATE_QUOTE_STATUS', 'quotes', targetItemId, { product_name: itemData?.product_name || targetItem?.product_name || targetItemId, new_status: itemStatus, cancel_reason: cancelReason });\n  await fetchQuotes();\n};");
    return result;
  }
);

quote = quote.replace(
  /export const updateRfqItemDetails = async [\s\S]*?if \(error\) \{[\s\S]*?throw new Error\(`Lỗi cập nhật thông tin sản phẩm RFQ: \$\{error\.message\}`\);\s*\}\s*\};/,
  (match) => {
    return match.replace(/if \(error\) \{[\s\S]*?throw new Error\(`Lỗi cập nhật thông tin sản phẩm RFQ: \$\{error\.message\}`\);\s*\}/, "const { data: oldItem } = await supabase.from('rfq_items').select('product_name').eq('id', itemId).single();\n  if (error) {\n    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);\n  }\n  await logAudit('UPDATE_RFQ_ITEM', 'rfq_items', itemId, { product_name: details.product_name || oldItem?.product_name || 'N/A' });");
  }
);

quote = quote.replace(
  /export const cancelRfqImmediately = async [\s\S]*?return list\.find\(\(q\) => q\.rfq_item_id === createdItem\.id\)!;\s*\};/,
  (match) => match.replace(/return list\.find\(\(q\) => q\.rfq_item_id === createdItem\.id\)!;\s*\};/, "await logAudit('CREATE_RFQ_INFEASIBLE', 'rfqs', dossier.id, { product_name: rfqHeader.product_name, customer_name: rfqHeader.customer_name, cancel_reason: cancelReason });\n  return list.find((q) => q.rfq_item_id === createdItem.id)!;\n};")
);

quote = quote.replace(
  /export const deleteRfqItems = async [\s\S]*?await fetchQuotes\(\);\s*\};/,
  (match) => match.replace(/await fetchQuotes\(\);\s*\};/, "await logAudit('DELETE_RFQ', 'rfq_items', undefined, { count: itemIds.length });\n  await fetchQuotes();\n};")
);

quote = quote.replace(
  /export const resetSystemData = async \(\): Promise<void> => \{/,
  "export const resetSystemData = async (): Promise<void> => {\n  await logAudit('RESET_SYSTEM_DATA', 'rfqs');"
);

fs.writeFileSync('src/lib/quotation-service.ts', quote, 'utf8');
