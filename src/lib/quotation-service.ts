import { supabase } from './supabase';
import type {
  QuoteRecord,
  RfqDossier,
  RfqItemRecord,
  RfqItemStatus,
  QuotationFilterOptions,
  CurrencyType,
  RfqStageCounts,
  TechnologyRequirementType,
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

/**
 * Helper to map a raw DB item to QuoteRecord
 */
const mapItemToQuoteRecord = (item: any, parentDossier: any): QuoteRecord => {
  const dbQuote = Array.isArray(item.quote) ? item.quote[0] : item.quote;
  const currentQuote = dbQuote; // Luôn ưu tiên dbQuote từ DB

  const rawSegment = currentQuote?.inputs_json?._segment || currentQuote?.segment;
  let realSegment: SegmentType = 'forging';
  if (rawSegment === 'sawing' || rawSegment === 'machining' || rawSegment === 'casting' || rawSegment === 'forging') {
    realSegment = rawSegment as SegmentType;
  } else if (currentQuote?.results_json?.P_SAWING !== undefined) {
    realSegment = 'sawing';
  } else if (currentQuote?.results_json?.P_MACHINING !== undefined) {
    realSegment = 'machining';
  }

  return {
    id: currentQuote?.id || `quote-${item.id}`,
    rfq_item_id: item.id,
    segment: realSegment,
    status: item.status,
    currency: currentQuote?.currency || 'VND',
    exchange_rate: currentQuote?.exchange_rate || 1,
    die_cost_treatment: currentQuote?.die_cost_treatment || 'separate',
    final_quoted_price: currentQuote?.final_quoted_price || 0,
    created_at: item.created_at,
    sent_at: item.quoted_sent_at || currentQuote?.sent_at,
    cancel_reason: item.cancel_reason,
    created_by_email: parentDossier?.created_by_email,
    rfqItem: item,
    rfq: parentDossier,
    inputs_json: currentQuote?.inputs_json || ({} as any),
    results_json: currentQuote?.results_json || ({} as any),
  };
};

/**
 * Fetch a single RFQ Item by ID joined with Quote calculations & Dossier Headers
 */
export const fetchQuoteByItemId = async (itemId: string): Promise<QuoteRecord | null> => {
  try {
    const { data: dbItem, error } = await supabase
      .from('rfq_items')
      .select('*, rfq:rfqs(*), quote:quotes(*)')
      .eq('id', itemId)
      .single();

    if (error) {
      throw new Error(`Lỗi tải dữ liệu RFQ từ Supabase: ${error.message}`);
    }

    if (dbItem) {
      const existingIdx = localItemsCache.findIndex(i => i.id === dbItem.id);
      if (existingIdx >= 0) localItemsCache[existingIdx] = dbItem;
      else localItemsCache.push(dbItem);
      
      return mapItemToQuoteRecord(dbItem, dbItem.rfq);
    }
    return null;
  } catch (err) {
    console.warn('Fetching single rfq_item from Supabase error:', err);
    throw err;
  }
};

/**
 * Fetch lightweight global count of RFQ items grouped by status / stage
 */
export const fetchQuoteCounts = async (): Promise<RfqStageCounts> => {
  try {
    const [
      { count: totalCount },
      { count: pendingCount },
      { count: cancelledNotFeasibleCount },
      { count: inCostingCount },
      { count: readyCount },
      { count: sentCount },
      { count: successCount },
      { count: cancelledAfterQuoteCount },
    ] = await Promise.all([
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_REVIEW'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'CANCELLED_NOT_FEASIBLE'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'IN_COSTING'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'READY_FOR_QUOTE'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'QUOTED_SENT'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'SUCCESSFUL'),
      supabase.from('rfq_items').select('*', { count: 'exact', head: true }).eq('status', 'CANCELLED_AFTER_QUOTE'),
    ]);

    const pendingReview = pendingCount || 0;
    const cancelledNotFeasible = cancelledNotFeasibleCount || 0;
    const inCosting = inCostingCount || 0;
    const readyForQuote = readyCount || 0;
    const quotedSent = sentCount || 0;
    const successful = successCount || 0;
    const cancelledAfterQuote = cancelledAfterQuoteCount || 0;

    return {
      total: totalCount || 0,
      pendingReview,
      inCosting,
      successful,
      newStage: pendingReview + cancelledNotFeasible,
      internalStage: inCosting + readyForQuote,
      sentStage: quotedSent + successful + cancelledAfterQuote,
    };
  } catch (err) {
    console.warn('Error fetching quote counts:', err);
    return {
      total: 0,
      pendingReview: 0,
      inCosting: 0,
      successful: 0,
      newStage: 0,
      internalStage: 0,
      sentStage: 0,
    };
  }
};

/**
 * Fetch all RFQ Items joined with Quote calculations & Dossier Headers from Supabase
 */
export const fetchQuotes = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  try {
    const { data: dbItems, error } = await supabase
      .from('rfq_items')
      .select('*, rfq:rfqs(*), quote:quotes(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Lỗi tải dữ liệu RFQ từ Supabase: ${error.message}`);
    }

    if (dbItems) {
      localItemsCache = dbItems as any[];
    }
  } catch (err) {
    console.warn('Fetching rfq_items from Supabase error:', err);
    throw err; // Ném lỗi để UI hiển thị thông báo
  }

  // Construct complete QuoteRecord list
  let list: QuoteRecord[] = localItemsCache.map((item) => {
    const parentDossier = localDossiersCache.find((d) => d.id === item.rfq_id) || item.rfq;
    return mapItemToQuoteRecord(item, parentDossier);
  });

  if (!filter) return list;

  // 1. Stage filter
  if (filter.stage) {
    if (filter.stage === 'new') {
      const allowed = ['PENDING_REVIEW', 'CANCELLED_NOT_FEASIBLE'];
      list = list.filter((q) => allowed.includes(q.status || q.rfqItem?.status || ''));
      if (filter.onlyCancelled) {
        list = list.filter((q) => (q.status || q.rfqItem?.status) === 'CANCELLED_NOT_FEASIBLE');
      }
    } else if (filter.stage === 'internal') {
      const allowed = ['IN_COSTING', 'READY_FOR_QUOTE'];
      list = list.filter((q) => allowed.includes(q.status || q.rfqItem?.status || ''));
    } else if (filter.stage === 'sent') {
      const allowed = ['QUOTED_SENT', 'SUCCESSFUL', 'CANCELLED_AFTER_QUOTE'];
      list = list.filter((q) => allowed.includes(q.status || q.rfqItem?.status || ''));
      if (filter.onlyCancelled) {
        list = list.filter((q) => (q.status || q.rfqItem?.status) === 'CANCELLED_AFTER_QUOTE');
      }
    }
  }

  // 2. Specific status sub-filter
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
    status: it.is_feasible !== false ? 'PENDING_REVIEW' : 'CANCELLED_NOT_FEASIBLE',
    cancel_reason: it.is_feasible !== false ? null : it.cancel_reason,
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
  inputs: ForgingInput | CastingInput | any,
  results: ForgingResult | CastingResult | any,
  existingQuoteId?: string,
  targetStatus: RfqItemStatus = 'IN_COSTING',
  userEmail: string = 'estimator@disoco.vn'
): Promise<QuoteRecord> => {
  let finalPrice = 0;
  let dieTreatment: string | null = null;

  switch (segment) {
    case 'forging':
      finalPrice = (results as ForgingResult).P_FORGING ?? 0;
      dieTreatment = (inputs as ForgingInput).die_cost_treatment ?? 'separate';
      break;
    case 'casting':
      finalPrice = (results as CastingResult).P_CASTING ?? 0;
      dieTreatment = (inputs as CastingInput).pattern_cost_treatment ?? 'separate';
      break;
    case 'sawing':
      finalPrice = (results as any).P_SAWING ?? 0;
      dieTreatment = null;
      break;
    case 'machining':
      finalPrice = (results as any).P_MACHINING ?? 0;
      dieTreatment = null;
      break;
  }

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

  // Status Demotion Guard logic:
  // Determine new item status based on targetStatus and current status
  const existingItem = localItemsCache.find((it) => it.id === itemId);
  const currentStatus = existingItem?.status;

  let newItemStatus: RfqItemStatus = 'IN_COSTING';
  if (targetStatus === 'READY_FOR_QUOTE') {
    newItemStatus = 'READY_FOR_QUOTE';
  } else {
    // When saving draft:
    // If status is ALREADY IN_COSTING or READY_FOR_QUOTE, preserve it (don't demote READY_FOR_QUOTE)
    if (currentStatus === 'READY_FOR_QUOTE' || currentStatus === 'IN_COSTING') {
      newItemStatus = currentStatus;
    } else {
      newItemStatus = 'IN_COSTING';
    }
  }

  // Update item status on Supabase rfq_items
  const { error: itemErr } = await supabase
    .from('rfq_items')
    .update({ status: newItemStatus })
    .eq('id', itemId);

  if (itemErr) {
    throw new Error(`Lỗi cập nhật trạng thái RFQ Item trên Supabase: ${itemErr.message}`);
  }

  // Insert/Upsert into Supabase 'quotes' table
  // Map 'sawing' and 'machining' to 'forging' for DB segment column check constraint compliance
  const dbSegment = (segment === 'sawing' || segment === 'machining') ? 'forging' : segment;
  const quotePayload = {
    rfq_item_id: itemId,
    segment: dbSegment,
    status: 'DRAFT',
    currency,
    exchange_rate: exchangeRate,
    die_cost_treatment: dieTreatment,
    final_quoted_price: finalPrice,
    created_by_email: userEmail,
    inputs_json: JSON.parse(JSON.stringify({ ...inputs, _segment: segment })),
    results_json: JSON.parse(JSON.stringify(results)),
  };

  let dbQuote: any = null;
  if (existingQuoteId && !existingQuoteId.startsWith('quote-')) {
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
  const record = await saveQuoteDraft(rfqItem, segment, currency, exchangeRate, inputs, results, existingQuoteId, 'READY_FOR_QUOTE', userEmail);
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
  let quoteStatus = 'SENT';

  if (newStatus === 'SUCCESSFUL' || newStatus === 'APPROVED') {
    itemStatus = 'SUCCESSFUL';
    quoteStatus = 'SUCCESSFUL';
  }
  else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED' || newStatus === 'CANCELLED_AFTER_QUOTE') {
    itemStatus = 'CANCELLED_AFTER_QUOTE';
    quoteStatus = 'CANCELLED';
  }
  else if (newStatus === 'CANCELLED_NOT_FEASIBLE') {
    itemStatus = 'CANCELLED_NOT_FEASIBLE';
    quoteStatus = 'CANCELLED';
  }
  else if (newStatus === 'READY_FOR_QUOTE') {
    itemStatus = 'READY_FOR_QUOTE';
    quoteStatus = 'DRAFT';
  }
  else if (newStatus === 'IN_COSTING' || newStatus === 'DRAFT') {
    itemStatus = 'IN_COSTING';
    quoteStatus = 'DRAFT';
  }

  const now = new Date().toISOString();

  // Find target item ID (strip fallback "quote-" prefix if present)
  let targetItemId = quoteId;
  if (targetItemId.startsWith('quote-')) {
    targetItemId = targetItemId.replace(/^quote-/, '');
  }

  const targetItem = localItemsCache.find(
    (item) => item.id === targetItemId || item.id === quoteId || (item.quote && (Array.isArray(item.quote) ? item.quote[0]?.id : item.quote?.id) === quoteId)
  );
  if (targetItem) targetItemId = targetItem.id;

  // Use RPC to update both tables in a single transaction
  const { error: rpcErr } = await supabase.rpc('update_quote_status_transaction', {
    p_item_id: targetItemId,
    p_item_status: itemStatus,
    p_quote_status: quoteStatus,
    p_cancel_reason: cancelReason || null,
    p_resolved_at: (itemStatus === 'SUCCESSFUL' || itemStatus.startsWith('CANCELLED')) ? now : null
  });

  if (rpcErr) {
    throw new Error(`Lỗi cập nhật trạng thái đồng bộ (RPC) trên Supabase: ${rpcErr.message}`);
  }

  await fetchQuotes();
};

