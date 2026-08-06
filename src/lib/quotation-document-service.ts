import { supabase } from './supabase';
import type {
  QuotationDocument,
  QuotationDocumentItem,
  CreateQuotationDocumentPayload,
} from '../types/quotation-document';
import { updateQuoteStatus } from './quotation-service';

export const DEFAULT_PAYMENT_TERMS =
  'Thanh toán 100% bằng chuyển khoản T/T trong vòng 30 ngày kể từ ngày nhận hàng và hóa đơn hợp lệ.';

export const DEFAULT_DELIVERY_NOTES =
  'Thời gian giao hàng: 30 - 45 ngày kể từ ngày xác nhận đơn hàng và ký kết hợp đồng.';

export const INITIAL_DOCUMENTS: QuotationDocument[] = [];
let localDocumentsCache: QuotationDocument[] = [];

export const resetQuotationDocumentsCache = () => {
  localDocumentsCache = [];
};

/**
 * Fetch all Quotation Documents from Supabase DB
 */
export const fetchQuotationDocuments = async (): Promise<QuotationDocument[]> => {
  try {
    const { data: dbDocs, error } = await supabase
      .from('quotation_documents')
      .select('*, items:quotation_document_items(*, quote:quotes(*, rfq:rfqs(*)))')
      .order('created_at', { ascending: false });

    if (!error && dbDocs) {
      localDocumentsCache = dbDocs.map((doc: any) => ({
        ...doc,
        items: doc.items?.map((item: any) => ({
          ...item,
          quote: Array.isArray(item.quote) ? item.quote[0] : item.quote
        }))
      })) as QuotationDocument[];
    }
  } catch (err) {
    console.warn('Fetching quotation_documents from Supabase error:', err);
  }

  return [...localDocumentsCache];
};

/**
 * Create a new Quotation Document with grouped quote items and mark items QUOTED_SENT
 * Strictly inserts into Supabase DB! Throws explicit error if write fails.
 */
export const createQuotationDocument = async (
  payload: CreateQuotationDocumentPayload
): Promise<QuotationDocument> => {
  // 1. Insert into quotation_documents table
  const { data: docData, error: docErr } = await supabase
    .from('quotation_documents')
    .insert({
      customer_name: payload.customer_name,
      contact_person: payload.contact_person,
      contact_email: payload.contact_email,
      quotation_date: payload.quotation_date,
      trade_terms: payload.trade_terms,
      currency: payload.currency,
      exchange_rate: payload.exchange_rate,
      payment_terms: payload.payment_terms,
      delivery_notes: payload.delivery_notes,
      display_config: payload.display_config,
    })
    .select()
    .single();

  if (docErr || !docData) {
    throw new Error(`Lỗi tạo Văn bản Báo giá trên Supabase: ${docErr?.message || 'Không có dữ liệu trả về'}`);
  }

  // 2. Insert items into quotation_document_items
  const itemsPayload = payload.selected_quote_ids.map((quoteId, index) => ({
    quotation_document_id: docData.id,
    quote_id: quoteId,
    display_order: index + 1,
  }));

  const { error: itemsErr } = await supabase
    .from('quotation_document_items')
    .insert(itemsPayload);

  if (itemsErr) {
    throw new Error(`Lỗi liên kết dòng sản phẩm Văn bản Báo giá Supabase: ${itemsErr.message}`);
  }

  // 3. Update status of all selected items to QUOTED_SENT
  for (const quoteId of payload.selected_quote_ids) {
    await updateQuoteStatus(quoteId, 'QUOTED_SENT');
  }

  const createdDoc = await supabase
    .from('quotation_documents')
    .select('*, items:quotation_document_items(*, quote:quotes(*, rfq:rfqs(*)))')
    .eq('id', docData.id)
    .single();

  if (createdDoc.data) {
    localDocumentsCache.unshift(createdDoc.data as QuotationDocument);
    return createdDoc.data as QuotationDocument;
  }

  return docData as QuotationDocument;
};

/**
 * Reorder display_order of items inside a document on Supabase
 */
export const updateDocumentItemsOrder = async (
  _documentId: string,
  reorderedItems: QuotationDocumentItem[]
): Promise<void> => {
  const updatedItems = reorderedItems.map((item, index) => ({
    ...item,
    display_order: index + 1,
  }));

  for (const item of updatedItems) {
    const { error } = await supabase
      .from('quotation_document_items')
      .update({ display_order: item.display_order })
      .eq('id', item.id);

    if (error) {
      throw new Error(`Lỗi cập nhật thứ tự dòng Supabase: ${error.message}`);
    }
  }

  await fetchQuotationDocuments();
};

/**
 * Update display_config for an existing document on Supabase
 */
export const updateDocumentDisplayConfig = async (
  documentId: string,
  displayConfig: NonNullable<QuotationDocument['display_config']>
): Promise<void> => {
  const { error } = await supabase
    .from('quotation_documents')
    .update({ display_config: displayConfig })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Lỗi cập nhật cấu hình hiển thị Supabase: ${error.message}`);
  }

  await fetchQuotationDocuments();
};
