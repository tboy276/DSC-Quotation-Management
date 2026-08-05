import { useState, useEffect } from 'react';
import { useQuotationStore } from '../store/useQuotationStore';
import { saveQuoteDraft, updateQuoteStatus, fetchQuotes } from '../lib/quotation-service';
import type { QuoteRecord, RfqItemRecord, RfqDossier } from '../types/quote';
import { SegmentSelector } from '../components/rfq/SegmentSelector';
import { ForgingCalculatorForm } from '../components/rfq/ForgingCalculatorForm';
import { CastingCalculatorForm } from '../components/rfq/CastingCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { QuoteStatusBadge } from '../components/rfq/QuoteStatusBadge';
import { CloneQuoteModal } from '../components/rfq/CloneQuoteModal';
import { formatDate, formatDateVerbose } from '../lib/format-date';
import { Save, Check, Copy, CheckCircle2, AlertCircle, ArrowLeft, Layers, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface PricingCalculatorPageProps {
  onNavigateToQuotations?: () => void;
}

export const PricingCalculatorPage = ({ onNavigateToQuotations }: PricingCalculatorPageProps) => {
  const activeRfqItemId = useQuotationStore((state) => state.activeRfqItemId);
  const setRfqField = useQuotationStore((state) => state.setRfqField);
  const segment = useQuotationStore((state) => state.segment);
  const rfq = useQuotationStore((state) => state.rfq);
  const currency = useQuotationStore((state) => state.currency);
  const exchangeRate = useQuotationStore((state) => state.exchange_rate);
  const forgingInput = useQuotationStore((state) => state.forgingInput);
  const castingInput = useQuotationStore((state) => state.castingInput);
  const getForgingResult = useQuotationStore((state) => state.getForgingResult);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);
  const cloneInputsFromQuote = useQuotationStore((state) => state.cloneInputsFromQuote);

  const [activeItemRecord, setActiveItemRecord] = useState<RfqItemRecord | null>(null);
  const [activeDossierRecord, setActiveDossierRecord] = useState<RfqDossier | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | undefined>();
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!activeRfqItemId) {
      // Safeguard: Redirect if no active rfq_item_id is provided
      setMsg({
        type: 'warning',
        text: 'Vui lòng chọn 1 dòng sản phẩm từ Quản Lý RFQ để bắt đầu tính giá.',
      });
      return;
    }

    loadActiveItemDetails(activeRfqItemId);
  }, [activeRfqItemId]);

  const loadActiveItemDetails = async (itemId: string) => {
    const list = await fetchQuotes();
    const target = list.find((q) => q.rfq_item_id === itemId);
    if (target) {
      setActiveItemRecord(target.rfqItem || null);
      setActiveDossierRecord(target.rfq || null);
      setCurrentQuoteId(target.id);

      // Populate real data into store for calculations
      if (target.rfq?.customer_name) setRfqField('customer_name', target.rfq.customer_name);
      if (target.rfqItem?.product_name) setRfqField('product_name', target.rfqItem.product_name);
      if (target.rfqItem?.annual_volume) setRfqField('annual_volume', target.rfqItem.annual_volume);
      if (target.rfqItem?.target_price) setRfqField('target_price', target.rfqItem.target_price);
    }
  };

  // 1. Handle "Lưu Nháp" (saves quote, rfq_item.status remains IN_COSTING)
  const handleSaveDraft = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const inp = segment === 'forging' ? forgingInput : castingInput;
      const res = segment === 'forging' ? getForgingResult() : getCastingResult();

      const rfqPayload = {
        id: activeRfqItemId || undefined,
        product_name: activeItemRecord?.product_name || rfq.product_name,
        annual_volume: activeItemRecord?.annual_volume || rfq.annual_volume,
        target_price: activeItemRecord?.target_price || rfq.target_price,
        customer_name: activeDossierRecord?.customer_name || rfq.customer_name,
      };

      const record = await saveQuoteDraft(rfqPayload, segment, currency, exchangeRate, inp, res, currentQuoteId);
      setCurrentQuoteId(record.id);

      setMsg({
        type: 'success',
        text: `Đã lưu bản nháp tính giá cho sản phẩm "${rfqPayload.product_name}" thành công! (Mã quote: #${record.id.substring(0, 8)})`,
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ LỖI LƯU TÍNH GIÁ THẤT BẠI TRÊN SUPABASE: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  // 2. Handle "Hoàn Thành Tính Giá" (saves quote, updates rfq_item.status = READY_FOR_QUOTE, navigates back)
  const handleCompleteCosting = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const inp = segment === 'forging' ? forgingInput : castingInput;
      const res = segment === 'forging' ? getForgingResult() : getCastingResult();

      const rfqPayload = {
        id: activeRfqItemId || undefined,
        product_name: activeItemRecord?.product_name || rfq.product_name,
        annual_volume: activeItemRecord?.annual_volume || rfq.annual_volume,
        target_price: activeItemRecord?.target_price || rfq.target_price,
        customer_name: activeDossierRecord?.customer_name || rfq.customer_name,
      };

      const record = await saveQuoteDraft(rfqPayload, segment, currency, exchangeRate, inp, res, currentQuoteId);
      await updateQuoteStatus(record.id, 'READY_FOR_QUOTE');

      setMsg({
        type: 'success',
        text: `Đã hoàn thành tính giá cho "${rfqPayload.product_name}"! Trạng thái chuyển sang READY_FOR_QUOTE.`,
      });

      setTimeout(() => {
        if (onNavigateToQuotations) {
          onNavigateToQuotations();
        }
      }, 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: `❌ LỖI HOÀN THÀNH TÍNH GIÁ THẤT BẠI TRÊN SUPABASE: ${err?.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  // Handle clone quote selection
  const handleSelectCloneQuote = (selectedQuote: QuoteRecord) => {
    cloneInputsFromQuote(selectedQuote);
    setShowCloneModal(false);
    setMsg({
      type: 'success',
      text: `Đã sao chép thành công toàn bộ tham số tính giá từ báo giá mẫu #${selectedQuote.id.substring(0, 8)} (${selectedQuote.rfqItem?.product_name}). Bạn có thể điều chỉnh lại thông số khác biệt.`,
    });
  };

  // Render direct access warning if no item is selected
  if (!activeRfqItemId && !activeItemRecord) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-[#EAEAEA] rounded-[12px] shadow-sm text-center space-y-4 animate-fade-in-up">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#111111]">Chưa Chọn Sản Phẩm Để Tính Giá</h3>
          <p className="text-xs text-[#787774]">
            Vui lòng chọn 1 dòng sản phẩm từ danh sách Quản Lý RFQ để bắt đầu tính giá.
          </p>
        </div>
        {onNavigateToQuotations && (
          <button
            type="button"
            onClick={onNavigateToQuotations}
            className="px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại Màn Hình Quản Lý RFQ</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Specific RFQ Item Dossier Header Banner (REAL DATA ONLY) */}
      <div className="bg-[#111111] text-white p-4.5 rounded-[10px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-sky-400 font-mono text-[11px] uppercase tracking-wider font-bold">
            <Layers className="w-4 h-4" />
            <span>Đang Tính Giá Cho Mã Sản Phẩm: {activeItemRecord?.item_code || 'N/A'}</span>
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-white">
            Đang tính giá cho: <span className="text-amber-300">{activeItemRecord?.product_name || rfq.product_name}</span> (Part No: <span className="font-mono text-slate-300">{activeItemRecord?.part_number || 'N/A'}</span>)
          </h2>
          <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
            <span>Khách hàng: <strong>{activeDossierRecord?.customer_name || rfq.customer_name}</strong> (RFQ Code: <span className="font-mono text-amber-300 font-bold">{activeDossierRecord?.rfq_code || 'N/A'}</span>)</span>
            <span className="inline-flex items-center font-mono">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              Ngày nhận: {formatDateVerbose(activeDossierRecord?.rfq_received_date)}
            </span>
            <span className="inline-flex items-center font-mono">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              Deadline: {formatDate(activeDossierRecord?.customer_deadline)}
            </span>
          </p>
        </div>

        {onNavigateToQuotations && (
          <button
            type="button"
            onClick={onNavigateToQuotations}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[6px] text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay Lại Quản Lý RFQ</span>
          </button>
        )}
      </div>

      {/* Action Toolbar Header */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Bảng Tính Giá Real-time ({currency})
            </h2>
            <p className="text-[11px] text-[#787774]">
              Tự động tính giá vốn COGS và đơn giá báo giá theo công nghệ {segment === 'forging' ? 'Rèn Dập' : 'Đúc Gang'}
            </p>
          </div>
          <QuoteStatusBadge status={activeItemRecord?.status || 'IN_COSTING'} size="sm" />
        </div>

        {/* Section B: Icon-Only Action Buttons with Tooltips */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowCloneModal(true)}
            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-[6px] transition-colors cursor-pointer"
            title="Sao chép toàn bộ thông số từ báo giá cũ tương tự (+ Copy)"
          >
            <Copy className="w-4 h-4 text-amber-700" />
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 border border-[#EAEAEA]"
            title="Lưu bản nháp tính giá (Save Draft)"
          >
            <Save className="w-4 h-4 text-[#111111]" />
          </button>

          <button
            type="button"
            onClick={handleCompleteCosting}
            disabled={saving}
            className="p-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white rounded-[6px] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Hoàn thành tính giá — Chuyển sang Sẵn Sàng Lên Báo Giá (Ready for Quote)"
          >
            <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {msg && (
        <div
          className={`p-3 rounded-[8px] text-xs font-semibold flex items-center space-x-2 ${
            msg.type === 'success'
              ? 'bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]'
              : msg.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#FADBDC]'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Split-Screen Main Layout: Form (Left larger) + Real-time Summary (Right smaller) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-4 gap-6 items-start">
        {/* Left Column: Interactive Form Inputs */}
        <div className="lg:col-span-8 xl:col-span-3 space-y-5">
          {/* Step 1: Segment Choice (Rèn Dập vs Đúc Gang) */}
          <SegmentSelector />

          {/* Step 2: Detailed Segment Calculator Form */}
          {segment === 'forging' ? (
            <ForgingCalculatorForm />
          ) : (
            <CastingCalculatorForm />
          )}
        </div>

        {/* Right Column: Real-time Split-screen Calculation Summary Panel */}
        <div className="lg:col-span-4 xl:col-span-1 sticky top-6">
          <RealtimeSummaryPanel />
        </div>
      </div>

      {/* Clone Quote Modal */}
      {showCloneModal && (
        <CloneQuoteModal
          segment={segment}
          onClose={() => setShowCloneModal(false)}
          onSelectQuote={handleSelectCloneQuote}
        />
      )}
    </div>
  );
};
