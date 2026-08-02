import { supabase } from './supabase';
import type {
  QuotationDocument,
  QuotationDocumentItem,
  CreateQuotationDocumentPayload,
} from '../types/quotation-document';
import { INITIAL_QUOTES } from './quotation-service';

export const DEFAULT_PAYMENT_TERMS =
  'Thanh toán 100% bằng chuyển khoản T/T trong vòng 30 ngày kể từ ngày nhận hàng và hóa đơn hợp lệ.';

export const DEFAULT_DELIVERY_NOTES =
  'Thời gian giao hàng: 30 - 45 ngày kể từ ngày xác nhận đơn hàng và ký kết hợp đồng.';

// Initial Mock Documents Seed Data
export const INITIAL_DOCUMENTS: QuotationDocument[] = [
  {
    id: 'doc-101',
    customer_name: 'Tập đoàn Honda Việt Nam',
    contact_person: 'Mr. Kenji Sato (Trưởng phòng Mua hàng)',
    contact_email: 'kenji.sato@honda.com.vn',
    quotation_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    trade_terms: 'FOB',
    currency: 'USD',
    exchange_rate: 25400,
    payment_terms: DEFAULT_PAYMENT_TERMS,
    delivery_notes: DEFAULT_DELIVERY_NOTES,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'doc-item-1',
        quotation_document_id: 'doc-101',
        quote_id: 'quote-101',
        display_order: 1,
        created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        quote: INITIAL_QUOTES[0],
      },
    ],
  },
  {
    id: 'doc-102',
    customer_name: 'Công ty Toyota Boshoku Hải Dương',
    contact_person: 'Bà Nguyễn Thị Minh (P. Khai thác Khách hàng)',
    contact_email: 'minh.nguyen@toyota-boshoku.com.vn',
    quotation_date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    trade_terms: 'CIF',
    currency: 'VND',
    exchange_rate: 1,
    payment_terms: DEFAULT_PAYMENT_TERMS,
    delivery_notes: DEFAULT_DELIVERY_NOTES,
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    items: [
      {
        id: 'doc-item-2',
        quotation_document_id: 'doc-102',
        quote_id: 'quote-102',
        display_order: 1,
        created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        quote: INITIAL_QUOTES[1],
      },
    ],
  },
];

let localDocumentsCache = [...INITIAL_DOCUMENTS];

/**
 * Fetch all Quotation Documents from Supabase DB or fallback mock data
 */
export const fetchQuotationDocuments = async (): Promise<QuotationDocument[]> => {
  try {
    const { data: dbDocs, error } = await supabase
      .from('quotation_documents')
      .select('*, items:quotation_document_items(*, quote:quotes(*, rfq:rfqs(*)))')
      .order('created_at', { ascending: false });

    if (!error && dbDocs && dbDocs.length > 0) {
      localDocumentsCache = dbDocs as QuotationDocument[];
    }
  } catch (err) {
    console.warn('Supabase DB for quotation_documents offline or not created yet. Using memory cache:', err);
  }

  return [...localDocumentsCache];
};

/**
 * Create a new Quotation Document with grouped quote items
 */
export const createQuotationDocument = async (
  payload: CreateQuotationDocumentPayload
): Promise<QuotationDocument> => {
  const now = new Date().toISOString();

  try {
    // 1. Insert into quotation_documents
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
      })
      .select()
      .single();

    if (!docErr && docData) {
      // 2. Insert items into quotation_document_items
      const itemsPayload = payload.selected_quote_ids.map((quoteId, index) => ({
        quotation_document_id: docData.id,
        quote_id: quoteId,
        display_order: index + 1,
      }));

      await supabase.from('quotation_document_items').insert(itemsPayload);

      const createdDoc = await supabase
        .from('quotation_documents')
        .select('*, items:quotation_document_items(*, quote:quotes(*, rfq:rfqs(*)))')
        .eq('id', docData.id)
        .single();

      if (createdDoc.data) {
        localDocumentsCache.unshift(createdDoc.data as QuotationDocument);
        return createdDoc.data as QuotationDocument;
      }
    }
  } catch (err) {
    console.warn('Inserting quotation_documents to Supabase failed, using memory cache:', err);
  }

  // Fallback Memory Cache Creation
  const newDocId = `doc-${Date.now()}`;
  const newItems: QuotationDocumentItem[] = payload.selected_quote_ids.map((quoteId, index) => ({
    id: `doc-item-${Date.now()}-${index}`,
    quotation_document_id: newDocId,
    quote_id: quoteId,
    display_order: index + 1,
    created_at: now,
    quote: INITIAL_QUOTES.find((q) => q.id === quoteId) || undefined,
  }));

  const newDoc: QuotationDocument = {
    id: newDocId,
    customer_name: payload.customer_name,
    contact_person: payload.contact_person,
    contact_email: payload.contact_email,
    quotation_date: payload.quotation_date,
    trade_terms: payload.trade_terms,
    currency: payload.currency,
    exchange_rate: payload.exchange_rate,
    payment_terms: payload.payment_terms,
    delivery_notes: payload.delivery_notes,
    created_at: now,
    items: newItems,
  };

  localDocumentsCache.unshift(newDoc);
  return newDoc;
};

/**
 * Reorder display_order of items inside a document
 */
export const updateDocumentItemsOrder = async (
  documentId: string,
  reorderedItems: QuotationDocumentItem[]
): Promise<void> => {
  const updatedItems = reorderedItems.map((item, index) => ({
    ...item,
    display_order: index + 1,
  }));

  try {
    for (const item of updatedItems) {
      await supabase
        .from('quotation_document_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }
  } catch (err) {
    console.warn('Updating item order in Supabase failed, using memory cache:', err);
  }

  localDocumentsCache = localDocumentsCache.map((doc) =>
    doc.id === documentId ? { ...doc, items: updatedItems } : doc
  );
};
