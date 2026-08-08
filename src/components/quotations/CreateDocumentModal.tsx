import { useState, useEffect } from 'react';
import type { QuoteRecord, CurrencyType } from '../../types/quote';
import type { TradeTermType } from '../../store/useQuotationStore';
import type { QuotationDocument, DocumentDisplayConfig } from '../../types/quotation-document';
import { fetchQuotes } from '../../lib/quotation-service';
import { createQuotationDocument, DEFAULT_PAYMENT_TERMS, DEFAULT_DELIVERY_NOTES } from '../../lib/quotation-document-service';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { Modal } from '../ui/Modal';
import { QuotationPreviewPanel } from './QuotationPreviewPanel';
import { FileText, Check, Building2, ArrowRight, AlertTriangle } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';
import { useAuth } from '../../context/AuthContext';

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
  const { profile, user } = useAuth();
  const currentUserEmail = profile?.email || user?.email || '';

  const canManageQuote = (quote?: QuoteRecord | null): boolean => {
    if (!quote) return false;
    if (profile?.role === 'admin') return true;
    const creatorEmail = quote.rfq?.created_by_email || quote.created_by_email;
    return Boolean(currentUserEmail && creatorEmail === currentUserEmail);
  };

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [allReadyQuotes, setAllReadyQuotes] = useState<QuoteRecord[]>([]);
  const [customerOptions, setCustomerOptions] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [tradeTermWarning, setTradeTermWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const [finalConfig, setFinalConfig] = useState<DocumentDisplayConfig | undefined>(undefined);

  useEffect(() => {
    loadReadyQuotes();
  }, []);

  const loadReadyQuotes = async () => {
    try {
      setErrorMsg(null);
      const data = await fetchQuotes();
      // Filter quotes strictly in READY_FOR_QUOTE status and owned by current user (or Admin)
      const readyList = data.filter((q) => {
        const isStatusReady =
          q.rfqItem?.status === 'READY_FOR_QUOTE' ||
          q.status === 'READY_FOR_QUOTE' ||
          initialSelectedQuotes.some((sq) => sq.id === q.id);
        return isStatusReady && canManageQuote(q);
      });

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

      // Default selected IDs matching selected customer & same Trade Term
      const matchingQuotes = initialSelectedQuotes.filter(
        (q) => (q.rfq?.customer_name || '') === initialCustomer
      );

      if (matchingQuotes.length > 0) {
        const firstTerm = matchingQuotes[0].rfq?.trade_terms;
        const validQuotes = firstTerm
          ? matchingQuotes.filter((q) => !q.rfq?.trade_terms || q.rfq.trade_terms === firstTerm)
          : matchingQuotes;

        setSelectedQuoteIds(validQuotes.map((q) => q.id));
        if (firstTerm) setTradeTerms(firstTerm);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu báo giá.');
    }
  };

  // Filter available items for the selected customer ONLY
  const availableItemsForCustomer = allReadyQuotes.filter(
    (q) => (q.rfq?.customer_name || '') === selectedCustomer
  );

  const selectedQuoteObjects = allReadyQuotes.filter((q) =>
    selectedQuoteIds.includes(q.id)
  );

  const handleCustomerChange = (cust: string) => {
    setSelectedCustomer(cust);
    setTradeTermWarning(null);
    const matching = allReadyQuotes.filter((q) => (q.rfq?.customer_name || '') === cust);
    if (matching.length > 0) {
      const firstTerm = matching[0].rfq?.trade_terms;
      const validQuotes = firstTerm
        ? matching.filter((q) => !q.rfq?.trade_terms || q.rfq.trade_terms === firstTerm)
        : matching;
      setSelectedQuoteIds(validQuotes.map((q) => q.id));
      if (firstTerm) setTradeTerms(firstTerm);
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const toggleSelectQuote = (id: string) => {
    setTradeTermWarning(null);

    // If unchecking
    if (selectedQuoteIds.includes(id)) {
      setSelectedQuoteIds((prev) => prev.filter((i) => i !== id));
      return;
    }

    // Checking new quote: Check Trade Term consistency (A0)
    const targetQuote = allReadyQuotes.find((q) => q.id === id);
    if (!targetQuote) return;

    const targetTerm = targetQuote.rfq?.trade_terms;

    // Check currently selected items' trade terms
    const currentSelectedTerms = selectedQuoteObjects
      .map((q) => q.rfq?.trade_terms)
      .filter(Boolean) as TradeTermType[];

    if (currentSelectedTerms.length > 0 && targetTerm) {
      const existingTerm = currentSelectedTerms[0];
      if (targetTerm !== existingTerm) {
        const prodName = targetQuote.rfqItem?.product_name || 'Chi tiết';
        setTradeTermWarning(
          `Không thể gộp: "${prodName}" có Trade Term [${targetTerm}] khác với các sản phẩm khác trong văn bản ([${existingTerm}]).`
        );
        return;
      }
    }

    setSelectedQuoteIds((prev) => [...prev, id]);
    if (targetTerm) {
      setTradeTerms(targetTerm);
    }
  };

  const handleGoToPreview = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedQuoteIds.length === 0 || !selectedCustomer.trim()) return;
    setStep('preview');
  };

  const handleConfirmFinalSubmit = async (customConfig?: DocumentDisplayConfig) => {
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
        display_config: customConfig || finalConfig,
        selected_quote_ids: selectedQuoteIds,
      });

      setShowConfirmSendDialog(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating quotation document:', err);
      alert(`❌ LỖI GHI VĂN BẢN BÁO GIÁ THẤT BẠI TRÊN SUPABASE:\n${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tradeTermOptions: TradeTermType[] = ['EXW', 'FOB', 'CIF', 'DAP'];
  const currencyOptions: CurrencyType[] = ['VND', 'USD', 'JPY', 'EUR'];

  // Construct temp document object for preview panel
  const tempDocument: QuotationDocument = {
    id: `PREVIEW-${Date.now()}`,
    customer_name: selectedCustomer || 'Tên Khách Hàng',
    contact_person: contactPerson,
    contact_email: contactEmail,
    quotation_date: quotationDate,
    trade_terms: tradeTerms,
    currency,
    exchange_rate: exchangeRate,
    payment_terms: paymentTerms,
    delivery_notes: deliveryNotes,
    created_at: new Date().toISOString(),
    items: selectedQuoteObjects.map((q, idx) => ({
      id: `preview-item-${idx}`,
      quotation_document_id: 'PREVIEW',
      quote_id: q.id,
      display_order: idx + 1,
      created_at: new Date().toISOString(),
      quote: q,
      rfq_item: q.rfqItem,
    })),
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        size={step === 'preview' ? 'full' : 'xl'}
        maxWidthClass={step === 'preview' ? 'max-w-[98vw] max-h-[96vh]' : undefined}
        icon={<FileText className="w-4 h-4 stroke-[2]" />}
        title={
          step === 'form'
            ? 'Xây Dựng Văn Bản Báo Giá Gộp Gửi Khách Hàng'
            : 'Xem Trước & Tùy Chỉnh Thư Báo Giá DISOCO'
        }
        subtitle={
          step === 'form'
            ? 'Bước 1/2: Chọn mã sản phẩm cùng Khách hàng & Trade Term'
            : `Bước 2/2: Bật/tắt cột chi phí & dòng ghi chú trước khi phát hành cho ${selectedCustomer}`
        }
        footer={
          step === 'form' ? (
            <>
              <ActionButton
                variant="neutral"
                onClick={onClose}
                label="Hủy"
              />
              <ActionButton
                type="button"
                disabled={selectedQuoteIds.length === 0}
                onClick={() => handleGoToPreview()}
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
                label="Tiếp theo — Xem trước & Tuỳ chỉnh"
                className="active:scale-[0.98]"
              />
            </>
          ) : null
        }
      >
        {step === 'form' ? (
          <form id="create-document-form" onSubmit={handleGoToPreview} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] flex items-center space-x-2 text-red-800 text-xs font-semibold animate-fade-in-up">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {/* Warning Banner for Trade Term Mismatch */}
            {tradeTermWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] flex items-center space-x-2 text-amber-800 text-xs font-semibold animate-fade-in-up">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tradeTermWarning}</span>
              </div>
            )}

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
                  <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA] rounded-[8px] overflow-hidden bg-white max-h-56 overflow-y-auto">
                    {availableItemsForCustomer.map((q) => {
                      const isChecked = selectedQuoteIds.includes(q.id);
                      const item = q.rfqItem;
                      const qTradeTerm = q.rfq?.trade_terms || item?.rfq?.trade_terms || 'N/A';

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
                              <div className="flex items-center space-x-2">
                                <p className="font-bold text-[#111111]">
                                  {item?.product_name} ({item?.part_number || 'No PN'})
                                </p>
                                <span className="px-1.5 py-0.2 text-[9px] font-bold font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                                  {qTradeTerm}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#787774] font-mono mt-0.5">
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
                      Incoterms / Trade Terms (Đồng nhất theo Items)
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
        ) : (
          <QuotationPreviewPanel
            document={tempDocument}
            onBack={() => setStep('form')}
            onSaveAndSend={(customConfig) => {
              setFinalConfig(customConfig);
              setShowConfirmSendDialog(true);
            }}
            isSubmitting={submitting}
          />
        )}
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
            <ActionButton
              variant="neutral"
              onClick={() => setShowConfirmSendDialog(false)}
              label="Hủy"
            />
            <ActionButton
              type="button"
              disabled={submitting}
              onClick={() => handleConfirmFinalSubmit()}
              variant="primary"
              icon={Check}
              label={submitting ? 'Đang Phát Hành...' : 'Xác Nhận & Gửi Ngay'}
            />
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
