import type { QuoteRecord, CurrencyType, RfqItemRecord } from './quote';
import type { TradeTermType } from '../store/useQuotationStore';

export interface DocumentRemarkLine {
  id: string;
  vi: string;
  en: string;
}

export interface DocumentDisplayConfig {
  language: 'vi' | 'en' | 'both';
  layoutOrientation?: 'portrait' | 'landscape';
  showWeight: boolean;
  showMOQ: boolean;
  showFormingCost: boolean;
  showMachiningCost: boolean;
  showPackageCost: boolean;
  showDeliveryCost: boolean;
  showSgaP: boolean;
  showToolingPrice: boolean;
  showToolingUsage: boolean;
  remarks: DocumentRemarkLine[];
}

export const DEFAULT_DISPLAY_CONFIG: DocumentDisplayConfig = {
  language: 'both',
  layoutOrientation: 'portrait',
  showWeight: true,
  showMOQ: true,
  showFormingCost: true,
  showMachiningCost: true,
  showPackageCost: true,
  showDeliveryCost: true,
  showSgaP: true,
  showToolingPrice: true,
  showToolingUsage: true,
  remarks: [
    {
      id: 'remark-1',
      vi: 'Đơn giá trên chưa bao gồm thuế VAT.',
      en: 'Prices quoted above do not include VAT.',
    },
    {
      id: 'remark-2',
      vi: 'Trọng lượng phôi trong báo giá là tạm tính, sẽ được thống nhất lại bằng trọng lượng thực tế trước khi sản xuất loạt.',
      en: 'Rough weight in quotation is estimated and will be confirmed by actual weight before mass production.',
    },
    {
      id: 'remark-3',
      vi: 'Điều kiện giao hàng: Theo thoả thuận Incoterms 2020.',
      en: 'Delivery terms: As per agreed Incoterms 2020.',
    },
    {
      id: 'remark-4',
      vi: 'Thanh toán: Theo điều khoản thanh toán ghi trên văn bản.',
      en: 'Payment: According to payment terms specified in this document.',
    },
    {
      id: 'remark-5',
      vi: 'Thời gian giao hàng: Theo tiến độ thoả thuận trong hợp đồng.',
      en: 'Delivery time: According to schedule agreed in contract.',
    },
  ],
};

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
  display_config?: DocumentDisplayConfig;
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
  display_config?: DocumentDisplayConfig;
  selected_quote_ids: string[];
}
