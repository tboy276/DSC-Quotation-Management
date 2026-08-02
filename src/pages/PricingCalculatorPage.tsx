import { useState } from 'react';
import { useQuotationStore } from '../store/useQuotationStore';
import { saveQuoteDraft, sendQuote } from '../lib/quotation-service';
import { RfqHeaderForm } from '../components/rfq/RfqHeaderForm';
import { SegmentSelector } from '../components/rfq/SegmentSelector';
import { ForgingCalculatorForm } from '../components/rfq/ForgingCalculatorForm';
import { CastingCalculatorForm } from '../components/rfq/CastingCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { QuoteStatusBadge } from '../components/rfq/QuoteStatusBadge';
import type { QuoteStatus } from '../types/quote';
import { Save, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const PricingCalculatorPage = () => {
  const segment = useQuotationStore((state) => state.segment);
  const rfq = useQuotationStore((state) => state.rfq);
  const currency = useQuotationStore((state) => state.currency);
  const exchangeRate = useQuotationStore((state) => state.exchange_rate);
  const forgingInput = useQuotationStore((state) => state.forgingInput);
  const castingInput = useQuotationStore((state) => state.castingInput);
  const getForgingResult = useQuotationStore((state) => state.getForgingResult);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);

  const [status, setStatus] = useState<QuoteStatus>('DRAFT');
  const [currentQuoteId, setCurrentQuoteId] = useState<string | undefined>();
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Xử lý Lưu Nháp (DRAFT)
  const handleSaveDraft = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const inp = segment === 'forging' ? forgingInput : castingInput;
      const res = segment === 'forging' ? getForgingResult() : getCastingResult();

      const record = await saveQuoteDraft(rfq, segment, currency, exchangeRate, inp, res, currentQuoteId);
      setCurrentQuoteId(record.id);
      setStatus(record.status);
      setMsg({ type: 'success', text: `Đã lưu bản nháp báo giá (${currency}) thành công! (Mã: #${record.id.substring(0, 8)})` });
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Có lỗi xảy ra khi lưu bản nháp.' });
    } finally {
      setSaving(false);
    }
  };

  // Xử lý Gửi Báo Giá (SENT) - Đóng băng snapshot JSON & Tỷ giá
  const handleSendQuote = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const inp = segment === 'forging' ? forgingInput : castingInput;
      const res = segment === 'forging' ? getForgingResult() : getCastingResult();

      const record = await sendQuote(rfq, segment, currency, exchangeRate, inp, res, currentQuoteId);
      setCurrentQuoteId(record.id);
      setStatus(record.status);
      setMsg({
        type: 'success',
        text: `Đã đóng băng dữ liệu snapshot (${currency} - Tỷ giá: ${exchangeRate.toLocaleString('vi-VN')}) & Gửi báo giá thành công! (Mã: #${record.id.substring(0, 8)})`,
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Có lỗi xảy ra khi gửi báo giá.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Action Toolbar Header */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Bộ Công Cụ Nhập RFQ & Tính Giá Real-time ({currency})
            </h2>
            <p className="text-[11px] text-[#787774]">
              Nhập thông tin sản phẩm, chọn công nghệ và đóng băng snapshot tỷ giá khi gửi báo giá
            </p>
          </div>
          <QuoteStatusBadge status={status} size="sm" />
        </div>

        {/* Buttons Group */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] text-xs font-bold rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#787774]" />
            <span>Lưu Nháp (DRAFT)</span>
          </button>

          <button
            type="button"
            onClick={handleSendQuote}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Send className="w-4 h-4 text-sky-300 stroke-[2]" />
            <span>Gửi Báo Giá (SENT)</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {msg && (
        <div
          className={`p-3 rounded-[8px] text-xs font-semibold flex items-center space-x-2 ${
            msg.type === 'success'
              ? 'bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]'
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

      {/* Split-Screen Main Layout: Form (Left 60%) + Real-time Summary (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Form Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: RFQ General Info */}
          <RfqHeaderForm />

          {/* Step 2: Segment Choice (Rèn Dập vs Đúc Gang) */}
          <SegmentSelector />

          {/* Step 3: Detailed Segment Calculator Form */}
          {segment === 'forging' ? (
            <ForgingCalculatorForm />
          ) : (
            <CastingCalculatorForm />
          )}
        </div>

        {/* Right Column: Real-time Split-screen Calculation Summary Panel */}
        <div className="lg:col-span-5">
          <RealtimeSummaryPanel />
        </div>
      </div>
    </div>
  );
};
