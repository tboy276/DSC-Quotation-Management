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
    <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-3 space-y-1.5 shadow-2xs hover:border-[#111111] transition-all">
      {/* Top row: Label & Number Stepper */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">
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
            className="w-20 px-2 py-0.5 border border-[#EAEAEA] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] bg-white outline-none focus:border-[#111111]"
          />
          <span className="text-[10px] font-bold text-[#787774] min-w-[32px] uppercase">
            {unit}
          </span>
        </div>
      </div>

      {/* Middle row: Slider */}
      <div className="relative flex items-center py-0.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#EAEAEA] rounded-lg appearance-none cursor-pointer accent-[#111111]"
        />
      </div>

      {/* Bottom row: Subtitle description */}
      <p className="text-[11px] text-[#787774] italic">
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

  quoted_moq?: number;
  onMoqChange?: (val: number) => void;
  DG_heat_treat_per_kg?: number;
  onDGHeatTreatChange?: (val: number) => void;
  DG_paint_per_kg?: number;
  onDGPaintChange?: (val: number) => void;

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
  quoted_moq,
  onMoqChange,
  DG_heat_treat_per_kg,
  onDGHeatTreatChange,
  DG_paint_per_kg,
  onDGPaintChange,
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
      <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-2.5">
        <PlusCircle className="w-4 h-4 text-[#111111] stroke-[2]" />
        <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
          SECTION 5: TỔNG HỢP & BÁO GIÁ CUỐI CÙNG
        </h2>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Sliders & Inputs */}
        <div className="lg:col-span-5 space-y-2.5">
          {/* MOQ Báo Giá */}
          {onMoqChange && (
            <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-3 shadow-2xs hover:border-[#111111] transition-all flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">
                MOQ BÁO GIÁ (CÁI/LÔ)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={quoted_moq || ''}
                  placeholder="-"
                  onChange={(e) => onMoqChange(Math.max(0, Number(e.target.value)))}
                  className="w-24 px-2 py-1 border border-[#EAEAEA] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] bg-white outline-none focus:border-[#111111]"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#787774] italic -mt-1 pl-1">
              * MOQ báo giá cho khách — không dùng để tính khấu hao mẫu, xem N_order ở mục Khấu hao mẫu
            </p>
          </div>
          )}
          
          {/* Xử Lý Nhiệt & Sơn */}
          {(onDGHeatTreatChange || onDGPaintChange) && (
            <div className="grid grid-cols-2 gap-2">
              {onDGHeatTreatChange && (
                <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-3 shadow-2xs hover:border-[#111111] transition-all space-y-2">
                  <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider block">
                    ĐƠN GIÁ NHIỆT LUYỆN
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={DG_heat_treat_per_kg || ''}
                      placeholder="0"
                      onChange={(e) => onDGHeatTreatChange(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] bg-white outline-none focus:border-[#111111]"
                    />
                    <span className="text-[9px] font-bold text-[#787774]">VNĐ/KG</span>
                  </div>
                </div>
              )}
              {onDGPaintChange && (
                <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-3 shadow-2xs hover:border-[#111111] transition-all space-y-2">
                  <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider block">
                    ĐƠN GIÁ SƠN
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={DG_paint_per_kg || ''}
                      placeholder="0"
                      onChange={(e) => onDGPaintChange(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] bg-white outline-none focus:border-[#111111]"
                    />
                    <span className="text-[9px] font-bold text-[#787774]">VNĐ/KG</span>
                  </div>
                </div>
              )}
            </div>
          )}

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
          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-4 space-y-3.5 shadow-xs">
            {/* Title */}
            <h3 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider border-b border-[#EAEAEA] pb-2">
              TỔNG HỢP CHI PHÍ (CHO 1 SẢN PHẨM)
            </h3>

            {/* Breakdown Items List */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#787774] font-sans">I. Giá Vốn (COGS):</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(COGS).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#787774] font-sans">II. Chi Phí Quản Lý Công Ty:</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(C_mgmt).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#787774] font-sans">III. Phí Vận Chuyển:</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(C_trans).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#EAEAEA]">
                <span className="text-[#787774] font-sans">IV. Phí Bao Gói:</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(C_pack).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Subtotals */}
            <div className="pt-2 border-t border-[#EAEAEA] space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#787774] font-sans font-bold uppercase">
                  TỔNG GIÁ THÀNH TRƯỚC LỢI NHUẬN:
                </span>
                <span className="font-bold text-[#111111]">
                  {Math.round(pre_profit_price).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#787774] font-sans font-bold uppercase">
                  LỢI NHUẬN MỤC TIÊU:
                </span>
                <span className="font-bold text-[#346538]">
                  +{Math.round(profit_amount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Unified Signature Dark Obsidian Grand Total Hero Card */}
            <div className="bg-[#111111] text-white rounded-[6px] p-3.5 flex items-center justify-between shadow-xs border border-[#111111]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  TỔNG GIÁ BÁO (DỰ KIẾN)
                </p>
                <p className="font-mono font-extrabold text-2xl text-emerald-400 leading-none">
                  {Math.round(final_price).toLocaleString('vi-VN')}
                </p>
              </div>
              <span className="font-mono font-bold text-xs text-white uppercase">
                VNĐ / Chi tiết
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
