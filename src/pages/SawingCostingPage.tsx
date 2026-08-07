import { ArrowLeft, Check, Copy, Save, CheckCircle2, AlertCircle, AlertTriangle, Layers, Calendar, Clock } from 'lucide-react';
import { useQuotationStore } from '../store/useQuotationStore';
import { usePricingCalculator } from '../hooks/usePricingCalculator';
import SawingCalculatorForm from '../components/rfq/SawingCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { CloneQuoteModal } from '../components/rfq/CloneQuoteModal';
import { QuoteStatusBadge } from '../components/rfq/QuoteStatusBadge';

const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString('vi-VN') : 'N/A';
const formatDateVerbose = (dStr?: string) => {
  if (!dStr) return 'N/A';
  const d = new Date(dStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function SawingCostingPage() {
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
  } = usePricingCalculator('sawing');

  const rfq = useQuotationStore(state => state.rfq);
  const currency = useQuotationStore(state => state.currency);

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
    <div className="w-full space-y-5">
      {/* Specific RFQ Item Dossier Header Banner */}
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
            <span>Khách hàng: <strong>{activeDossierRecord?.customer_name || rfq.customer_name}</strong></span>
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

        <button
          type="button"
          onClick={() => navigate('/quotations')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[6px] text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay Lại</span>
        </button>
      </div>

      {/* Action Toolbar Header */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Bảng Tính Giá Real-time ({currency})
            </h2>
            <p className="text-[11px] text-[#787774]">
              Luồng Tính Giá Phôi Cưa & Gia Công
            </p>
          </div>
          <QuoteStatusBadge status={activeItemRecord?.status || 'IN_COSTING'} size="sm" />
        </div>

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
            title="Hoàn thành tính giá"
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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-8 xl:col-span-3 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-sm font-bold text-slate-800 flex items-center">
             Luồng Tính Giá: Phôi Cưa & Gia Công
          </div>

          <SawingCalculatorForm />
        </div>
        <div className="lg:col-span-4 xl:col-span-1 xl:sticky xl:top-[88px]">
          <RealtimeSummaryPanel />
        </div>
      </div>

      {showCloneModal && (
        <CloneQuoteModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          onSelectClone={handleSelectCloneQuote}
          targetSegment="sawing"
        />
      )}
    </div>
  );
}
