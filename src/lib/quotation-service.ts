import { supabase } from './supabase';
import type {
  QuoteRecord,
  RfqDossier,
  RfqItemRecord,
  RfqItemStatus,
  QuotationFilterOptions,
  CurrencyType,
} from '../types/quote';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from './calculation-engine/types';
import type { SegmentType } from '../store/useQuotationStore';
import { resetQuotationDocumentsCache } from './quotation-document-service';

// ----------------------------------------------------------------------
// INITIAL MOCK DATA SEED (Clean default state)
// ----------------------------------------------------------------------

export const INITIAL_DOSSIERS: RfqDossier[] = [];
export const INITIAL_RFQ_ITEMS: RfqItemRecord[] = [];
export const INITIAL_QUOTES: QuoteRecord[] = [];

// Local memory caches strictly used as read buffer for UI
let localDossiersCache: RfqDossier[] = [];
let localItemsCache: RfqItemRecord[] = [];
let localQuotesCache: QuoteRecord[] = [];

/**
 * Fetch all RFQ Items joined with Quote calculations & Dossier Headers from Supabase
 */
export const fetchQuotes = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  try {
    const { data: dbItems, error } = await supabase
      .from('rfq_items')
      .select('*, rfq:rfqs(*), quote:quotes(*)')
      .order('created_at', { ascending: false });

    if (!error && dbItems) {
      localItemsCache = dbItems as any[];
    }
  } catch (err) {
    console.warn('Fetching rfq_items from Supabase error:', err);
  }

  // Construct complete QuoteRecord list
  let list: QuoteRecord[] = localItemsCache.map((item) => {
    const parentDossier = localDossiersCache.find((d) => d.id === item.rfq_id) || item.rfq;
    const existingQuote = localQuotesCache.find((q) => q.rfq_item_id === item.id) || item.quote;

    return {
      id: existingQuote?.id || `quote-${item.id}`,
      rfq_item_id: item.id,
      segment: existingQuote?.segment || 'forging',
      status: item.status,
      currency: existingQuote?.currency || 'VND',
      exchange_rate: existingQuote?.exchange_rate || 1,
      die_cost_treatment: existingQuote?.die_cost_treatment || 'amortized',
      final_quoted_price: existingQuote?.final_quoted_price || 0,
      created_at: item.created_at,
      sent_at: item.quoted_sent_at || existingQuote?.sent_at,
      cancel_reason: item.cancel_reason,
      created_by_email: parentDossier?.created_by_email,
      rfqItem: item,
      rfq: parentDossier,
      inputs_json: existingQuote?.inputs_json || ({} as any),
      results_json: existingQuote?.results_json || ({} as any),
    };
  });

  if (!filter) return list;

  // Apply filters
  if (filter.status && filter.status !== 'ALL') {
    list = list.filter((q) => q.status === filter.status || q.rfqItem?.status === filter.status);
  }

  if (filter.segment && filter.segment !== 'ALL') {
    list = list.filter((q) => q.segment === filter.segment);
  }

  if (filter.searchQuery && filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.rfq?.customer_name.toLowerCase().includes(q) ||
        item.rfqItem?.product_name.toLowerCase().includes(q) ||
        item.rfqItem?.part_number.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.created_by_email && item.created_by_email.toLowerCase().includes(q))
    );
  }

  if (filter.fromDate) {
    list = list.filter((q) => new Date(q.created_at) >= new Date(filter.fromDate!));
  }

  if (filter.toDate) {
    list = list.filter((q) => new Date(q.created_at) <= new Date(`${filter.toDate}T23:59:59`));
  }

  return list;
};

/**
 * Fetch Paginated Quote Records for Data Table
 */
