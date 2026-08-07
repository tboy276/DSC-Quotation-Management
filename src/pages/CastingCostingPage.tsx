import { ArrowLeft, Check, Copy, Save, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useQuotationStore } from '../store/useQuotationStore';
import { usePricingCalculator } from '../hooks/usePricingCalculator';
import { CastingCalculatorForm } from '../components/rfq/CastingCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { CloneQuoteModal } from '../components/rfq/CloneQuoteModal';
import { QuoteStatusBadge } from '../components/rfq/QuoteStatusBadge';

const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString('vi-VN') : 'N/A';
const formatDateVerbose = (dStr?: string) => {
  if (!dStr) return 'N/A';
  const d = new Date(dStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function CastingCostingPage() {
  const {
    activeRfqItemId,
    activeItemRecord,
    activeDossierRecord,
    saving,
    msg,
    showCloneModal,
    setShowCloneModal,
    handleSaveDraft,
    handleCompleteCosting,
    handleSelectCloneQuote,
    navigate
  } = usePricingCalculator('casting');

  const rfq = useQuotationStore(state => state.rfq);

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
        <button
          onClick={() => navigate('/quotations')}
          className="flex items-center space-x-2 text-[#787774] hover:text-[#111111] transition-colors bg-white px-3 py-1.5 rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#EAEAEA] select-none cursor-pointer mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Màn Hình Quản Lý RFQ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fade-in-up">
      {/* Sleek Compact Header Bar (Warm Monochrome Minimalist) */}
      <div className="bg-[#FBFBFA] p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Product Info & Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="p-1.5 bg-white hover:bg-slate-100 text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer inline-flex items-center space-x-1 font-bold text-xs"
            title="Quay lại danh sách RFQ"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <div className="h-4 w-[1px] bg-[#EAEAEA] hidden sm:block" />

          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-mono font-bold text-[#111111] text-xs">
                [{activeItemRecord?.item_code || 'N/A'}]
              </span>
              <h2 className="text-sm font-bold text-[#111111] tracking-tight">
                {activeItemRecord?.product_name || rfq.product_name}
              </h2>
              <span className="font-mono text-xs text-[#787774]">
                (Part No: {activeItemRecord?.part_number || 'N/A'})
              </span>
              <QuoteStatusBadge status={activeItemRecord?.status || 'IN_COSTING'} size="sm" />
            </div>
            <div className="text-[11px] text-[#787774] flex items-center space-x-3">
              <span>Khách hàng: <strong className="text-[#111111]">{activeDossierRecord?.customer_name || rfq.customer_name}</strong></span>
              <span>•</span>
              <span className="font-mono">Ngày nhận: {formatDateVerbose(activeDossierRecord?.rfq_received_date)}</span>
              <span>•</span>
              <span className="font-mono">Deadline: {formatDate(activeDossierRecord?.customer_deadline)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons with Text Labels */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowCloneModal(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-[6px] transition-colors cursor-pointer inline-flex items-center space-x-1.5 text-xs font-bold"
            title="Sao chép toàn bộ thông số từ báo giá cũ tương tự"
          >
            <Copy className="w-3.5 h-3.5 text-amber-700" />
            <span>Sao chép</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 border border-[#EAEAEA] inline-flex items-center space-x-1.5 text-xs font-bold"
            title="Lưu bản nháp tính giá (Save Draft)"
          >
            <Save className="w-3.5 h-3.5 text-[#111111]" />
            <span>Lưu nháp</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteCosting}
            disabled={saving}
            className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white rounded-[6px] transition-all cursor-pointer disabled:opacity-50 shadow-xs inline-flex items-center space-x-1.5 text-xs font-bold"
            title="Hoàn thành tính giá"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span>Hoàn thành</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {msg && (
        <div
          className={`p-2.5 rounded-[8px] text-xs font-semibold flex items-center space-x-2 ${
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <CastingCalculatorForm />
        </div>
        <div className="lg:col-span-4 sticky top-20">
          <RealtimeSummaryPanel />
        </div>
      </div>

      {showCloneModal && (
        <CloneQuoteModal
          segment="casting"
          onClose={() => setShowCloneModal(false)}
          onSelectQuote={handleSelectCloneQuote}
        />
      )}
    </div>
  );
}
