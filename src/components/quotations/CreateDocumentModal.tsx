import { useState, useEffect } from 'react';
import type { QuoteRecord, CurrencyType } from '../../types/quote';
import type { TradeTermType } from '../../store/useQuotationStore';
import { fetchQuotes } from '../../lib/quotation-service';
import { createQuotationDocument, DEFAULT_PAYMENT_TERMS, DEFAULT_DELIVERY_NOTES } from '../../lib/quotation-document-service';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { Modal } from '../ui/Modal';
import { FileText, Check, Building2 } from 'lucide-react';

interface CreateDocumentModalProps {
  selectedQuotes: QuoteRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDocumentModal = ({
  selectedQuotes: initialSelectedQuotes,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) => {
  const [allReadyQuotes, setAllReadyQuotes] = useState<QuoteRecord[]>([]);
  const [customerOptions, setCustomerOptions] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  // Form State
  const [contactPerson, setContactPerson] = useState<string>('Mr. Attn (Phòng Mua Hàng)');
  const [contactEmail, setContactEmail] = useState<string>('contact@customer.com');
  const [quotationDate, setQuotationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [tradeTerms, setTradeTerms] = useState<TradeTermType>('FOB');
  const [currency, setCurrency] = useState<CurrencyType>('VND');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [paymentTerms, setPaymentTerms] = useState<string>(DEFAULT_PAYMENT_TERMS);
  const [deliveryNotes, setDeliveryNotes] = useState<string>(DEFAULT_DELIVERY_NOTES);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState<boolean>(false);

  useEffect(() => {
    loadReadyQuotes();
  }, []);

  const loadReadyQuotes = async () => {
    const data = await fetchQuotes();
    // Filter quotes in READY_FOR_QUOTE or IN_COSTING or QUOTED_SENT
    const readyList = data.filter(
      (q) =>
        q.rfqItem?.status === 'READY_FOR_QUOTE' ||
        q.rfqItem?.status === 'IN_COSTING' ||
        q.status === 'READY_FOR_QUOTE' ||
        initialSelectedQuotes.some((sq) => sq.id === q.id)
    );

    setAllReadyQuotes(readyList);

    // Extract unique customers
    const customers = Array.from(
      new Set(readyList.map((q) => q.rfq?.customer_name || 'Khách hàng DISOCO'))
    );
    setCustomerOptions(customers);

    // Default customer
    const initialCustomer =
      initialSelectedQuotes[0]?.rfq?.customer_name || customers[0] || '';
    setSelectedCustomer(initialCustomer);

    // Default selected IDs matching selected customer
    const matchingIds = initialSelectedQuotes
      .filter((q) => (q.rfq?.customer_name || '') === initialCustomer)
      .map((q) => q.id);

    setSelectedQuoteIds(matchingIds);
  };

  // Filter available items for the selected customer ONLY
  const availableItemsForCustomer = allReadyQuotes.filter(
    (q) => (q.rfq?.customer_name || '') === selectedCustomer
  );

  const handleCustomerChange = (cust: string) => {
    setSelectedCustomer(cust);
    const firstMatching = availableItemsForCustomer.map((q) => q.id);
    setSelectedQuoteIds(firstMatching.slice(0, 5));
  };

  const toggleSelectQuote = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmFinalSubmit = async () => {
    if (selectedQuoteIds.length === 0 || !selectedCustomer.trim()) return;

    setSubmitting(true);

    try {
      await createQuotationDocument({
        customer_name: selectedCustomer,
        contact_person: contactPerson,
        contact_email: contactEmail,
        quotation_date: quotationDate,
        trade_terms: tradeTerms,
        currency,
        exchange_rate: exchangeRate,
        payment_terms: paymentTerms,
        delivery_notes: deliveryNotes,
        selected_quote_ids: selectedQuoteIds,
      });

      setShowConfirmSendDialog(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating quotation document:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedQuoteObjects = allReadyQuotes.filter((q) =>
    selectedQuoteIds.includes(q.id)
  );

  const tradeTermOptions: TradeTermType[] = ['EXW', 'FOB', 'CIF', 'DAP'];
  const currencyOptions: CurrencyType[] = ['VND', 'USD', 'JPY', 'EUR'];

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        size="2xl"
        icon={<FileText className="w-4 h-4 stroke-[2]" />}
        title="Xây Dựng Văn Bản Báo Giá Gộp Gửi Khách Hàng (Phase 6/10)"
        subtitle="Chọn 1 khách hàng → Gộp các mã sản phẩm READY_FOR_QUOTE → Xuất Thư Báo Giá"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting || selectedQuoteIds.length === 0}
              onClick={() => setShowConfirmSendDialog(true)}
              className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer disabled:opacity-40 inline-flex items-center space-x-1.5 shadow-sm text-xs"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Đã hoàn thành báo giá — Gửi cho khách hàng?</span>
            </button>
          </>
        }
      >
        <form id="create-document-form" onSubmit={(e) => { e.preventDefault(); setShowConfirmSendDialog(true); }} className="space-y-4">
          {/* Step 1: Customer Selection Dropdown */}
          <div className="p-3.5 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-2">
            <div className="flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-[#111111]" />
              <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                Bước 1: Chọn Khách Hàng (Bắt Buộc Nhất Quán)
              </h4>
            </div>

            <select
              value={selectedCustomer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
            >
              <option value="">-- Chọn khách hàng có sản phẩm READY_FOR_QUOTE --</option>
              {customerOptions.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Items for Quote Document */}
          {selectedCustomer && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                  Bước 2: Chọn Đa Sản Phẩm Thuộc "{selectedCustomer}" ({availableItemsForCustomer.length} sẵn sàng)
                </h4>
                <span className="text-[10px] text-[#787774] font-mono">
                  Đã chọn {selectedQuoteIds.length}/{availableItemsForCustomer.length} sản phẩm
                </span>
              </div>

              {availableItemsForCustomer.length === 0 ? (
                <p className="text-xs text-[#787774] italic p-4 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] text-center">
                  Không có mã sản phẩm nào của khách hàng này ở trạng thái Sẵn Sàng Báo Giá (READY_FOR_QUOTE).
                </p>
              ) : (
                <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA] rounded-[8px] overflow-hidden bg-white">
                  {availableItemsForCustomer.map((q) => {
                    const isChecked = selectedQuoteIds.includes(q.id);
                    const item = q.rfqItem;
                    return (
                      <label
                        key={q.id}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#F7F6F3]' : 'hover:bg-[#FBFBFA]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectQuote(q.id)}
                            className="rounded accent-[#111111] w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-[#111111]">
                              {item?.product_name} ({item?.part_number || 'No PN'})
                            </p>
                            <p className="text-[10px] text-[#787774] font-mono">
                              Công nghệ: {item?.technology_requirement || 'N/A'} | SL: {(item?.annual_volume || 0).toLocaleString('vi-VN')} {item?.quantity_unit || 'pcs/năm'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-extrabold text-[#111111]">
                            {formatCurrencyValue(q.final_quoted_price, currency, exchangeRate)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Quotation Document Information & Trade Terms */}
          {selectedCustomer && (
            <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-3">
              <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                Bước 3: Thông Tin Người Nhận & Điều Khoản Thương Mại
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Người Nhận (Attn Person) *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ví dụ: Mr. Kenji Sato (P. Mua hàng)"
                    className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-semibold text-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Email Liên Hệ Người Nhận
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="kenji.sato@honda.com.vn"
                    className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Ngày Lập Văn Bản *
                  </label>
                  <input
                    type="date"
                    required
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-mono text-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Incoterms / Trade Terms
                  </label>
                  <select
                    value={tradeTerms}
                    onChange={(e) => setTradeTerms(e.target.value as TradeTermType)}
                    className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-bold text-[#111111]"
                  >
                    {tradeTermOptions.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Tiền Tệ Văn Bản Báo Giá
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                      className="w-1/2 p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-bold text-[#111111]"
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {currency !== 'VND' && (
                      <input
                        type="number"
                        min="1"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value))}
                        placeholder="Tỷ giá"
                        className="w-1/2 p-2 border border-[#EAEAEA] bg-white rounded-[6px] font-mono text-xs text-[#111111]"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                  Điều Khoản Thanh Toán (Payment Terms)
                </label>
                <textarea
                  rows={2}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                  Ghi Chú Giao Hàng (Delivery Notes)
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Confirmation Dialog before Final Sending */}
      <Modal
        isOpen={showConfirmSendDialog}
        onClose={() => setShowConfirmSendDialog(false)}
        size="sm"
        icon={<FileText className="w-5 h-5 text-[#111111]" />}
        title="Xác Nhận Gửi Báo Giá Cho Khách Hàng"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowConfirmSendDialog(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmFinalSubmit}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? 'Đang Phát Hành...' : 'Xác Nhận & Gửi Ngay'}</span>
            </button>
          </>
        }
      >
        <p className="text-xs text-[#787774] leading-relaxed">
          Bạn có chắc chắn muốn phát hành Văn Bản Báo Giá cho khách hàng <strong>"{selectedCustomer}"</strong> gồm <strong>{selectedQuoteObjects.length} mã sản phẩm</strong>?
          <br />
          <span className="text-[#346538] font-bold block mt-1">
            ✓ Tất cả mã sản phẩm trong văn bản sẽ được chuyển sang trạng thái QUOTED_SENT và lưu ngày gửi quoted_sent_at.
          </span>
        </p>
      </Modal>
    </>
  );
};
