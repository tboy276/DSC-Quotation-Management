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

  return {
    id: currentQuote?.id || `quote-${item.id}`,
    rfq_item_id: item.id,
    segment: currentQuote?.segment || 'forging',
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
    const { data, error } = await supabase.rpc('get_quote_counts');
    if (error) {
      throw new Error(`Lỗi tải số lượng báo giá từ Supabase: ${error.message}`);
    }

    const counts = data as Record<string, number>;

    const pendingReview = counts['PENDING_REVIEW'] || 0;
    const cancelledNotFeasible = counts['CANCELLED_NOT_FEASIBLE'] || 0;
    const inCosting = counts['IN_COSTING'] || 0;
    const readyForQuote = counts['READY_FOR_QUOTE'] || 0;
    const quotedSent = counts['QUOTED_SENT'] || 0;
    const successful = counts['SUCCESSFUL'] || 0;
    const cancelledAfterQuote = counts['CANCELLED_AFTER_QUOTE'] || 0;

    return {
      total: counts['TOTAL'] || 0,
      pendingReview,
      inCosting,
      successful,
      newStage: pendingReview + cancelledNotFeasible,
      internalStage: inCosting + readyForQuote,
      sentStage: quotedSent + successful + cancelledAfterQuote,
    };
  } catch (err) {
    console.error('Error fetching quote counts:', err);
    throw err;
  }
};

/**
 * Build the Supabase query for fetching quotes with filters applied.
 */
const buildQuotesQuery = (filter?: QuotationFilterOptions, options?: { withCount?: boolean }) => {
  let query = supabase
    .from('rfq_items')
    .select('*, rfq:rfqs(*), quote:quotes(*)', options?.withCount ? { count: 'exact' } : undefined);

  if (!filter) return query;

  // 1. Stage filter
  if (filter.stage) {
    if (filter.stage === 'new') {
      if (filter.onlyCancelled) {
        query = query.eq('status', 'CANCELLED_NOT_FEASIBLE');
      } else {
        query = query.in('status', ['PENDING_REVIEW', 'CANCELLED_NOT_FEASIBLE']);
      }
    } else if (filter.stage === 'internal') {
      query = query.in('status', ['IN_COSTING', 'READY_FOR_QUOTE']);
    } else if (filter.stage === 'sent') {
      if (filter.onlyCancelled) {
        query = query.eq('status', 'CANCELLED_AFTER_QUOTE');
      } else {
        query = query.in('status', ['QUOTED_SENT', 'SUCCESSFUL', 'CANCELLED_AFTER_QUOTE']);
      }
    }
  }

  // 2. Specific status sub-filter
  if (filter.status && filter.status !== 'ALL') {
    query = query.eq('status', filter.status);
  }

  // 3. Segment Filter
  // Use the computed column quote_segment to keep PENDING_REVIEW items (where quote_segment is null)
  if (filter.segment && filter.segment !== 'ALL') {
    query = query.or(`quote_segment.eq.${filter.segment},quote_segment.is.null`);
  }

  // 4. Search Query (requires search_text computed column / trigger)
  if (filter.searchQuery && filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase().trim();
    // ilike on the search_text column we created in migration
    query = query.ilike('search_text', `%${q}%`);
  }

  // 5. Date filters
  if (filter.fromDate) {
    query = query.gte('created_at', new Date(filter.fromDate).toISOString());
  }

  if (filter.toDate) {
    query = query.lte('created_at', new Date(`${filter.toDate}T23:59:59`).toISOString());
  }

  return query;
};

/**
 * Fetch all RFQ Items joined with Quote calculations & Dossier Headers from Supabase
 */
export const fetchQuotes = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  try {
    let query = buildQuotesQuery(filter).order('created_at', { ascending: false });

    // Apply a sensible limit for default fetches (not analytics)
    query = query.limit(1000);

    const { data: dbItems, error } = await query;

    if (error) {
      throw new Error(`Lỗi tải dữ liệu RFQ từ Supabase: ${error.message}`);
    }

    if (dbItems) {
      localItemsCache = dbItems as any[];
      // Update Dossiers cache with any new rfqs fetched
      dbItems.forEach(item => {
        if (item.rfq) {
          const existingIdx = localDossiersCache.findIndex((d) => d.id === item.rfq_id);
          if (existingIdx >= 0) localDossiersCache[existingIdx] = item.rfq;
          else localDossiersCache.push(item.rfq);
        }
      });
    }
  } catch (err) {
    console.warn('Fetching rfq_items from Supabase error:', err);
    throw err;
  }

  // Construct complete QuoteRecord list
  let list: QuoteRecord[] = localItemsCache.map((item) => {
    const parentDossier = localDossiersCache.find((d) => d.id === item.rfq_id) || item.rfq;
    return mapItemToQuoteRecord(item, parentDossier);
  });

  return list;
};

