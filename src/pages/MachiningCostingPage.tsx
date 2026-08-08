import { ArrowLeft, Check, Copy, Save, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuotationStore } from '../store/useQuotationStore';
import { usePricingCalculator } from '../hooks/usePricingCalculator';
import MachiningCalculatorForm from '../components/rfq/MachiningCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { CloneQuoteModal } from '../components/rfq/CloneQuoteModal';
import { QuoteStatusBadge } from '../components/rfq/QuoteStatusBadge';
import { ActionButton } from '../components/ui/ActionButton';

const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString('vi-VN') : 'N/A';
const formatDateVerbose = (dStr?: string) => {
  if (!dStr) return 'N/A';
  const d = new Date(dStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function MachiningCostingPage() {
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
    navigate,
    isDirty
  } = usePricingCalculator('machining');

  const { setIsChildDirty } = (useOutletContext<any>() || {});

  useEffect(() => {
    if (setIsChildDirty) {
      setIsChildDirty(isDirty);
    }
  }, [isDirty, setIsChildDirty]);

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
        <ActionButton
          variant="neutral"
          icon={ArrowLeft}
          label="Quay Lại Màn Hình Quản Lý RFQ"
          onClick={() => navigate('/quotations')}
          className="mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fade-in-up">
      {/* Sleek Compact Header Bar (Warm Monochrome Minimalist) */}
      <div className="bg-[#FBFBFA] p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Product Info & Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ActionButton
            variant="neutral"
            icon={ArrowLeft}
            label="Quay lại"
            onClick={() => navigate('/quotations')}
            title="Quay lại danh sách RFQ"
          />

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
          <ActionButton
            variant="neutral"
            icon={Copy}
            label="Sao chép"
            onClick={() => setShowCloneModal(true)}
            title="Sao chép toàn bộ thông số từ báo giá cũ tương tự"
          />

          <ActionButton
            variant="neutral"
            icon={Save}
            label="Lưu nháp"
            onClick={handleSaveDraft}
            disabled={saving}
            title="Lưu bản nháp tính giá (Save Draft)"
          />

          <ActionButton
            variant="primary"
            icon={<Check className="text-emerald-400 stroke-[2.5]" />}
            label="Hoàn thành"
            onClick={handleCompleteCosting}
            disabled={saving}
            title="Hoàn thành tính giá"
          />
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
          <MachiningCalculatorForm />
        </div>
        <div className="lg:col-span-4 sticky top-20">
          <RealtimeSummaryPanel />
        </div>
      </div>

      {showCloneModal && (
        <CloneQuoteModal
          segment="machining"
          onClose={() => setShowCloneModal(false)}
          onSelectQuote={handleSelectCloneQuote}
        />
      )}
    </div>
  );
}
