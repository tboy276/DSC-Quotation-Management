import React from 'react';
import { PlusCircle } from 'lucide-react';

interface SliderCardProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  description: string;
}

const SliderCard: React.FC<SliderCardProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  description,
}) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-3.5 space-y-2 shadow-2xs hover:border-[#D1D5DB] transition-all">
      {/* Top row: Label & Number Stepper */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-[#D1D5DB] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] bg-white outline-none focus:border-[#0F766E]"
          />
          <span className="text-[11px] font-medium text-[#64748B] min-w-[32px]">
            {unit}
          </span>
        </div>
      </div>

      {/* Middle row: Slider */}
      <div className="relative flex items-center py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
        />
      </div>

      {/* Bottom row: Subtitle description */}
      <p className="text-[11px] text-[#64748B]">
        {description}
      </p>
    </div>
  );
};

interface Section5SummaryCardProps {
  isForging: boolean;
  // Slider values & setters
  k_mgmt: number;
  onKMgmtChange: (val: number) => void;
  DG_trans_kg: number;
  onDGTransChange: (val: number) => void;
  DG_pack_kg: number;
  onDGPackChange: (val: number) => void;
  k_profit: number;
  onKProfitChange: (val: number) => void;

  // Breakdown values
  COGS: number;
  C_mgmt: number;
  C_trans: number;
  C_pack: number;
  pre_profit_price: number;
  profit_amount: number;
  final_price: number;
}

export const Section5SummaryCard: React.FC<Section5SummaryCardProps> = ({
  k_mgmt,
  onKMgmtChange,
  DG_trans_kg,
  onDGTransChange,
  DG_pack_kg,
  onDGPackChange,
  k_profit,
  onKProfitChange,
  COGS,
  C_mgmt,
  C_trans,
  C_pack,
  pre_profit_price,
  profit_amount,
  final_price,
}) => {
  return (
    <div className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-[#111111] stroke-[2]" />
        <h2 className="text-[15px] font-bold text-[#111111] uppercase tracking-wide">
          SECTION 5: TỔNG HỢP & BÁO GIÁ CUỐI CÙNG
        </h2>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 4 Slider Cards */}
        <div className="lg:col-span-5 space-y-3">
          {/* 1. Chi phí quản lý chung */}
          <SliderCard
            label="CHI PHÍ QUẢN LÝ CHUNG"
            value={k_mgmt}
            onChange={onKMgmtChange}
            min={0}
            max={30}
            step={0.5}
            unit="%"
            description="Phân bổ chi phí quản lý chung công ty"
          />

          {/* 2. Chi phí vận chuyển */}
          <SliderCard
            label="CHI PHÍ VẬN CHUYỂN"
            value={DG_trans_kg}
            onChange={onDGTransChange}
            min={0}
            max={10000}
            step={100}
            unit="VNĐ/kg"
            description="Tính theo khối lượng sản phẩm"
          />

          {/* 3. Chi phí bao gói */}
          <SliderCard
            label="CHI PHÍ BAO GÓI"
            value={DG_pack_kg}
            onChange={onDGPackChange}
            min={0}
            max={5000}
            step={100}
            unit="VNĐ/kg"
            description="Tính theo khối lượng sản phẩm"
          />

          {/* 4. Lợi nhuận */}
          <SliderCard
            label="LỢI NHUẬN"
            value={k_profit}
            onChange={onKProfitChange}
            min={0}
            max={50}
            step={1}
            unit="%"
            description="Tỷ lệ lợi nhuận mục tiêu"
          />
        </div>

        {/* Right Column: Tổng hợp chi phí Card */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 shadow-sm flex flex-col justify-between">
            {/* Title */}
            <h3 className="text-[14px] font-bold text-[#1E293B] uppercase tracking-wide mb-4">
              TỔNG HỢP CHI PHÍ (CHO 1 SẢN PHẨM)
            </h3>

            {/* Breakdown Items List */}
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#334155]">I. Giá Vốn (COGS):</span>
                <span className="font-mono font-bold text-[#1E293B]">
                  {Math.round(COGS).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#334155]">II. Chi Phí Quản Lý Công Ty:</span>
                <span className="font-mono font-bold text-[#1E293B]">
                  {Math.round(C_mgmt).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#334155]">III. Phí Vận Chuyển:</span>
                <span className="font-mono font-bold text-[#1E293B]">
                  {Math.round(C_trans).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                <span className="text-[#334155]">IV. Phí Bao Gói:</span>
                <span className="font-mono font-bold text-[#1E293B]">
                  {Math.round(C_pack).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Subtotals */}
            <div className="pt-4 mt-2 border-t border-[#E2E8F0] space-y-2 text-[13px]">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[#1E293B] uppercase tracking-wide">
                  TỔNG GIÁ THÀNH TRƯỚC LỢI NHUẬN:
                </span>
                <span className="font-mono text-[#1E293B]">
                  {Math.round(pre_profit_price).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between font-bold">
                <span className="text-[#1E293B] uppercase tracking-wide">
                  LỢI NHUẬN MỤC TIÊU:
                </span>
                <span className="font-mono text-[#1D4ED8]">
                  {Math.round(profit_amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Big Hero Total Box */}
            <div className="bg-[#72F1D1] rounded-[8px] p-4 mt-5 flex items-center justify-between shadow-2xs">
              <div>
                <p className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider mb-0.5">
                  TỔNG GIÁ BÁO (DỰ KIẾN)
                </p>
                <p className="font-mono font-extrabold text-[28px] text-[#042F2E] leading-tight tracking-tight">
                  {Math.round(final_price).toLocaleString('vi-VN')}
                </p>
              </div>
              <span className="font-sans font-extrabold text-[17px] text-[#0F766E]">
                VNĐ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
