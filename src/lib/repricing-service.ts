import { supabase } from './supabase';
import type { QuotationDocument } from '../types/quotation-document';
import type { RfqDossier } from '../types/quote';
import { createRfqDossierWithItems, updateQuoteStatus } from './quotation-service';
import { formatDate } from './format-date';

export const createRepricingRfqFromDocument = async (
  document: QuotationDocument,
  userEmail: string
): Promise<{ newRfq: RfqDossier; newItemIds: string[] }> => {
  // 1. Check constraints
  if (document.status === 'VOIDED') {
    throw new Error('Không thể tái báo giá từ văn bản đã bị thu hồi.');
  }

  const allSuccessful = document.items?.every(
    (it) => (it.quote?.rfqItem?.status || it.quote?.status) === 'SUCCESSFUL'
  );

  if (!allSuccessful) {
    throw new Error('Chỉ được tái báo giá khi TẤT CẢ các dòng trong văn bản đã ở trạng thái THÀNH CÔNG (SUCCESSFUL).');
  }

  // 2. Sort items by display_order
  const sortedItems = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);

  // 3. Get original RFQ header info
  let customer_address = '';
  let customer_deadline = new Date().toISOString().split('T')[0];
  let special_requirements = '';
  let delivery_address = '';

  const firstItemQuote = sortedItems[0]?.quote;
  if (firstItemQuote?.rfq) {
    customer_address = firstItemQuote.rfq.customer_address || '';
    customer_deadline = firstItemQuote.rfq.customer_deadline || customer_deadline;
    special_requirements = firstItemQuote.rfq.special_requirements || '';
    delivery_address = firstItemQuote.rfq.delivery_address || '';
  } else if (document.rfq_code) {
    const { data: rfqInfo } = await supabase
      .from('rfqs')
      .select('customer_address, customer_deadline, special_requirements, delivery_address')
      .eq('rfq_code', document.rfq_code)
      .limit(1)
      .single();
    
    if (rfqInfo) {
      customer_address = rfqInfo.customer_address || '';
      customer_deadline = rfqInfo.customer_deadline || customer_deadline;
      special_requirements = rfqInfo.special_requirements || '';
      delivery_address = rfqInfo.delivery_address || '';
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = formatDate(todayStr);

  // 4. Create new RFQ Dossier
  const newRfqData = await createRfqDossierWithItems(
    {
      customer_name: document.customer_name,
      customer_address: customer_address,
      customer_contact_person: document.contact_person,
      rfq_received_date: todayStr,
      customer_deadline: customer_deadline, // Keep original deadline or could add days
      trade_terms: document.trade_terms,
      delivery_address: delivery_address,
      special_requirements: special_requirements,
      notes: `Tái báo giá tự động từ văn bản ${document.document_code || document.id}, ngày ${todayFormatted}.`,
    },
    sortedItems.map((it) => {
      const rItem = it.quote!.rfqItem!;
      return {
        product_name: rItem.product_name,
        part_number: rItem.part_number,
        annual_volume: rItem.annual_volume,
        quantity_unit: rItem.quantity_unit,
        target_price: rItem.target_price,
        technology_requirement: rItem.technology_requirement,
        is_feasible: true,
      };
    }),
    userEmail
  );

  const rfqId = newRfqData.id;
  const newRfqCode = newRfqData.rfq_code;
  const createdItems = (newRfqData as any).items || [];
  
  // Create an array of item IDs sorted to match the input items order
  // Note: createRfqDossierWithItems creates items in the order they were provided.
  // The items returned by supabase might not be sorted, so we sort them by item_code which includes the index.
  createdItems.sort((a: any, b: any) => a.item_code.localeCompare(b.item_code));
  const itemIds = createdItems.map((item: any) => item.id);

  // 5. Insert quotes and update status
  for (let i = 0; i < itemIds.length; i++) {
    const newItemId = itemIds[i];
    const oldQuote = sortedItems[i].quote!;

    // 5a. Insert quotes
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        rfq_item_id: newItemId,
        segment: oldQuote.segment,
        inputs_json: oldQuote.inputs_json,
        results_json: oldQuote.results_json,
        currency: oldQuote.currency,
        exchange_rate: oldQuote.exchange_rate,
        die_cost_treatment: oldQuote.die_cost_treatment,
        final_quoted_price: oldQuote.final_quoted_price,
        status: 'DRAFT',
        created_by_email: userEmail,
      })
      .select('id')
      .single();

    if (quoteError || !quoteData) {
      throw new Error(`Lỗi tạo bản nháp tính giá cho dòng số ${i + 1}: ${quoteError?.message}`);
    }

    // 5b. Update status to IN_COSTING (bypasses PENDING_REVIEW)
    await updateQuoteStatus(quoteData.id, 'IN_COSTING');
  }

  // 6. Update source_document_id on the new RFQ
  const { error: updateError } = await supabase
    .from('rfqs')
    .update({ source_document_id: document.id })
    .eq('id', rfqId);

  if (updateError) {
    throw new Error(`Lỗi gán source_document_id: ${updateError.message}`);
  }

  // 7. Return new RFQ object
  const newRfq: RfqDossier = {
    id: rfqId,
    customer_name: document.customer_name,
    customer_address: customer_address,
    rfq_code: newRfqCode,
    customer_contact_person: document.contact_person,
    rfq_received_date: todayStr,
    customer_deadline: customer_deadline,
    trade_terms: document.trade_terms as any,
    delivery_address: delivery_address,
    special_requirements: special_requirements,
    notes: `Tái báo giá tự động từ văn bản ${document.document_code || document.id}, ngày ${todayFormatted}.`,
    source_document_id: document.id,
    created_at: new Date().toISOString(),
  };

  return { newRfq, newItemIds: itemIds };
};
