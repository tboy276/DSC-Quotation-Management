import { supabase } from './supabase';
import type {
  QuotationDocument,
  QuotationDocumentItem,
  CreateQuotationDocumentPayload,
} from '../types/quotation-document';

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
    // Sửa đường dẫn relation: quotes -> rfq_items -> rfqs
    const { data: dbDocs, error } = await supabase
      .from('quotation_documents')
      .select('*, items:quotation_document_items(*, quote:quotes(*, rfqItem:rfq_items(*, rfq:rfqs(*))))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi Supabase khi tải quotation_documents:', error);
      throw new Error(`Lỗi tải danh sách văn bản báo giá từ Supabase: ${error.message}`);
    }

    if (dbDocs) {
      localDocumentsCache = dbDocs.map((doc: any) => ({
        ...doc,
        items: doc.items?.map((item: any) => {
          const rawQuote = Array.isArray(item.quote) ? item.quote[0] : item.quote;
          const rawRfqItem = rawQuote?.rfqItem || item.rfq_item;
          const rawRfq = rawRfqItem?.rfq || item.rfq;

          return {
            ...item,
            quote: rawQuote
              ? {
                  ...rawQuote,
                  rfqItem: rawRfqItem,
                  rfq: rawRfq,
                }
              : undefined,
          };
        }),
      })) as QuotationDocument[];
    }
  } catch (err: any) {
    console.error('Fetching quotation_documents error:', err);
    throw err; // Bắt buộc throw lỗi để UI hiển thị thông báo thay vì im lặng
  }

  return [...localDocumentsCache];
};

/**
 * Xác định số revision (phiên bản) kế tiếp cho 1 mã RFQ cha, dựa trên số văn bản báo giá
 * gộp đã từng phát hành cho cùng rfq_code đó. Bắt đầu từ 1.
 */
const getNextRevisionForRfqCode = async (rfqCode: string): Promise<number> => {
  const { data, error } = await supabase
    .from('quotation_documents')
    .select('revision')
    .eq('rfq_code', rfqCode)
    .order('revision', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Lỗi truy vấn số revision cho RFQ ${rfqCode}: ${error.message}`);
  }

  const maxRevision = data && data.length > 0 ? (data[0].revision || 0) : 0;
  return maxRevision + 1;
};

/**
 * Sinh mã Văn Bản Báo Giá theo quy tắc: BG-[rfq_code]-rev-XX
 */
const buildDocumentCode = (rfqCode: string, revision: number): string =>
  `BG-${rfqCode}-rev-${String(revision).padStart(2, '0')}`;

/**
 * Create a new Quotation Document with grouped quote items and mark items QUOTED_SENT
 * Strictly inserts into Supabase DB! Throws explicit error if write fails.
 */
export const createQuotationDocument = async (
  payload: CreateQuotationDocumentPayload
): Promise<QuotationDocument> => {
  const rfqCode = payload.rfq_code?.trim();
  if (!rfqCode) {
    throw new Error(
      'Không xác định được Mã RFQ cha (rfq_code) chung cho các dòng sản phẩm đã chọn. Mỗi văn bản báo giá gộp chỉ được phép chứa các dòng sản phẩm thuộc cùng 1 RFQ.'
    );
  }

  // 0. Xác định số revision & sinh document_code = BG-[rfq_code]-rev-XX
  const revision = await getNextRevisionForRfqCode(rfqCode);
  const documentCode = buildDocumentCode(rfqCode, revision);

  const docPayload = {
    document_code: documentCode,
    rfq_code: rfqCode,
    revision,
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
  };

  const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_quotation_document_transaction', {
    p_doc_data: docPayload,
    p_quote_ids: payload.selected_quote_ids
  });

  if (rpcErr || !rpcResult) {
    throw new Error(`Lỗi tạo Văn bản Báo giá (RPC) trên Supabase: ${rpcErr?.message || 'Không có dữ liệu trả về'}`);
  }

  // Refetch the created document directly using the returned id
  const createdDoc = await supabase
    .from('quotation_documents')
    .select('*, items:quotation_document_items(*, quote:quotes(*, rfqItem:rfq_items(*, rfq:rfqs(*))))')
    .eq('id', rpcResult.id)
    .single();

  if (createdDoc.data) {
    const formattedDoc = {
      ...createdDoc.data,
      items: createdDoc.data.items?.map((item: any) => {
        const rawQuote = Array.isArray(item.quote) ? item.quote[0] : item.quote;
        const rawRfqItem = rawQuote?.rfqItem || item.rfq_item;
        const rawRfq = rawRfqItem?.rfq || item.rfq;
        return {
          ...item,
          quote: rawQuote
            ? {
                ...rawQuote,
                rfqItem: rawRfqItem,
                rfq: rawRfq,
              }
            : undefined,
        };
      }),
    } as QuotationDocument;
    localDocumentsCache.unshift(formattedDoc);
    return formattedDoc;
  }
  return createdDoc.data as QuotationDocument;
};

/**
 * Reorder display_order of items inside a document on Supabase
 */
export const updateDocumentItemsOrder = async (
  _documentId: string,
  reorderedItems: QuotationDocumentItem[]
): Promise<void> => {
  const updatedItems = reorderedItems.map((item, index) => ({
    id: item.id,
    quotation_document_id: item.quotation_document_id,
    quote_id: item.quote_id,
    display_order: index + 1,
  }));

  const { error } = await supabase
    .from('quotation_document_items')
    .upsert(updatedItems, { onConflict: 'id' });

  if (error) {
    throw new Error(`Lỗi cập nhật thứ tự dòng Supabase: ${error.message}`);
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

/**
 * Void a quotation document and revert its items to READY_FOR_QUOTE
 */
export const voidQuotationDocument = async (documentId: string): Promise<void> => {
  const { error } = await supabase.rpc('void_quotation_document_transaction', {
    p_document_id: documentId
  });

  if (error) {
    throw new Error(`Lỗi khi thu hồi văn bản báo giá: ${error.message}`);
  }

  await fetchQuotationDocuments();
};