export const fetchPaginatedQuotes = async (
  filter?: QuotationFilterOptions
): Promise<{
  data: QuoteRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}> => {
  const allQuotes = await fetchQuotes(filter);
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 10;
  const totalCount = allQuotes.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginatedData = allQuotes.slice(start, start + pageSize);

  return {
    data: paginatedData,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
};

/**
 * Create a new RFQ Dossier Header with child Items — Strictly Inserts into Supabase DB
 * Throws explicit error if Supabase write fails! NO silent fallback.
 */
export const createRfqDossierWithItems = async (
  dossier: {
    customer_name: string;
    customer_address?: string;
    rfq_code?: string;
    customer_contact_person?: string;
    rfq_received_date: string;
    customer_deadline: string;
    trade_terms?: any;
    delivery_address?: string;
    special_requirements?: string;
    notes?: string;
  },
  items: Array<{
    product_name: string;
    part_number?: string;
    annual_volume: number;
    quantity_unit?: any;
    target_price: number;
    technology_requirement?: any;
    is_feasible: boolean;
    cancel_reason?: string;
  }>,
  userEmail: string = 'sales@disoco.vn'
): Promise<RfqDossier> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rawCode = dossier.rfq_code || `${dateStr}-${String(localDossiersCache.length + 1).padStart(3, '0')}`;
  const rfqCode = rawCode.startsWith('RFQ-') ? rawCode.replace('RFQ-', '') : rawCode;

  // 1. Insert Header into Supabase 'rfqs' table
  const { data: dbDossier, error: dosErr } = await supabase
    .from('rfqs')
    .insert({
      customer_name: dossier.customer_name,
      product_name: dossier.customer_name,
      customer_address: dossier.customer_address,
      rfq_code: rfqCode,
      customer_contact_person: dossier.customer_contact_person,
      rfq_received_date: dossier.rfq_received_date,
      customer_deadline: dossier.customer_deadline,
      trade_terms: dossier.trade_terms,
      delivery_address: dossier.delivery_address,
      special_requirements: dossier.special_requirements,
      notes: dossier.notes,
      created_by_email: userEmail,
    })
    .select()
    .single();

  if (dosErr || !dbDossier) {
    throw new Error(`Lỗi tạo Hồ sơ RFQ trên Supabase: ${dosErr?.message || 'Không có dữ liệu trả về'}`);
  }

  // 2. Insert child items into Supabase 'rfq_items' table
  const itemsToInsert = items.map((it, idx) => ({
    rfq_id: dbDossier.id,
    item_code: `${rfqCode}-${String(idx + 1).padStart(2, '0')}`,
    product_name: it.product_name,
    part_number: it.part_number || `PN-${Date.now()}-${idx + 1}`,
    annual_volume: it.annual_volume,
    quantity_unit: it.quantity_unit || 'pcs/năm',
    target_price: it.target_price,
    technology_requirement: it.technology_requirement || 'Rèn+Gia công',
    status: it.is_feasible ? 'IN_COSTING' : 'CANCELLED_NOT_FEASIBLE',
    cancel_reason: it.is_feasible ? null : it.cancel_reason,
  }));

  const { data: dbItems, error: itemsErr } = await supabase
    .from('rfq_items')
    .insert(itemsToInsert)
    .select();

  if (itemsErr) {
    throw new Error(`Lỗi tạo Mã sản phẩm RFQ trên Supabase: ${itemsErr.message}`);
  }

  const createdDossier: RfqDossier = {
    ...dbDossier,
    items: dbItems as RfqItemRecord[],
  };

  localDossiersCache.unshift(createdDossier);
  if (dbItems) localItemsCache.unshift(...(dbItems as RfqItemRecord[]));

  return createdDossier;
};

/**
 * Save RFQ & Quote Calculation (IN_COSTING / READY_FOR_QUOTE status)
 * Inserts/Upserts into Supabase 'quotes' and updates 'rfq_items.status'
 * Throws explicit error if Supabase write fails! NO silent fallback.
 */
