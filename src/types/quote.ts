import type { SegmentType, TradeTermType } from '../store/useQuotationStore';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from '../lib/calculation-engine/types';

export type UnifiedRfqStatus = 'DRAFT' | 'SENT' | 'SUCCESSFUL' | 'CANCELLED';

// Backward compatibility status type mapping
export type QuoteStatus = UnifiedRfqStatus | 'PENDING' | 'APPROVED' | 'REJECTED';

export type CurrencyType = 'VND' | 'USD' | 'JPY' | 'EUR';

export interface RfqRecord {
  id: string;
  customer_name: string;
  product_name: string;
  annual_volume: number;
  trade_terms: TradeTermType;
  target_price: number;
  status: UnifiedRfqStatus;
  cancel_reason?: string;
  is_feasible?: boolean; // false if cancelled immediately without calculation
  created_by?: string;
  created_by_email?: string;
  created_at: string;
}

export interface QuoteRecord {
  id: string;
  rfq_id: string;
  segment: SegmentType;
  inputs_json: ForgingInput | CastingInput;
  results_json: ForgingResult | CastingResult;
  status: UnifiedRfqStatus;
  currency: CurrencyType;
  exchange_rate: number;
  die_cost_treatment: string;
  final_quoted_price: number;
  created_at: string;
  sent_at?: string | null;
  cancel_reason?: string;
  created_by_email?: string;
  // Joined RFQ details
  rfq?: RfqRecord;
}

export interface QuotationFilterOptions {
  status?: UnifiedRfqStatus | 'ALL' | QuoteStatus;
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  segment?: SegmentType | 'ALL';
}
