import { useState } from 'react';
import { useQuotationStore, type TradeTermType } from '../../store/useQuotationStore';
import { cancelRfqImmediately } from '../../lib/quotation-service';
import { useAuth } from '../../context/AuthContext';
import { User, Package, Hash, DollarSign, Globe, AlertOctagon, Check, XCircle } from 'lucide-react';

export const RfqHeaderForm = () => {
  const rfq = useQuotationStore((state) => state.rfq);
  const setRfqField = useQuotationStore((state) => state.setRfqField);
  const resetRfq = useQuotationStore((state) => state.resetRfq);
  const { profile, user } = useAuth();
  const userEmail = profile?.email || user?.email || 'sales@disoco.vn';

  const [isFeasible, setIsFeasible] = useState<boolean>(true);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const tradeTerms: TradeTermType[] = ['EXW', 'FOB', 'CIF', 'DAP'];

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    setIsSubmittingCancel(true);
    await cancelRfqImmediately(rfq, cancelReason.trim(), userEmail);
    setIsSubmittingCancel(false);

    setCancelSuccessMsg(
      `Đã ghi nhận RFQ "${rfq.product_name || 'Mới'}" ở trạng thái HUỶ BỎ (CANCELLED). Dữ liệu đã được lưu vào báo cáo thống kê.`
    );

    setTimeout(() => {
      resetRfq();
      setCancelSuccessMsg(null);
      setIsFeasible(true);
      setCancelReason('');
    }, 2500);
  };

  return (
    <div className="bg-white p-5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Bước 1: Thông Tin RFQ Yêu Cầu Báo Giá
          </h3>
        </div>
      </div>

      {cancelSuccessMsg && (
        <div className="p-3 bg-[#EDF3EC] border border-[#C6E1C4] rounded-[8px] text-[#346538] text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Tên khách hàng */}
        <div>
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
            Tên Khách Hàng (Customer)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={rfq.customer_name}
              onChange={(e) => setRfqField('customer_name', e.target.value)}
              placeholder="Nhập tên đối tác / công ty"
              className="block w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-[#111111] font-semibold text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Tên / Mã sản phẩm */}
        <div>
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
            Tên / Mã Sản Phẩm (Part Name / Code)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
              <Package className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={rfq.product_name}
              onChange={(e) => setRfqField('product_name', e.target.value)}
              placeholder="Ví dụ: Bánh Răng D450"
              className="block w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-[#111111] font-semibold text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Sản lượng dự kiến */}
        <div>
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
            Sản Lượng Dự Kiến (Pcs / Năm)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="1"
              value={rfq.annual_volume}
              onChange={(e) => setRfqField('annual_volume', Number(e.target.value))}
              className="block w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Target Price */}
        <div>
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
            Target Price (Giá Mục Tiêu Khách Hàng - VNĐ/Pcs)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="0"
              step="1000"
              value={rfq.target_price}
              onChange={(e) => setRfqField('target_price', Number(e.target.value))}
              placeholder="Nhập giá mục tiêu để so sánh"
              className="block w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-extrabold text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>
      </div>

      {/* Trade Terms Segmented Button */}
      <div>
        <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5 flex items-center">
          <Globe className="w-3.5 h-3.5 mr-1" />
          Điều Kiện Giao Hàng (Trade Terms)
        </label>
        <div className="inline-flex p-1 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA]">
          {tradeTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setRfqField('trade_terms', term)}
              className={`px-4 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                rfq.trade_terms === term
                  ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Feasibility Check Question (Phase 8 Section B) */}
      <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-3">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-[#111111]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            RFQ này có khả thi để tính giá không?
          </h4>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsFeasible(true)}
            className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer border ${
              isFeasible
                ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                : 'bg-white text-[#787774] border-[#EAEAEA] hover:text-[#111111]'
            }`}
          >
            ✓ Có, tiếp tục tính giá
          </button>

          <button
            type="button"
            onClick={() => setIsFeasible(false)}
            className={`px-4 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer border ${
              !isFeasible
                ? 'bg-[#FDEBEC] text-[#9F2F2D] border-[#FADBDC] shadow-xs'
                : 'bg-white text-[#787774] border-[#EAEAEA] hover:text-[#9F2F2D]'
            }`}
          >
            ✕ Không, huỷ ngay
          </button>
        </div>

        {/* Immediate Cancellation Form */}
        {!isFeasible && (
          <form onSubmit={handleCancelSubmit} className="pt-2 space-y-3 border-t border-[#EAEAEA] animate-fade-in-up">
            <div>
              <label className="block text-[10px] font-bold text-[#9F2F2D] uppercase tracking-wider mb-1">
                Lý Do Huỷ RFQ Ngay (Bắt Bắt Nhập Text Tự Do) *
              </label>
              <textarea
                rows={2}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do huỷ bỏ (Ví dụ: Khách hàng yêu cầu vượt quá khả năng dung sai, bản vẽ bị ngưng...)"
                className="w-full p-2.5 bg-white border border-[#FADBDC] rounded-[6px] text-xs text-[#111111] font-medium focus:outline-none focus:border-[#9F2F2D]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingCancel || !cancelReason.trim()}
                className="px-4 py-1.5 bg-[#9F2F2D] hover:bg-[#7F2321] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-xs disabled:opacity-40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingCancel ? 'Đang Lưu...' : 'Lưu RFQ & Đánh Dấu Huỷ Ngay'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