export const saveQuoteDraft = async (
  rfqItem: {
    id?: string;
    product_name: string;
    annual_volume: number;
    target_price: number;
    customer_name: string;
  },
  segment: SegmentType,
  currency: CurrencyType,
  exchangeRate: number,
  inputs: ForgingInput | CastingInput,
  results: ForgingResult | CastingResult,
  existingQuoteId?: string,
  userEmail: string = 'estimator@disoco.vn'
): Promise<QuoteRecord> => {
  const finalPrice = segment === 'forging' ? (results as ForgingResult).P_FORGING : (results as CastingResult).P_CASTING;
  const dieTreatment = segment === 'forging' ? (inputs as ForgingInput).die_cost_treatment : (inputs as CastingInput).pattern_cost_treatment;

  let itemId = rfqItem.id;
  if (!itemId) {
    // If rfqItem doesn't exist yet, create dossier & item first
    const dossier = await createRfqDossierWithItems(
      {
        customer_name: rfqItem.customer_name || 'Khách hàng mới',
        rfq_received_date: new Date().toISOString().slice(0, 10),
        customer_deadline: new Date().toISOString().slice(0, 10),
      },
      [
        {
          product_name: rfqItem.product_name,
          annual_volume: rfqItem.annual_volume,
          target_price: rfqItem.target_price,
          is_feasible: true,
        },
      ],
      userEmail
    );
    itemId = dossier.items![0].id;
  }

  // Update item status on Supabase rfq_items
  const { error: itemErr } = await supabase
    .from('rfq_items')
    .update({ status: 'READY_FOR_QUOTE' })
    .eq('id', itemId);

  if (itemErr) {
    throw new Error(`Lỗi cập nhật trạng thái RFQ Item trên Supabase: ${itemErr.message}`);
  }

  // Fetch parent rfq_id from rfq_items
  const { data: itemData } = await supabase.from('rfq_items').select('rfq_id').eq('id', itemId).single();
  const parentRfqId = itemData?.rfq_id || itemId;

  // Insert/Upsert into Supabase 'quotes' table
  const quotePayload = {
    rfq_id: parentRfqId,
    rfq_item_id: itemId,
    segment,
    status: 'READY_FOR_QUOTE',
    currency,
    exchange_rate: exchangeRate,
    die_cost_treatment: dieTreatment,
    final_quoted_price: finalPrice,
    created_by_email: userEmail,
    inputs_json: JSON.parse(JSON.stringify(inputs)),
    results_json: JSON.parse(JSON.stringify(results)),
  };

  let dbQuote: any = null;
  if (existingQuoteId) {
    const { data, error } = await supabase
      .from('quotes')
      .update(quotePayload)
      .eq('id', existingQuoteId)
      .select()
      .single();
    if (error) throw new Error(`Lỗi lưu bản tính giá Supabase: ${error.message}`);
    dbQuote = data;
  } else {
    const { data, error } = await supabase
      .from('quotes')
      .insert(quotePayload)
      .select()
      .single();
    if (error) throw new Error(`Lỗi lưu bản tính giá Supabase: ${error.message}`);
    dbQuote = data;
  }

  await fetchQuotes();
  return dbQuote as QuoteRecord;
};

/**
 * Send Quote (QUOTED_SENT status) - Freezes JSON Snapshots
 */
export const sendQuote = async (
  rfqItem: {
    id?: string;
    product_name: string;
    annual_volume: number;
    target_price: number;
    customer_name: string;
  },
  segment: SegmentType,
  currency: CurrencyType,
  exchangeRate: number,
  inputs: ForgingInput | CastingInput,
  results: ForgingResult | CastingResult,
  existingQuoteId?: string,
  userEmail: string = 'estimator@disoco.vn'
): Promise<QuoteRecord> => {
  const record = await saveQuoteDraft(rfqItem, segment, currency, exchangeRate, inputs, results, existingQuoteId, userEmail);
  const now = new Date().toISOString();

  // Update item status & quoted_sent_at on Supabase
  const { error: itemErr } = await supabase
    .from('rfq_items')
    .update({ status: 'QUOTED_SENT', quoted_sent_at: now })
    .eq('id', record.rfq_item_id);

  if (itemErr) {
    throw new Error(`Lỗi gửi báo giá Supabase: ${itemErr.message}`);
  }

  await supabase
    .from('quotes')
    .update({ status: 'QUOTED_SENT' })
    .eq('id', record.id);

  await fetchQuotes();
  return record;
};

