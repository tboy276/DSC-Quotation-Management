import { useState } from 'react';
import type { QuoteRecord, CurrencyType } from '../../types/quote';
import type { TradeTermType } from '../../store/useQuotationStore';
import {
  createQuotationDocument,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_DELIVERY_NOTES,
} from '../../lib/quotation-document-service';
import { FileText, User, Mail, X, Check } from 'lucide-react';

interface CreateDocumentModalProps {
  selectedQuotes: QuoteRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDocumentModal = ({
  selectedQuotes,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) => {
  const firstQuote = selectedQuotes[0];
  const defaultCustomer = firstQuote?.rfq?.customer_name || 'Khách hàng DISOCO';
  const defaultTradeTerms: TradeTermType = firstQuote?.rfq?.trade_terms || 'FOB';
  const defaultCurrency: CurrencyType = firstQuote?.currency || 'VND';
  const defaultExchangeRate = firstQuote?.exchange_rate || 1;

  const [customerName, setCustomerName] = useState<string>(defaultCustomer);
  const [contactPerson, setContactPerson] = useState<string>('Mr. Attn (Phòng Mua Hàng)');
  const [contactEmail, setContactEmail] = useState<string>('contact@customer.com');
  const [quotationDate, setQuotationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [tradeTerms, setTradeTerms] = useState<TradeTermType>(defaultTradeTerms);
  const [currency, setCurrency] = useState<CurrencyType>(defaultCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(defaultExchangeRate);
  const [paymentTerms, setPaymentTerms] = useState<string>(DEFAULT_PAYMENT_TERMS);
  const [deliveryNotes, setDeliveryNotes] = useState<string>(DEFAULT_DELIVERY_NOTES);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuotes.length === 0 || !customerName.trim()) return;

    setSubmitting(true);

    try {
      await createQuotationDocument({
        customer_name: customerName,
        contact_person: contactPerson,
        contact_email: contactEmail,
        quotation_date: quotationDate,
        trade_terms: tradeTerms,
        currency,
        exchange_rate: exchangeRate,
        payment_terms: paymentTerms,
        delivery_notes: deliveryNotes,
        selected_quote_ids: selectedQuotes.map((q) => q.id),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating quotation document:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const tradeTermOptions: TradeTermType[] = ['EXW', 'FOB', 'CIF', 'DAP'];
  const currencyOptions: CurrencyType[] = ['VND', 'USD', 'JPY', 'EUR'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-up">
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 text-xs text-[#111111]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#111111] text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111]">
                Gộp {selectedQuotes.length} Sản Phẩm Thành Văn Bản Báo Giá
              </h3>
              <p className="text-[10px] text-[#787774]">
                Tạo văn bản báo giá tổng hợp gửi khách hàng (Bao gồm danh sách Part Numbers)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#787774] hover:text-[#111111] p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Products Preview List */}
        <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
          <p className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
            Danh Sách {selectedQuotes.length} Sản Phẩm Được Gộp
          </p>
          <div className="space-y-1">
            {selectedQuotes.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-center justify-between py-1 px-2 bg-white rounded border border-[#EAEAEA] text-[11px]"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[9px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-[#111111]">{q.rfq?.product_name}</span>
                </div>
                <span className="font-mono font-bold text-[#111111]">
                  {Math.round(q.final_quoted_price).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Information Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tên khách hàng */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Tên Khách Hàng (Customer Company)
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-bold text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            {/* Người nhận Attn */}
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Người Nhận (Attn / Contact Person)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#787774]" />
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ví dụ: Mr. Kenji Sato"
                  className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Email người nhận */}
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Email Người Nhận
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#787774]" />
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@customer.com"
                  className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Ngày báo giá */}
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Ngày Lập Văn Bản Báo Giá
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111] focus:outline-none"
              />
            </div>

            {/* Trade Terms */}
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Điều Kiện Giao Hàng (Incoterm)
              </label>
              <select
                value={tradeTerms}
                onChange={(e) => setTradeTerms(e.target.value as TradeTermType)}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                {tradeTermOptions.map((t) => (
                  <option key={t} value={t}>
                    {t} Terms
                  </option>
                ))}
              </select>
            </div>

            {/* Tiền tệ & Tỷ giá */}
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Tiền Tệ Văn Bản
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  const newCur = e.target.value as CurrencyType;
                  setCurrency(newCur);
                  if (newCur === 'VND') setExchangeRate(1);
                  else if (newCur === 'USD') setExchangeRate(25400);
                  else if (newCur === 'JPY') setExchangeRate(165);
                  else if (newCur === 'EUR') setExchangeRate(27500);
                }}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Tỷ Giá Quy Đổi (VNĐ)
              </label>
              <input
                type="number"
                disabled={currency === 'VND'}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111] disabled:bg-[#F0F0EE]"
              />
            </div>
          </div>

          {/* Điều khoản thanh toán */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Nội Dung Điều Khoản Thanh Toán (Payment Terms)
            </label>
            <textarea
              rows={2}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none"
            />
          </div>

          {/* Ghi chú thời gian giao hàng */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Ghi Chú Thời Gian Giao Hàng (Delivery Notes)
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-[#EAEAEA]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>Tạo Văn Bản Báo Giá</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
