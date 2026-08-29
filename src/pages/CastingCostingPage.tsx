import { ArrowLeft, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuotationStore } from '../store/useQuotationStore';
import { usePricingCalculator } from '../hooks/usePricingCalculator';
import { CastingCalculatorForm } from '../components/rfq/CastingCalculatorForm';
import { RealtimeSummaryPanel } from '../components/rfq/RealtimeSummaryPanel';
import { CloneQuoteModal } from '../components/rfq/CloneQuoteModal';
import { ActionButton } from '../components/ui/ActionButton';
import { CostingPageToolbar } from '../components/rfq/CostingPageToolbar';




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
    navigate,
    isDirty
  } = usePricingCalculator('casting');

  const { setIsChildDirty } = (useOutletContext<any>() || {});

  useEffect(() => {
    if (setIsChildDirty) {
      setIsChildDirty(isDirty);
    }
  }, [isDirty, setIsChildDirty]);

  const rfq = useQuotationStore(state => state.rfq);
  const castingInput = useQuotationStore(state => state.castingInput);
  const isCastingInputValid = castingInput.Y_yield !== undefined && castingInput.Y_yield > 0;

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
      <CostingPageToolbar
        onBack={() => navigate('/quotations')}
        onClone={() => setShowCloneModal(true)}
        onSaveDraft={handleSaveDraft}
        onComplete={handleCompleteCosting}
        saving={saving}
        itemRecord={activeItemRecord}
        disableSave={!isCastingInputValid}
        disableSaveReason="Vui lòng nhập Tỷ lệ thu hồi kim loại trước khi lưu báo giá"
        dossierRecord={activeDossierRecord}
        rfqRecord={rfq}
      />

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
