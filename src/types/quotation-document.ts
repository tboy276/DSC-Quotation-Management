import type { QuoteRecord, CurrencyType, RfqItemRecord } from './quote';
import type { TradeTermType } from '../store/useQuotationStore';

export interface QuotationDocumentItem {
  id: string;
  quotation_document_id: string;
  quote_id: string;
  rfq_item_id?: string;
  display_order: number;
  created_at: string;
  // Joined quote snapshot
  quote?: QuoteRecord;
  rfq_item?: RfqItemRecord;
}

export interface QuotationDocument {
  id: string;
  customer_name: string;
  contact_person: string; // Attn
  contact_email: string;
  quotation_date: string;
  trade_terms: TradeTermType;
  currency: CurrencyType;
  exchange_rate: number;
  payment_terms: string;
  delivery_notes: string;
  created_by?: string;
  created_at: string;
  // Joined items
  items?: QuotationDocumentItem[];
}

export interface CreateQuotationDocumentPayload {
  customer_name: string;
  contact_person: string;
  contact_email: string;
  quotation_date: string;
  trade_terms: TradeTermType;
  currency: CurrencyType;
  exchange_rate: number;
  payment_terms: string;
  delivery_notes: string;
  selected_quote_ids: string[];
}
