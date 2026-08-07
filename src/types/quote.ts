import type { SegmentType, TradeTermType } from '../store/useQuotationStore';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from '../lib/calculation-engine/types';

export type RfqItemStatus =
  | 'PENDING_REVIEW'
  | 'CANCELLED_NOT_FEASIBLE'
  | 'IN_COSTING'
  | 'READY_FOR_QUOTE'
  | 'QUOTED_SENT'
  | 'SUCCESSFUL'
  | 'CANCELLED_AFTER_QUOTE';

export type UnifiedRfqStatus = RfqItemStatus;

export type QuantityUnitType = 'pcs/năm' | 'pcs/tháng' | 'pcs/lô';

export type TechnologyRequirementType =
  | 'Phôi rèn'
  | 'Phôi đúc'
  | 'Phôi cưa'
  | 'Rèn+Gia công'
  | 'Đúc+Gia công'
  | 'Phôi cưa+Gia công'
  | 'Chỉ gia công CNC';

// Backward compatibility status type mapping
export type QuoteStatus = RfqItemStatus | 'DRAFT' | 'SENT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type CurrencyType = 'VND' | 'USD' | 'JPY' | 'EUR';

// 1. RFQ Dossier Header (Hồ Sơ Nhận Từ Khách Hàng)
export interface RfqDossier {
  id: string;
  customer_name: string;
  customer_address?: string;
  rfq_code?: string;
  customer_contact_person?: string;
  rfq_received_date: string; // YYYY-MM-DD
  customer_deadline: string; // YYYY-MM-DD
  trade_terms?: TradeTermType;
  delivery_address?: string;
  special_requirements?: string;
  notes?: string;
  technical_review_completed_at?: string | null;
  created_by?: string;
  created_by_email?: string;
  created_at: string;
  items?: RfqItemRecord[];
}

// 2. RFQ Item Line (Từng Mã Sản Phẩm Trong Hồ Sơ)
export interface RfqItemRecord {
  id: string;
  rfq_id: string;
  item_code?: string; // Auto-generated unique item code e.g. 20260803-001-01
  product_name: string;
  part_number: string;
  annual_volume: number;
  quantity_unit?: QuantityUnitType;
  target_price: number;
  technology_requirement?: TechnologyRequirementType;
  status: RfqItemStatus;
  cancel_reason?: string;
  quoted_sent_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  // Joined fields
  rfq?: RfqDossier;
  quote?: QuoteRecord;
}

// 3. Costing Quote Snapshot (Bản Tính Toán Cho 1 Sản Phẩm)
export interface QuoteRecord {
  id: string;
  rfq_item_id: string;
  segment: SegmentType;
  inputs_json: ForgingInput | CastingInput;
  results_json: ForgingResult | CastingResult;
  status: RfqItemStatus;
  currency: CurrencyType;
  exchange_rate: number;
  die_cost_treatment: string;
  final_quoted_price: number;
  created_at: string;
  sent_at?: string | null;
  cancel_reason?: string;
  created_by_email?: string;
  // Joined details
  rfqItem?: RfqItemRecord;
  rfq?: RfqDossier;
}

export interface QuotationFilterOptions {
  status?: RfqItemStatus | 'ALL' | QuoteStatus;
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  segment?: SegmentType | 'ALL';
  page?: number;
  pageSize?: number;
}

export interface PaginatedQuotationResponse {
  data: QuoteRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
