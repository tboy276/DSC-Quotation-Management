import type { QuoteRecord, CurrencyType, RfqItemRecord } from './quote';
import type { TradeTermType } from '../store/useQuotationStore';

export interface DocumentRemarkLine {
  id: string;
  vi: string;
  en: string;
}

export interface DocumentDisplayConfig {
  templateType?: 'disoco_standard' | 'astemo_detail';
  language: 'vi' | 'en' | 'both';
  layoutOrientation?: 'portrait' | 'landscape';
  showWeightChi: boolean;
  showWeightPhoi: boolean;
  showWeightTinh: boolean;
  showMOQ: boolean;
  showMaterialCost: boolean;
  showFormingCost: boolean;
  showMachiningCost: boolean;
  showHeatTreatCost: boolean;
  showPaintCost: boolean;
  showPackageCost: boolean;
  showDeliveryCost: boolean;
  showSgaP: boolean;
  showToolingPrice: boolean;
  showToolingUsage: boolean;
  remarks: DocumentRemarkLine[];
}

export const DEFAULT_DISPLAY_CONFIG: DocumentDisplayConfig = {
  language: 'both',
  layoutOrientation: 'landscape',
  showWeightChi: false,
  showWeightPhoi: true,
  showWeightTinh: false,
  showMOQ: true,
  showMaterialCost: true,
  showFormingCost: true,
  showMachiningCost: true,
  showHeatTreatCost: true,
  showPaintCost: true,
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
      vi: 'Thanh toán: Theo hợp đồng nguyên tắc giữa 2 bên.',
      en: 'Payment: As per the principal/framework agreement between the two parties.',
    },
    {
      id: 'remark-5',
      vi: 'Thời gian giao hàng: 45-60 ngày đối với sample lot. 30 ngày với hàng sản xuất loạt.',
      en: 'Delivery time: 45-60 days for sample lot. 30 days for mass production lot.',
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
  status?: 'ACTIVE' | 'VOIDED';
  /**
   * Mã báo giá gộp, dạng BG-[rfq_code]-rev-XX. Được hệ thống tự sinh khi tạo văn bản,
   * bất biến sau khi phát hành. Dùng để tra cứu ngược từ PDF về RFQ gốc.
   */
  document_code?: string;
  /**
   * Mã RFQ cha (định dạng YYYYMMDD-XXX) mà TẤT CẢ các dòng sản phẩm trong văn bản này
   * bắt buộc phải cùng thuộc về. Lưu denormalized để tra cứu nhanh không cần join.
   */
  rfq_code?: string;
  /** Số thứ tự phiên bản báo giá đã phát hành cho cùng 1 rfq_code (bắt đầu từ 1). */
  revision?: number;
  customer_name: string;
  contact_person: string; // Attn
  contact_email?: string;
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
  /**
   * Mã RFQ cha chung của toàn bộ các dòng được chọn. Bắt buộc — service sẽ từ chối
   * tạo văn bản nếu không có giá trị này.
   */
  rfq_code: string;
  customer_name: string;
  contact_person: string;
  contact_email?: string;
  quotation_date: string;
  trade_terms: TradeTermType;
  currency: CurrencyType;
  exchange_rate: number;
  payment_terms: string;
  delivery_notes: string;
  display_config?: DocumentDisplayConfig;
  selected_quote_ids: string[];
}
