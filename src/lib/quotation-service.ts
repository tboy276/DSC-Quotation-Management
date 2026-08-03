import { supabase } from './supabase';
import type {
  QuoteRecord,
  RfqDossier,
  RfqItemRecord,
  RfqItemStatus,
  QuotationFilterOptions,
  PaginatedQuotationResponse,
  CurrencyType,
} from '../types/quote';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from './calculation-engine/types';
import type { SegmentType, TradeTermType } from '../store/useQuotationStore';

// ----------------------------------------------------------------------
// CLEAN INITIAL DATA (Bắt đầu với 0 dữ liệu mẫu để thử nghiệm dữ liệu mới)
// ----------------------------------------------------------------------

export const INITIAL_DOSSIERS: RfqDossier[] = [];
export const INITIAL_RFQ_ITEMS: RfqItemRecord[] = [];
export const INITIAL_QUOTES: QuoteRecord[] = [];

// Memory caches
let localDossiersCache = [...INITIAL_DOSSIERS];
let localItemsCache = [...INITIAL_RFQ_ITEMS];
let localQuotesCache = [...INITIAL_QUOTES];

/**
 * Fetch all RFQ Items joined with Quote calculations & Dossier Headers
 */
export const fetchQuotes = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  try {
    const { data: dbItems, error } = await supabase
      .from('rfq_items')
      .select('*, rfq:rfqs(*), quote:quotes(*)')
      .order('created_at', { ascending: false });

    if (!error && dbItems && dbItems.length > 0) {
      localItemsCache = dbItems as any[];
    }
  } catch (err) {
    console.warn('Supabase DB fallback to memory cache:', err);
  }

  // Construct complete QuoteRecord list from localItemsCache
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
 * Server-side Paginated Fetch for RFQ Dossiers & Product Items
 */
export const fetchPaginatedQuotes = async (
  filter?: QuotationFilterOptions
): Promise<PaginatedQuotationResponse> => {
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 10;

  const fullList = await fetchQuotes(filter);
  const totalCount = fullList.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const startIndex = (page - 1) * pageSize;
  const paginatedData = fullList.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
};

/**
 * Create a new RFQ Dossier Header + Product Line Items
 */
export const createRfqDossierWithItems = async (
  dossier: {
    customer_name: string;
    customer_address?: string;
    rfq_code?: string;
    customer_contact_person?: string;
    rfq_received_date: string;
    customer_deadline: string;
    trade_terms?: TradeTermType;
    delivery_address?: string;
    special_requirements?: string;
    notes?: string;
  },
  items: Array<{
    product_name: string;
    part_number: string;
    annual_volume: number;
    quantity_unit?: any;
    target_price: number;
    technology_requirement?: any;
    is_feasible: boolean;
    cancel_reason?: string;
  }>,
  userEmail: string = 'sales@disoco.vn'
): Promise<RfqDossier> => {
  const now = new Date().toISOString();
  const dossierId = `rfq-dos-${Date.now()}`;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rawCode = dossier.rfq_code || `${dateStr}-${String(localDossiersCache.length + 1).padStart(3, '0')}`;
  const rfqCode = rawCode.startsWith('RFQ-') ? rawCode.replace('RFQ-', '') : rawCode;

  const createdItems: RfqItemRecord[] = items.map((it, idx) => {
    const itemIndexStr = String(idx + 1).padStart(2, '0');
    const itemCode = `${rfqCode}-${itemIndexStr}`;
    return {
      id: `item-${Date.now()}-${idx + 1}`,
      rfq_id: dossierId,
      item_code: itemCode,
      product_name: it.product_name,
      part_number: it.part_number || `PN-${Date.now()}-${idx + 1}`,
      annual_volume: it.annual_volume,
      quantity_unit: it.quantity_unit || 'pcs/năm',
      target_price: it.target_price,
      technology_requirement: it.technology_requirement || 'Rèn+Gia công',
      status: it.is_feasible ? 'IN_COSTING' : 'CANCELLED_NOT_FEASIBLE',
      cancel_reason: it.is_feasible ? undefined : it.cancel_reason,
      created_at: now,
    };
  });

  const newDossier: RfqDossier = {
    id: dossierId,
    customer_name: dossier.customer_name,
    customer_address: dossier.customer_address,
    rfq_code: rfqCode,
    customer_contact_person: dossier.customer_contact_person,
    rfq_received_date: dossier.rfq_received_date,
    customer_deadline: dossier.customer_deadline,
    trade_terms: dossier.trade_terms || 'FOB',
    delivery_address: dossier.delivery_address,
    special_requirements: dossier.special_requirements,
    notes: dossier.notes,
    created_by_email: userEmail,
    created_at: now,
    items: createdItems,
  };

  try {
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

    if (!dosErr && dbDossier) {
      const itemsToInsert = items.map((it) => ({
        rfq_id: dbDossier.id,
        product_name: it.product_name,
        part_number: it.part_number,
        annual_volume: it.annual_volume,
        quantity_unit: it.quantity_unit || 'pcs/năm',
        target_price: it.target_price,
        technology_requirement: it.technology_requirement || 'Rèn+Gia công',
        status: it.is_feasible ? 'IN_COSTING' : 'CANCELLED_NOT_FEASIBLE',
        cancel_reason: it.is_feasible ? null : it.cancel_reason,
      }));

      await supabase.from('rfq_items').insert(itemsToInsert);
    }
  } catch (err) {
    console.warn('Saving dossier to Supabase failed, using memory cache:', err);
  }

  localDossiersCache.unshift(newDossier);
  localItemsCache.unshift(...createdItems);

  return newDossier;
};