/**
 * Fetch Paginated Quote Records for Data Table (Server-side)
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
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  try {
    const query = buildQuotesQuery(filter, { withCount: true })
      .order('created_at', { ascending: false })
      .range(start, end);

    const { data: dbItems, count, error } = await query;

    if (error) {
      throw new Error(`Lỗi tải dữ liệu phân trang từ Supabase: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    if (dbItems) {
      dbItems.forEach((item: any) => {
        const existingIdx = localItemsCache.findIndex(i => i.id === item.id);
        if (existingIdx >= 0) localItemsCache[existingIdx] = item;
        else localItemsCache.push(item);

        if (item.rfq) {
          const existingDossierIdx = localDossiersCache.findIndex((d) => d.id === item.rfq_id);
          if (existingDossierIdx >= 0) localDossiersCache[existingDossierIdx] = item.rfq;
          else localDossiersCache.push(item.rfq);
        }
      });
    }

    const paginatedData: QuoteRecord[] = (dbItems || []).map((item: any) => {
      const parentDossier = localDossiersCache.find((d) => d.id === item.rfq_id) || item.rfq;
      return mapItemToQuoteRecord(item, parentDossier);
    });

    return {
      data: paginatedData,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
    };
  } catch (err) {
    console.error('fetchPaginatedQuotes error:', err);
    throw err;
  }
};

/**
 * Fetch ALL quotes in batches for Analytics Report
 */
