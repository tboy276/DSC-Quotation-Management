import { useQuotationStore } from '../../store/useQuotationStore';
import { Workflow, Box } from 'lucide-react';
import { useParams } from 'react-router-dom';

export const SegmentSelector = () => {
  const segment = useQuotationStore((state) => state.segment);
  const setSegment = useQuotationStore((state) => state.setSegment);
  
  const { rfqItemId } = useParams();
  const activeRfqItemId = rfqItemId || null;

  const disabled = !!activeRfqItemId;

  return (
    <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
          Bước 2: Chọn Công Nghệ Sản Xuất (Segment)
        </h3>
      </div>

      <div 
        className="grid grid-cols-2 gap-3"
        title={disabled ? "Không thể đổi công nghệ vì bị khóa theo yêu cầu RFQ ban đầu" : ""}
      >
        {/* Nút 1: Rèn Dập (Forging) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setSegment('forging')}
          className={`flex items-center justify-center space-x-3 py-3 px-4 rounded-[8px] border text-xs font-bold transition-all ${
            segment === 'forging'
              ? 'bg-[#111111] text-white border-[#111111] shadow-xs scale-[1.01]'
              : 'bg-[#F9F9F8] text-[#787774] border-[#EAEAEA]'
          } ${!disabled && segment !== 'forging' ? 'hover:bg-[#F0F0EE] hover:text-[#111111] cursor-pointer' : ''} ${
            disabled && segment !== 'forging' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Workflow className="w-5 h-5 stroke-[2]" />
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight">Phân Hệ Rèn Dập</p>
            <p className="text-[10px] font-normal opacity-80">Forging Cost Engine</p>
          </div>
        </button>

        {/* Nút 2: Đúc Gang (Iron Casting) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setSegment('casting')}
          className={`flex items-center justify-center space-x-3 py-3 px-4 rounded-[8px] border text-xs font-bold transition-all ${
            segment === 'casting'
              ? 'bg-[#111111] text-white border-[#111111] shadow-xs scale-[1.01]'
              : 'bg-[#F9F9F8] text-[#787774] border-[#EAEAEA]'
          } ${!disabled && segment !== 'casting' ? 'hover:bg-[#F0F0EE] hover:text-[#111111] cursor-pointer' : ''} ${
            disabled && segment !== 'casting' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Box className="w-5 h-5 stroke-[2]" />
          <div className="text-left">
            <p className="text-sm font-extrabold leading-tight">Phân Hệ Đúc Gang</p>
            <p className="text-[10px] font-normal opacity-80">Iron Casting Cost Engine</p>
          </div>
        </button>
      </div>
    </div>
  );
};