/**
 * Update RFQ Item Status (SUCCESSFUL / CANCELLED_AFTER_QUOTE / QUOTED_SENT)
 * Strictly updates Supabase DB!
 */
export const updateQuoteStatus = async (
  quoteId: string,
  newStatus: RfqItemStatus | string,
  cancelReason?: string
): Promise<void> => {
  let itemStatus: RfqItemStatus = 'QUOTED_SENT';
  if (newStatus === 'SUCCESSFUL' || newStatus === 'APPROVED') itemStatus = 'SUCCESSFUL';
  else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED' || newStatus === 'CANCELLED_AFTER_QUOTE') itemStatus = 'CANCELLED_AFTER_QUOTE';
  else if (newStatus === 'CANCELLED_NOT_FEASIBLE') itemStatus = 'CANCELLED_NOT_FEASIBLE';
  else if (newStatus === 'READY_FOR_QUOTE') itemStatus = 'READY_FOR_QUOTE';
  else if (newStatus === 'IN_COSTING' || newStatus === 'DRAFT') itemStatus = 'IN_COSTING';

  const now = new Date().toISOString();

  // Find target item ID
  let targetItemId = quoteId;
  const targetQuote = localQuotesCache.find((q) => q.id === quoteId || q.rfq_item_id === quoteId);
  if (targetQuote) targetItemId = targetQuote.rfq_item_id;

  const updateFields: any = {
    status: itemStatus,
  };
  if (itemStatus.startsWith('CANCELLED') && cancelReason) {
    updateFields.cancel_reason = cancelReason;
  }
  if (itemStatus === 'SUCCESSFUL' || itemStatus.startsWith('CANCELLED')) {
    updateFields.resolved_at = now;
  }

  const { error: itemErr } = await supabase
    .from('rfq_items')
    .update(updateFields)
    .eq('id', targetItemId);

  if (itemErr) {
    throw new Error(`Lỗi cập nhật trạng thái Supabase: ${itemErr.message}`);
  }

  // Update quotes table status
  await supabase
    .from('quotes')
    .update({ status: itemStatus })
    .eq('rfq_item_id', targetItemId);

  await fetchQuotes();
};

/**
 * Cancel RFQ Item Immediately without calculation
 */
export const cancelRfqImmediately = async (
  rfqHeader: {
    customer_name: string;
    product_name: string;
    annual_volume: number;
    target_price: number;
  },
  cancelReason: string,
  userEmail: string = 'sales@disoco.vn'
): Promise<QuoteRecord> => {
  const dossier = await createRfqDossierWithItems(
    {
      customer_name: rfqHeader.customer_name,
      rfq_received_date: new Date().toISOString().slice(0, 10),
      customer_deadline: new Date().toISOString().slice(0, 10),
    },
    [
      {
        product_name: rfqHeader.product_name,
        part_number: `PN-${Date.now()}`,
        annual_volume: rfqHeader.annual_volume,
        target_price: rfqHeader.target_price,
        is_feasible: false,
        cancel_reason: cancelReason,
      },
    ],
    userEmail
  );

  const createdItem = dossier.items![0];
  const list = await fetchQuotes();
  return list.find((q) => q.rfq_item_id === createdItem.id)!;
};

/**
 * Reset System Data to initial seed state
 * Strictly executes DELETE queries on Supabase DB tables in Foreign Key order
 */
export const resetSystemData = async (): Promise<void> => {
  localStorage.removeItem('rfq_flat_table_hidden_cols');
  localStorage.removeItem('rfq_items_hidden_cols');

  const { error: e1 } = await supabase.from('quotation_document_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: e2 } = await supabase.from('quotation_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: e3 } = await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: e4 } = await supabase.from('rfq_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: e5 } = await supabase.from('rfqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (e1 || e2 || e3 || e4 || e5) {
    const msg = [e1, e2, e3, e4, e5].filter(Boolean).map((err) => err?.message).join('; ');
    throw new Error(`Lỗi reset dữ liệu Supabase: ${msg}`);
  }

  localDossiersCache = [];
  localItemsCache = [];
  localQuotesCache = [];
  resetQuotationDocumentsCache();
};