/**
 * Update RFQ Item Fields (Edit Product Name, Part Number, Volume, Target Price, Tech)
 */
export const updateRfqItemDetails = async (
  itemId: string,
  details: {
    product_name?: string;
    part_number?: string;
    annual_volume?: number;
    target_price?: number;
    technology_requirement?: TechnologyRequirementType;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('rfq_items')
    .update(details)
    .eq('id', itemId);

  if (error) {
    throw new Error(`Lỗi cập nhật thông tin sản phẩm RFQ: ${error.message}`);
  }
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
 * Delete RFQ Items / Dossiers from Supabase DB with Cascading Parent Header Cleanup
 */
export const deleteRfqItems = async (itemIds: string[]): Promise<void> => {
  if (!itemIds || itemIds.length === 0) return;

  // 1. Fetch parent rfq_ids before deletion
  const { data: targetItems } = await supabase
    .from('rfq_items')
    .select('rfq_id')
    .in('id', itemIds);

  const parentRfqIds = Array.from(new Set((targetItems || []).map((i) => i.rfq_id).filter(Boolean)));

  // 2. Delete child items from rfq_items
  const { error } = await supabase.from('rfq_items').delete().in('id', itemIds);
  if (error) {
    throw new Error(`Lỗi xóa mã sản phẩm RFQ trên Supabase: ${error.message}`);
  }

  // 3. For each parent rfq_id, check if any remaining items exist. If none, delete parent RFQ header row from rfqs table.
  for (const rfqId of parentRfqIds) {
    const { count } = await supabase
      .from('rfq_items')
      .select('id', { count: 'exact', head: true })
      .eq('rfq_id', rfqId);

    if (count === 0 || count === null) {
      await supabase.from('rfqs').delete().eq('id', rfqId);
    }
  }

  await fetchQuotes();
};

export const deleteRfqDossier = async (dossierId: string): Promise<void> => {
  const { error } = await supabase.from('rfqs').delete().eq('id', dossierId);
  if (error) {
    throw new Error(`Lỗi xóa Hồ sơ RFQ trên Supabase: ${error.message}`);
  }
  await fetchQuotes();
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
  resetQuotationDocumentsCache();
};