/**
 * Save RFQ & Quote Calculation (IN_COSTING / READY_FOR_QUOTE status)
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
  const now = new Date().toISOString();

  let itemId = rfqItem.id;
  if (!itemId) {
    // Create new item & dossier fallback
    const dossierId = `rfq-dos-${Date.now()}`;
    itemId = `item-${Date.now()}`;

    const newDos: RfqDossier = {
      id: dossierId,
      customer_name: rfqItem.customer_name || 'Khách hàng mới',
      rfq_received_date: now.slice(0, 10),
      customer_deadline: now.slice(0, 10),
      created_by_email: userEmail,
      created_at: now,
    };
    const newItem: RfqItemRecord = {
      id: itemId,
      rfq_id: dossierId,
      product_name: rfqItem.product_name,
      part_number: `PN-${Date.now()}`,
      annual_volume: rfqItem.annual_volume,
      target_price: rfqItem.target_price,
      status: 'READY_FOR_QUOTE',
      created_at: now,
      rfq: newDos,
    };
    localDossiersCache.unshift(newDos);
    localItemsCache.unshift(newItem);
  } else {
    // Update existing item status to READY_FOR_QUOTE
    localItemsCache = localItemsCache.map((it) =>
      it.id === itemId ? { ...it, status: 'READY_FOR_QUOTE' } : it
    );
  }

  const quoteId = existingQuoteId || `quote-${itemId}`;
  const targetItem = localItemsCache.find((it) => it.id === itemId)!;

  const newQuote: QuoteRecord = {
    id: quoteId,
    rfq_item_id: itemId,
    segment,
    status: 'READY_FOR_QUOTE',
    currency,
    exchange_rate: exchangeRate,
    die_cost_treatment: dieTreatment,
    final_quoted_price: finalPrice,
    created_at: now,
    created_by_email: userEmail,
    rfqItem: targetItem,
    rfq: targetItem.rfq || localDossiersCache.find((d) => d.id === targetItem.rfq_id),
    inputs_json: JSON.parse(JSON.stringify(inputs)),
    results_json: JSON.parse(JSON.stringify(results)),
  };

  localQuotesCache = [newQuote, ...localQuotesCache.filter((q) => q.id !== quoteId)];
  return newQuote;
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

  record.status = 'QUOTED_SENT';
  record.sent_at = new Date().toISOString();
  if (record.rfqItem) {
    record.rfqItem.status = 'QUOTED_SENT';
    record.rfqItem.quoted_sent_at = record.sent_at;
  }

  localItemsCache = localItemsCache.map((it) =>
    it.id === record.rfq_item_id ? { ...it, status: 'QUOTED_SENT', quoted_sent_at: record.sent_at } : it
  );

  localQuotesCache = localQuotesCache.map((q) => (q.id === record.id ? record : q));
  return record;
};

/**
 * Update RFQ Item Status (SUCCESSFUL / CANCELLED_AFTER_QUOTE / QUOTED_SENT)
 */
export const updateQuoteStatus = async (
  quoteId: string,
  newStatus: RfqItemStatus | string,
  cancelReason?: string
): Promise<void> => {
  // Map status to 7-status enum
  let itemStatus: RfqItemStatus = 'QUOTED_SENT';
  if (newStatus === 'SUCCESSFUL' || newStatus === 'APPROVED') itemStatus = 'SUCCESSFUL';
  else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED' || newStatus === 'CANCELLED_AFTER_QUOTE') itemStatus = 'CANCELLED_AFTER_QUOTE';
  else if (newStatus === 'CANCELLED_NOT_FEASIBLE') itemStatus = 'CANCELLED_NOT_FEASIBLE';
  else if (newStatus === 'READY_FOR_QUOTE') itemStatus = 'READY_FOR_QUOTE';
  else if (newStatus === 'IN_COSTING' || newStatus === 'DRAFT') itemStatus = 'IN_COSTING';

  const targetQuote = localQuotesCache.find((q) => q.id === quoteId || q.rfq_item_id === quoteId);
  const itemId = targetQuote?.rfq_item_id || quoteId;
  const now = new Date().toISOString();

  localItemsCache = localItemsCache.map((it) => {
    if (it.id === itemId) {
      return {
        ...it,
        status: itemStatus,
        cancel_reason: itemStatus.startsWith('CANCELLED') ? cancelReason : it.cancel_reason,
        resolved_at: (itemStatus === 'SUCCESSFUL' || itemStatus.startsWith('CANCELLED')) ? now : it.resolved_at,
      };
    }
    return it;
  });

  localQuotesCache = localQuotesCache.map((q) => {
    if (q.id === quoteId || q.rfq_item_id === itemId) {
      return {
        ...q,
        status: itemStatus,
        cancel_reason: itemStatus.startsWith('CANCELLED') ? cancelReason : q.cancel_reason,
      };
    }
    return q;
  });
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

import { resetQuotationDocumentsCache } from './quotation-document-service';

/**
 * Reset System Data to initial seed state (Admin-only action for tuan.vuongdinh@disoco.net)
 * Executes DELETE queries on Supabase DB tables + clears memory caches
 */
export const resetSystemData = async (): Promise<void> => {
  try {
    // Clear custom local storage settings
    localStorage.removeItem('rfq_flat_table_hidden_cols');
    localStorage.removeItem('rfq_items_hidden_cols');

    // Execute DELETE on Supabase Database tables in foreign key order
    await supabase.from('quotation_document_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('quotation_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rfq_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rfqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.warn('Supabase DB reset error:', e);
  }

  // Clear memory caches
  localDossiersCache = [...INITIAL_DOSSIERS];
  localItemsCache = [...INITIAL_RFQ_ITEMS];
  localQuotesCache = [...INITIAL_QUOTES];
  resetQuotationDocumentsCache();
};
