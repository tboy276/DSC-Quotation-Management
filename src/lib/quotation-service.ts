import { supabase } from './supabase';
import type { QuoteRecord, UnifiedRfqStatus, QuotationFilterOptions, CurrencyType, RfqRecord } from '../types/quote';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from './calculation-engine/types';
import type { RfqHeaderState, SegmentType } from '../store/useQuotationStore';

// Initial Mock Seed Data for Fallback/Offline Mode
export const INITIAL_QUOTES: QuoteRecord[] = [
  {
    id: 'quote-101',
    rfq_id: 'rfq-101',
    segment: 'forging',
    status: 'SENT',
    currency: 'USD',
    exchange_rate: 25400,
    die_cost_treatment: 'amortized',
    final_quoted_price: 97383,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    created_by_email: 'sales.honda@disoco.vn',
    rfq: {
      id: 'rfq-101',
      customer_name: 'Tập đoàn Honda Việt Nam',
      product_name: 'Trục Khuỷu Động Cơ K20',
      annual_volume: 25000,
      trade_terms: 'FOB',
      target_price: 95000,
      status: 'SENT',
      created_by_email: 'sales.honda@disoco.vn',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    inputs_json: {
      m_tinh: 1.5,
      m_bavia: 0.3,
      k_loss: 2.0,
      DG_steel: 22000,
      DG_scrap: 8000,
      forging_machine_type: 'press',
      DG_forging_machine_hour: 750000,
      t_cut_sec: 15,
      DG_sawing_machine_hour: 120000,
      w_elec_kwh_per_kg: 0.45,
      DG_elec_kwh: 2200,
      t_forging_sec: 12,
      t_trim_sec: 8,
      DG_trim_machine_hour: 180000,
      DG_heat_treat_kg: 4500,
      DG_clean_kg: 1200,
      machining_operations: [
        { name: 'Tiện thô CNC mặt đầu', t_prep_min: 15, t_man_min: 2.5, DG_machine_hour: 210000, C_tooling: 1500 },
      ],
      C_die_total: 85000000,
      L_die_life: 10000,
      N_order: 1000,
      die_cost_treatment: 'amortized',
      k_mgmt: 8,
      DG_trans_kg: 1500,
      k_profit_forging: 15,
    } as ForgingInput,
    results_json: {
      m_phoi: 1.837,
      C_mat_forging: 38014,
      C_ops_forging: 12500,
      C_machining: 15000,
      C_die_amortization: 8500,
      COGS: 74014,
      pre_profit_price: 84681,
      P_FORGING: 97383,
    } as ForgingResult,
  },
  {
    id: 'quote-102',
    rfq_id: 'rfq-102',
    segment: 'casting',
    status: 'SUCCESSFUL',
    currency: 'VND',
    exchange_rate: 1,
    die_cost_treatment: 'amortized',
    final_quoted_price: 282240,
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    created_by_email: 'estimator@disoco.vn',
    rfq: {
      id: 'rfq-102',
      customer_name: 'Công ty Toyota Boshoku Hải Dương',
      product_name: 'Bơm Nước Đúc Gang FCD450',
      annual_volume: 18000,
      trade_terms: 'CIF',
      target_price: 290000,
      status: 'SUCCESSFUL',
      created_by_email: 'estimator@disoco.vn',
      created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    },
    inputs_json: {
      m_cast: 4.5,
      Y_yield: 60,
      DG_liquid: 24000,
      DG_cast_scrap: 10000,
      DG_sinto_op: 10000,
      n_cavity_per_mold: 2,
      m_core: 1.2,
      DG_core_sand_kg: 3500,
      DG_finish_kg: 1800,
      machining_operations: [
        { name: 'Tiện mặt đúc CNC', t_prep_min: 15, t_man_min: 3.0, DG_machine_hour: 210000, C_tooling: 1800 },
      ],
      C_pattern_total: 45000000,
      L_pattern_life: 15000,
      N_order: 1000,
      pattern_cost_treatment: 'amortized',
      k_mgmt_cast: 10,
      DG_trans_kg: 1500,
      k_profit_casting: 12,
    } as CastingInput,
    results_json: {
      m_liquid: 7.5,
      m_scrap_cast: 3.0,
      C_metal_casting: 150000,
      C_ops_casting: 30000,
      C_machining_casting: 25000,
      C_pattern_amortization: 3000,
      COGS: 208000,
      pre_profit_price: 252000,
      P_CASTING: 282240,
    } as CastingResult,
  },
  {
    id: 'quote-103',
    rfq_id: 'rfq-103',
    segment: 'forging',
    status: 'DRAFT',
    currency: 'JPY',
    exchange_rate: 165,
    die_cost_treatment: 'separate',
    final_quoted_price: 145000,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_by_email: 'sales.thaco@disoco.vn',
    rfq: {
      id: 'rfq-103',
      customer_name: 'Công ty Cổ phần Thaco Industries',
      product_name: 'Cụm Bánh Răng Dập S45C',
      annual_volume: 30000,
      trade_terms: 'EXW',
      target_price: 140000,
      status: 'DRAFT',
      created_by_email: 'sales.thaco@disoco.vn',
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    },
    inputs_json: {
      m_tinh: 2.1,
      m_bavia: 0.45,
      k_loss: 2.5,
      DG_steel: 23500,
      DG_scrap: 8500,
      forging_machine_type: 'press',
      DG_forging_machine_hour: 950000,
      t_cut_sec: 20,
      t_forging_sec: 15,
      t_trim_sec: 10,
      C_die_total: 120000000,
      L_die_life: 12000,
      N_order: 1000,
      die_cost_treatment: 'separate',
      k_mgmt: 8,
      DG_trans_kg: 1500,
      k_profit_forging: 15,
    } as ForgingInput,
    results_json: {
      m_phoi: 2.615,
      C_mat_forging: 57626,
      C_ops_forging: 18500,
      C_machining: 28000,
      C_die_amortization: 0,
      COGS: 104126,
      pre_profit_price: 126086,
      P_FORGING: 145000,
      separate_die_cost: 120000000,
    } as ForgingResult,
  },
  {
    id: 'quote-104',
    rfq_id: 'rfq-104',
    segment: 'forging',
    status: 'CANCELLED',
    currency: 'VND',
    exchange_rate: 1,
    die_cost_treatment: 'amortized',
    final_quoted_price: 0,
    cancel_reason: 'Khách hàng thay đổi phương án thiết kế bản vẽ và ngưng dự án',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_by_email: 'sales.honda@disoco.vn',
    rfq: {
      id: 'rfq-104',
      customer_name: 'Yamaha Motor Việt Nam',
      product_name: 'Cần Khởi Động Xe Máy NVX',
      annual_volume: 50000,
      trade_terms: 'FOB',
      target_price: 45000,
      status: 'CANCELLED',
      cancel_reason: 'Khách hàng thay đổi phương án thiết kế bản vẽ và ngưng dự án',
      created_by_email: 'sales.honda@disoco.vn',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    inputs_json: {} as any,
    results_json: {} as any,
  },
];

// Memory cache for offline/fallback mode
let localQuotesCache = [...INITIAL_QUOTES];

/**
 * Migration helper: Maps old legacy statuses to unified status
 */
export const mapToUnifiedStatus = (oldStatus: string): UnifiedRfqStatus => {
  if (oldStatus === 'APPROVED' || oldStatus === 'SUCCESSFUL') return 'SUCCESSFUL';
  if (oldStatus === 'REJECTED' || oldStatus === 'CANCELLED') return 'CANCELLED';
  if (oldStatus === 'SENT') return 'SENT';
  return 'DRAFT'; // DRAFT or PENDING
};

/**
 * Fetch all RFQs and Quotes from Supabase DB or fallback seed data
 */
export const fetchQuotes = async (filter?: QuotationFilterOptions): Promise<QuoteRecord[]> => {
  try {
    const { data: dbQuotes, error } = await supabase
      .from('quotes')
      .select('*, rfq:rfqs(*)')
      .order('created_at', { ascending: false });

    if (!error && dbQuotes && dbQuotes.length > 0) {
      localQuotesCache = dbQuotes.map((q) => {
        const unified = mapToUnifiedStatus(q.rfq?.status || q.status);
        return {
          ...q,
          status: unified,
          rfq: q.rfq ? { ...q.rfq, status: unified } : undefined,
        };
      }) as QuoteRecord[];
    }
  } catch (err) {
    console.warn('Supabase DB offline or tables not created yet. Using memory cache:', err);
  }

  let list = [...localQuotesCache];

  if (!filter) return list;

  // Apply status filter (handling mapped statuses)
  if (filter.status && filter.status !== 'ALL') {
    const targetUnified = mapToUnifiedStatus(filter.status);
    list = list.filter((q) => mapToUnifiedStatus(q.status) === targetUnified || mapToUnifiedStatus(q.rfq?.status || '') === targetUnified);
  }

  if (filter.segment && filter.segment !== 'ALL') {
    list = list.filter((q) => q.segment === filter.segment);
  }

  if (filter.searchQuery && filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.rfq?.customer_name.toLowerCase().includes(q) ||
        item.rfq?.product_name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.rfq?.created_by_email && item.rfq.created_by_email.toLowerCase().includes(q))
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
 * Save RFQ & Quote Draft (DRAFT status)
 */
export const saveQuoteDraft = async (
  rfq: RfqHeaderState,
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

  // Try DB insert/update
  try {
    const { data: rfqData, error: rfqErr } = await supabase
      .from('rfqs')
      .insert({
        customer_name: rfq.customer_name,
        product_name: rfq.product_name,
        annual_volume: rfq.annual_volume,
        trade_terms: rfq.trade_terms,
        target_price: rfq.target_price,
        status: 'DRAFT',
        created_by_email: userEmail,
      })
      .select()
      .single();

    if (!rfqErr && rfqData) {
      const { data: quoteData, error: quoteErr } = await supabase
        .from('quotes')
        .insert({
          rfq_id: rfqData.id,
          segment,
          currency,
          exchange_rate: exchangeRate,
          inputs_json: inputs,
          results_json: results,
          status: 'DRAFT',
          die_cost_treatment: dieTreatment,
          final_quoted_price: finalPrice,
          created_by_email: userEmail,
        })
        .select('*, rfq:rfqs(*)')
        .single();

      if (!quoteErr && quoteData) {
        localQuotesCache.unshift(quoteData as QuoteRecord);
        return quoteData as QuoteRecord;
      }
    }
  } catch (err) {
    console.warn('Saving to Supabase failed, using memory cache:', err);
  }

  // Fallback memory cache save
  const newRfqId = `rfq-${Date.now()}`;
  const newQuoteId = existingQuoteId || `quote-${Date.now()}`;

  const newRecord: QuoteRecord = {
    id: newQuoteId,
    rfq_id: newRfqId,
    segment,
    status: 'DRAFT',
    currency,
    exchange_rate: exchangeRate,
    die_cost_treatment: dieTreatment,
    final_quoted_price: finalPrice,
    created_at: now,
    created_by_email: userEmail,
    rfq: {
      id: newRfqId,
      customer_name: rfq.customer_name,
      product_name: rfq.product_name,
      annual_volume: rfq.annual_volume,
      trade_terms: rfq.trade_terms,
      target_price: rfq.target_price,
      status: 'DRAFT',
      created_by_email: userEmail,
      created_at: now,
    },
    inputs_json: JSON.parse(JSON.stringify(inputs)),
    results_json: JSON.parse(JSON.stringify(results)),
  };

  localQuotesCache = [newRecord, ...localQuotesCache.filter((q) => q.id !== newQuoteId)];
  return newRecord;
};

/**
 * Send Quote (SENT status) - Freezes JSON Snapshots & sets sent_at
 */
export const sendQuote = async (
  rfq: RfqHeaderState,
  segment: SegmentType,
  currency: CurrencyType,
  exchangeRate: number,
  inputs: ForgingInput | CastingInput,
  results: ForgingResult | CastingResult,
  existingQuoteId?: string,
  userEmail: string = 'estimator@disoco.vn'
): Promise<QuoteRecord> => {
  const record = await saveQuoteDraft(rfq, segment, currency, exchangeRate, inputs, results, existingQuoteId, userEmail);

  record.status = 'SENT';
  if (record.rfq) record.rfq.status = 'SENT';
  record.sent_at = new Date().toISOString();
  // Freeze JSON snapshots
  record.inputs_json = JSON.parse(JSON.stringify(inputs));
  record.results_json = JSON.parse(JSON.stringify(results));

  try {
    await supabase.from('rfqs').update({ status: 'SENT' }).eq('id', record.rfq_id);
    await supabase
      .from('quotes')
      .update({
        status: 'SENT',
        sent_at: record.sent_at,
        currency,
        exchange_rate: exchangeRate,
        inputs_json: record.inputs_json,
        results_json: record.results_json,
      })
      .eq('id', record.id);
  } catch (err) {
    console.warn('Updating SENT status to Supabase failed, using memory cache:', err);
  }

  localQuotesCache = localQuotesCache.map((q) => (q.id === record.id ? record : q));
  return record;
};

/**
 * Cancel RFQ Immediately without calculation (CANCELLED status + cancel_reason)
 */
export const cancelRfqImmediately = async (
  rfq: RfqHeaderState,
  cancelReason: string,
  userEmail: string = 'sales@disoco.vn'
): Promise<QuoteRecord> => {
  const now = new Date().toISOString();
  const newRfqId = `rfq-cancelled-${Date.now()}`;
  const newQuoteId = `quote-cancelled-${Date.now()}`;

  const newRfq: RfqRecord = {
    id: newRfqId,
    customer_name: rfq.customer_name,
    product_name: rfq.product_name,
    annual_volume: rfq.annual_volume,
    trade_terms: rfq.trade_terms,
    target_price: rfq.target_price,
    status: 'CANCELLED',
    cancel_reason: cancelReason,
    is_feasible: false,
    created_by_email: userEmail,
    created_at: now,
  };

  const newRecord: QuoteRecord = {
    id: newQuoteId,
    rfq_id: newRfqId,
    segment: 'forging',
    status: 'CANCELLED',
    currency: 'VND',
    exchange_rate: 1,
    die_cost_treatment: 'amortized',
    final_quoted_price: 0,
    cancel_reason: cancelReason,
    created_at: now,
    created_by_email: userEmail,
    rfq: newRfq,
    inputs_json: {} as any,
    results_json: {} as any,
  };

  try {
    const { data: rfqData, error: rfqErr } = await supabase
      .from('rfqs')
      .insert({
        customer_name: rfq.customer_name,
        product_name: rfq.product_name,
        annual_volume: rfq.annual_volume,
        trade_terms: rfq.trade_terms,
        target_price: rfq.target_price,
        status: 'CANCELLED',
        cancel_reason: cancelReason,
        is_feasible: false,
        created_by_email: userEmail,
      })
      .select()
      .single();

    if (!rfqErr && rfqData) {
      await supabase.from('quotes').insert({
        rfq_id: rfqData.id,
        segment: 'forging',
        status: 'CANCELLED',
        currency: 'VND',
        exchange_rate: 1,
        inputs_json: {},
        results_json: {},
        die_cost_treatment: 'amortized',
        final_quoted_price: 0,
        cancel_reason: cancelReason,
        created_by_email: userEmail,
      });
    }
  } catch (err) {
    console.warn('Saving cancelled RFQ to Supabase failed, using memory cache:', err);
  }

  localQuotesCache = [newRecord, ...localQuotesCache];
  return newRecord;
};

/**
 * Update Quote/RFQ Unified Status (SUCCESSFUL / CANCELLED / SENT / DRAFT)
 */
export const updateQuoteStatus = async (
  quoteId: string,
  newStatus: UnifiedRfqStatus,
  cancelReason?: string
): Promise<void> => {
  const targetQuote = localQuotesCache.find((q) => q.id === quoteId);
  const rfqId = targetQuote?.rfq_id;

  try {
    if (rfqId) {
      await supabase
        .from('rfqs')
        .update({
          status: newStatus,
          cancel_reason: newStatus === 'CANCELLED' ? cancelReason : null,
        })
        .eq('id', rfqId);
    }

    await supabase
      .from('quotes')
      .update({
        status: newStatus,
        cancel_reason: newStatus === 'CANCELLED' ? cancelReason : null,
      })
      .eq('id', quoteId);
  } catch (err) {
    console.warn('Updating unified status in Supabase failed, using memory cache:', err);
  }

  localQuotesCache = localQuotesCache.map((q) => {
    if (q.id === quoteId) {
      return {
        ...q,
        status: newStatus,
        cancel_reason: newStatus === 'CANCELLED' ? cancelReason : q.cancel_reason,
        rfq: q.rfq
          ? {
              ...q.rfq,
              status: newStatus,
              cancel_reason: newStatus === 'CANCELLED' ? cancelReason : q.rfq.cancel_reason,
            }
          : undefined,
      };
    }
    return q;
  });
};
