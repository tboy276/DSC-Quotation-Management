import React from 'react';
import { Info, Calculator } from 'lucide-react';

interface ToolingAmortizationSectionProps {
  isForging: boolean;
  treatment: 'amortized' | 'separate';
  onTreatmentChange: (treatment: 'amortized' | 'separate') => void;
  N_order: number;
  onNOrderChange: (value: number) => void;
  totalToolingCost: number;
  autoToolLife: number;
  amortizationCostPerUnit: number;
}

export const ToolingAmortizationSection: React.FC<ToolingAmortizationSectionProps> = ({
  isForging,
  treatment,
  onTreatmentChange,
  N_order,
  onNOrderChange,
  totalToolingCost,
  autoToolLife,
  amortizationCostPerUnit,
}) => {
  const isAmortized = treatment === 'amortized';
  const toolName = isForging ? 'khuôn' : 'mẫu';

  // Default quantity is autoToolLife (fallback to 20,000 if not available)
  const defaultLife = autoToolLife > 0 ? autoToolLife : 20000;
  const currentQuantity = N_order && N_order > 0 ? N_order : defaultLife;

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-[6px] shadow-sm p-4 mt-3 animate-fade-in-up">
      {/* Top Row: Checkbox option */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={isAmortized}
            onChange={(e) => {
              const newTreatment = e.target.checked ? 'amortized' : 'separate';
              onTreatmentChange(newTreatment);
              if (e.target.checked && (!N_order || N_order <= 0)) {
                onNOrderChange(defaultLife);
              }
            }}
            className="w-4 h-4 text-[#38517A] rounded border-[#CCCCCC] focus:ring-0 cursor-pointer"
          />
          <span className="text-xs font-bold text-[#111111] uppercase tracking-wide group-hover:text-[#38517A] transition-colors">
            Phân bổ chi phí {toolName} vào giá thành sản phẩm (Amortized vào COGS)
          </span>
        </label>

        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[4px] border ${
            isAmortized
              ? 'bg-[#EBF3FB] text-[#24548A] border-[#BFDBFE]'
              : 'bg-[#F9F9F9] text-[#787774] border-[#EAEAEA]'
          }`}
        >
          {isAmortized ? 'Đang phân bổ vào COGS' : 'Tách riêng báo giá (Mặc định)'}
        </span>
      </div>

      {/* Expanded view when Amortized is checked */}
      {isAmortized ? (
        <div className="mt-3 pt-3 border-t border-[#F0F0EE] flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          {/* Left: Input for amortization quantity */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#555555] font-medium">Số lượng SP phân bổ:</span>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                value={currentQuantity}
                onChange={(e) => onNOrderChange(Math.max(1, Number(e.target.value)))}
                className="w-28 px-2.5 py-1.5 border border-[#EAEAEA] rounded-l-[4px] font-mono text-xs font-bold text-[#111111] outline-none focus:border-[#111111] bg-white text-right"
              />
              <span className="bg-[#F7F7F6] px-2.5 py-1.5 border border-l-0 border-[#EAEAEA] rounded-r-[4px] text-[10px] font-bold text-[#787774] uppercase">
                SP
              </span>
            </div>

            {defaultLife > 0 && currentQuantity !== defaultLife && (
              <button
                type="button"
                onClick={() => onNOrderChange(defaultLife)}
                className="text-[10px] text-[#38517A] hover:underline font-semibold ml-1 cursor-pointer"
                title={`Đặt lại bằng tuổi thọ ${toolName}: ${defaultLife.toLocaleString('vi-VN')} SP`}
              >
                (Lấy theo tuổi thọ: {defaultLife.toLocaleString('vi-VN')} SP)
              </button>
            )}
          </div>

          {/* Right: Inline calculation breakdown */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#787774] hidden md:flex items-center gap-1 font-mono">
              <Calculator className="w-3.5 h-3.5 text-[#999999]" />
              <span>{Math.round(totalToolingCost).toLocaleString('vi-VN')} đ</span>
              <span>÷</span>
              <span>{currentQuantity.toLocaleString('vi-VN')} SP</span>
              <span>=</span>
            </div>

            <div className="flex items-baseline gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-[4px] shadow-2xs">
              <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider">Khấu hao:</span>
              <span className="font-mono font-black text-[#38517A] text-[14px]">
                {Math.round(amortizationCostPerUnit).toLocaleString('vi-VN')}
              </span>
              <span className="text-[10px] font-semibold text-[#64748B]">VNĐ/SP</span>
            </div>
          </div>
        </div>
      ) : (
        /* Default / Unchecked: Subtle informational line */
        <div className="mt-2 text-[11px] flex flex-col gap-1.5">
          <div className="text-[#787774] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#999999] flex-shrink-0" />
            <span>
              Toàn bộ chi phí {toolName} ({Math.round(totalToolingCost).toLocaleString('vi-VN')} đ) được tách riêng 1 lần, không cộng dồn vào giá thành từng sản phẩm.
            </span>
          </div>
          {N_order > autoToolLife && autoToolLife > 0 && (
            <div className="text-amber-600 font-medium bg-amber-50 p-1.5 rounded flex items-start gap-1.5 border border-amber-200/50 mt-1">
              <span className="text-[12px] leading-none">⚠️</span>
              <span className="leading-tight">
                Số lượng đặt hàng ({N_order.toLocaleString('vi-VN')}) vượt tuổi thọ {toolName} ({autoToolLife.toLocaleString('vi-VN')}) — cần thu thêm tiền {toolName} lần 2 ngoài phạm vi báo giá này khi đến ngưỡng.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