export const fetchAllQuotesForAnalytics = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  let allRecords: any[] = [];
  let start = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const query = buildQuotesQuery(filter)
      .order('created_at', { ascending: false })
      .range(start, start + pageSize - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Lỗi tải dữ liệu Analytics từ Supabase: ${error.message}`);
    }

    if (data && data.length > 0) {
      allRecords = [...allRecords, ...data];
      start += pageSize;
      if (data.length < pageSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  // Update Cache with fetched records
  allRecords.forEach((item: any) => {
    const existingIdx = localItemsCache.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) localItemsCache[existingIdx] = item;
    else localItemsCache.push(item);

    if (item.rfq) {
      const existingDossierIdx = localDossiersCache.findIndex((d) => d.id === item.rfq_id);
      if (existingDossierIdx >= 0) localDossiersCache[existingDossierIdx] = item.rfq;
      else localDossiersCache.push(item.rfq);
    }
  });

  return allRecords.map((item) => {
    const parentDossier = localDossiersCache.find((d) => d.id === item.rfq_id) || item.rfq;
    return mapItemToQuoteRecord(item, parentDossier);
  });
};

/**
 * Lấy mã RFQ tiếp theo cho một ngày (định dạng YYYYMMDD).
 * Truy vấn trực tiếp từ bảng rfqs trên Supabase.
 */
export const generateNextRfqCode = async (dateStr: string): Promise<string> => {
  const { data, error } = await supabase
    .from('rfqs')
    .select('rfq_code')
    .like('rfq_code', `${dateStr}-%`);

  if (error) {
    throw new Error(`Lỗi khi truy vấn mã RFQ từ Supabase: ${error.message}`);
  }

  let maxNum = 0;
  if (data && data.length > 0) {
    data.forEach(row => {
      const parts = (row.rfq_code || '').split('-');
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }

  return `${dateStr}-${String(maxNum + 1).padStart(3, '0')}`;
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
  
  let rfqCode = '';
  if (dossier.rfq_code) {
    rfqCode = dossier.rfq_code.startsWith('RFQ-') ? dossier.rfq_code.replace('RFQ-', '') : dossier.rfq_code;
  }
  
  let dbDossier: any = null;
  const maxRetries = 5; // Luôn cho phép retry tối đa 5 lần
  let attempts = 0;
  let lastError: any = null;
  
  while (attempts < maxRetries) {
    if (!rfqCode || (attempts > 0 && lastError?.code === '23505')) {
      rfqCode = await generateNextRfqCode(dateStr);
    }
    
    // Replace sequential inserts with RPC call
    const payloadItems = items.map((it, idx) => ({
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

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_rfq_dossier_transaction', {
      p_customer_name: dossier.customer_name,
      p_customer_address: dossier.customer_address || null,
      p_rfq_code: rfqCode,
      p_contact_person: dossier.customer_contact_person || null,
      p_received_date: dossier.rfq_received_date,
      p_deadline: dossier.customer_deadline,
      p_trade_terms: dossier.trade_terms || null,
      p_delivery_address: dossier.delivery_address || null,
      p_special_requirements: dossier.special_requirements || null,
      p_notes: dossier.notes || null,
      p_user_email: userEmail,
      p_items: payloadItems
    });
      
    if (rpcError) {
      lastError = rpcError;
      // 23505 = unique_violation trong PostgreSQL
      if (rpcError.code === '23505') {
        attempts++;
        continue; // Thử lại với mã tiếp theo
      }
      throw new Error(`Lỗi tạo Hồ sơ RFQ trên Supabase: ${rpcError.message || 'Không rõ'}`);
    }
    
    // Fetch back the created dossier with items
    const { data: fetchedDossier, error: fetchErr } = await supabase
      .from('rfqs')
      .select('*, items:rfq_items(*)')
      .eq('id', rpcResult.rfq_id)
      .single();

    if (fetchErr) {
      throw new Error(`Lỗi tải lại Hồ sơ RFQ vừa tạo: ${fetchErr.message}`);
    }

    dbDossier = fetchedDossier;
    break; // Thành công thì thoát loop
  }

  if (!dbDossier) {
    throw new Error(`Lỗi tạo Hồ sơ RFQ (vượt quá ${maxRetries} lần thử): ${lastError?.message || 'Không có dữ liệu'}`);
  }

  const createdDossier: RfqDossier = dbDossier as RfqDossier;

  localDossiersCache.unshift(createdDossier);
  if (createdDossier.items) {
    localItemsCache.unshift(...createdDossier.items);
  }

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
  userEmail: string = 'admin@disoco.vn'
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

  const updatePayload: any = { status: newItemStatus };
  if (newItemStatus === 'IN_COSTING' && currentStatus === 'PENDING_REVIEW') {
    updatePayload.technical_review_completed_at = new Date().toISOString();
  }
  if (newItemStatus === 'READY_FOR_QUOTE') {
    updatePayload.costing_completed_at = new Date().toISOString();
  }

  // Update item status on Supabase rfq_items
  const { error: itemErr } = await supabase
    .from('rfq_items')
    .update(updatePayload)
    .eq('id', itemId);

  if (itemErr) {
    throw new Error(`Lỗi cập nhật trạng thái RFQ Item trên Supabase: ${itemErr.message}`);
  }

  // Insert/Upsert into Supabase 'quotes' table
  const quotePayload = {
    rfq_item_id: itemId,
    segment: segment,
    status: 'DRAFT',
    currency,
    exchange_rate: exchangeRate,
    die_cost_treatment: dieTreatment,
    final_quoted_price: finalPrice,
    created_by_email: userEmail,
    inputs_json: JSON.parse(JSON.stringify(inputs)),
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
  userEmail: string = 'admin@disoco.vn'
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
  
  if (targetItem) {
    targetItemId = targetItem.id;
  } else {
    // If not found in limited cache, resolve directly from DB
    const { data: resolved } = await supabase
      .from('quotes')
      .select('rfq_item_id')
      .eq('id', quoteId)
      .maybeSingle();
    
    if (resolved?.rfq_item_id) {
      targetItemId = resolved.rfq_item_id;
    }
  }

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

  const timestampPayload: any = {};
  if (itemStatus === 'IN_COSTING' && targetItem?.status === 'PENDING_REVIEW') {
    timestampPayload.technical_review_completed_at = now;
  }
  if (itemStatus === 'READY_FOR_QUOTE') {
    timestampPayload.costing_completed_at = now;
  }
  if (itemStatus === 'QUOTED_SENT') {
    timestampPayload.quoted_sent_at = now;
  }
  
  if (Object.keys(timestampPayload).length > 0) {
    await supabase.from('rfq_items').update(timestampPayload).eq('id', targetItemId);
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

  const { error } = await supabase.rpc('delete_rfq_items_transaction', {
    p_item_ids: itemIds
  });

  if (error) {
    throw new Error(`Lỗi xóa mã sản phẩm RFQ trên Supabase: ${error.message}`);
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
