import { useQuotationStore } from '../../store/useQuotationStore';
import type { ForgingResult, CastingResult } from '../../lib/calculation-engine/types';
import type { CurrencyType } from '../../types/quote';
import { Calculator, Globe } from 'lucide-react';

export const formatCurrencyValue = (
  amountVnd: number,
  currency: CurrencyType,
  rate: number
): string => {
  const safeRate = Math.max(0.0001, rate || 1);
  const converted = amountVnd / safeRate;

  switch (currency) {
    case 'USD':
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'JPY':
      return `¥${Math.round(converted).toLocaleString('ja-JP')}`;
    case 'VND':
    default:
      return `${Math.round(converted).toLocaleString('vi-VN')} VNĐ`;
  }
};

export const RealtimeSummaryPanel = () => {
  const segment = useQuotationStore((state) => state.segment);
  const rfq = useQuotationStore((state) => state.rfq);
  const currency = useQuotationStore((state) => state.currency);
  const exchangeRate = useQuotationStore((state) => state.exchange_rate);
  const setCurrency = useQuotationStore((state) => state.setCurrency);
  const setExchangeRate = useQuotationStore((state) => state.setExchangeRate);

  const forgingInput = useQuotationStore((state) => state.forgingInput);
  const castingInput = useQuotationStore((state) => state.castingInput);

  const getForgingResult = useQuotationStore((state) => state.getForgingResult);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);

  const isForging = segment === 'forging';

  const forgingRes = isForging ? getForgingResult() : null;
  const castingRes = !isForging ? getCastingResult() : null;

  const C_mat = isForging ? (forgingRes as ForgingResult).C_mat_forging : (castingRes as CastingResult).C_metal_casting;
  const C_ops = isForging ? (forgingRes as ForgingResult).C_ops_forging : (castingRes as CastingResult).C_ops_casting;
  const C_machining = isForging ? (forgingRes as ForgingResult).C_machining : (castingRes as CastingResult).C_machining_casting;
  const C_amortization = isForging ? (forgingRes as ForgingResult).C_die_amortization : (castingRes as CastingResult).C_pattern_amortization;
  const COGS = isForging ? (forgingRes as ForgingResult).COGS : (castingRes as CastingResult).COGS;
  const pre_profit_price = isForging ? (forgingRes as ForgingResult).pre_profit_price : (castingRes as CastingResult).pre_profit_price;
  const finalPriceVnd = isForging ? (forgingRes as ForgingResult).P_FORGING : (castingRes as CastingResult).P_CASTING;

  const profitMarginPercent = isForging ? forgingInput.k_profit_forging : castingInput.k_profit_casting;
  const profitAmountVnd = pre_profit_price * (profitMarginPercent / 100);

  const targetPriceVnd = rfq.target_price || 0;
  const deltaPriceVnd = finalPriceVnd - targetPriceVnd;

  const isSeparateTooling = isForging
    ? forgingInput.die_cost_treatment === 'separate'
    : castingInput.pattern_cost_treatment === 'separate';

  const separateToolingAmountVnd = isForging
    ? forgingInput.C_die_total || 0
    : castingInput.C_pattern_total || 0;

  const currencies: CurrencyType[] = ['VND', 'USD', 'JPY', 'EUR'];

  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-5 space-y-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-[6px] bg-[#111111] text-white flex items-center justify-center">
            <Calculator className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
              Bảng Tổng Hợp Chi Phí Real-time
            </h3>
            <p className="text-[10px] text-[#787774]">
              {isForging ? 'Công Nghệ Rèn Dập (Forging)' : 'Công Nghệ Đúc Gang (Iron Casting)'}
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4] uppercase">
          Live Engine
        </span>
      </div>

      {/* Multi-Currency Selection Toolbar */}
      <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#111111] uppercase tracking-wider flex items-center">
            <Globe className="w-3.5 h-3.5 mr-1 text-[#787774]" />
            Tiền Tệ Báo Giá (Quote Currency)
          </label>
          <div className="inline-flex p-0.5 bg-[#F0F0EE] rounded-[5px] border border-[#EAEAEA]">
            {currencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-[3px] transition-all cursor-pointer ${
                  currency === c
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Exchange Rate Input (When currency != VND) */}
        {currency !== 'VND' && (
          <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#787774]">Tỷ giá quy đổi (1 {currency} = ? VNĐ):</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="0.001"
                step="1"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-24 px-2 py-0.5 border border-[#EAEAEA] bg-white rounded-[4px] font-mono font-bold text-xs text-right text-[#111111] focus:outline-none"
              />
              <span className="text-[10px] font-mono text-[#787774]">VNĐ</span>
            </div>
          </div>
        )}
      </div>

      {/* Target Price vs Quoted Price Side-by-Side Comparison */}
      <div className="p-4 rounded-[10px] bg-[#FBFBFA] border border-[#EAEAEA] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
            So Sánh Song Song Đơn Giá
          </span>
          <span className="text-[10px] font-mono text-[#787774]">{rfq.trade_terms} Terms ({currency})</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#EAEAEA]">
          {/* Box 1: Target Price */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-[#787774]">Target Price (Mục Tiêu)</p>
            <p className="text-base font-extrabold font-mono text-[#111111]">
              {formatCurrencyValue(targetPriceVnd, currency, exchangeRate)}
            </p>
          </div>

          {/* Box 2: Calculated Quoted Price */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-[#787774]">Đơn Giá Báo Giá Tính Toán</p>
            <p className="text-base font-extrabold font-mono text-[#111111]">
              {formatCurrencyValue(finalPriceVnd, currency, exchangeRate)}
            </p>
          </div>
        </div>

        {/* Delta display */}
        <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-mono">
          <span className="text-[11px] text-[#787774]">Chênh Lệch (Quoted - Target):</span>
          <span className={`font-bold ${deltaPriceVnd > 0 ? 'text-[#956400]' : 'text-[#346538]'}`}>
            {deltaPriceVnd > 0 ? '+' : ''}
            {formatCurrencyValue(deltaPriceVnd, currency, exchangeRate)}
          </span>
        </div>
      </div>

      {/* Itemized 5 Sections Breakdown */}
      <div className="space-y-2 text-xs">
        <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider border-b border-[#EAEAEA] pb-1">
          Chi Tiết 5 Section Cấu Thành Chi Phí ({currency})
        </h4>

        <div className="space-y-1.5 font-mono">
          {/* Section 1 */}
          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">1. Chi phí vật liệu (C_mat):</span>
            <span className="font-bold text-[#111111]">
              {formatCurrencyValue(C_mat, currency, exchangeRate)}
            </span>
          </div>

          {/* Section 2 */}
          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">2. Công nghệ & Nhiệt luyện/Đúc (C_ops):</span>
            <span className="font-bold text-[#111111]">
              {formatCurrencyValue(C_ops, currency, exchangeRate)}
            </span>
          </div>

          {/* Section 3 */}
          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">3. Gia công cơ khí CNC (C_machining):</span>
            <span className="font-bold text-[#111111]">
              {formatCurrencyValue(C_machining, currency, exchangeRate)}
            </span>
          </div>

          {/* Section 4 */}
          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">
              4. Khấu hao {isForging ? 'Khuôn' : 'Mẫu'} (C_amortization):
            </span>
            <span className="font-bold text-[#111111]">
              {formatCurrencyValue(C_amortization, currency, exchangeRate)}
            </span>
          </div>

          {/* COGS */}
          <div className="flex justify-between items-center py-1.5 bg-[#FBFBFA] px-2 rounded-[4px] font-bold">
            <span className="text-[#111111] font-sans">➜ Tổng Giá Vốn COGS:</span>
            <span className="text-[#111111]">
              {formatCurrencyValue(COGS, currency, exchangeRate)}
            </span>
          </div>

          {/* Section 5 Costs & Profit */}
          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">5. Chi phí trước lợi nhuận (C_pre_profit):</span>
            <span className="font-bold text-[#111111]">
              {formatCurrencyValue(pre_profit_price, currency, exchangeRate)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
            <span className="text-[#2F3437] font-sans">Lợi nhuận mục tiêu (Profit {profitMarginPercent}%):</span>
            <span className="font-bold text-[#346538]">
              +{formatCurrencyValue(profitAmountVnd, currency, exchangeRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Dòng Chi Phí Khuôn / Mẫu Tách Riêng (Nếu chọn chế độ 'separate') */}
      {isSeparateTooling && (
        <div className="p-3 rounded-[8px] bg-[#FDEBEC] border border-[#FADBDC] space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-[#9F2F2D]">
            <span>Chi Phí {isForging ? 'Bộ Khuôn' : 'Bộ Mẫu'} (Tính Riêng):</span>
            <span className="font-mono">{formatCurrencyValue(separateToolingAmountVnd, currency, exchangeRate)}</span>
          </div>
          <p className="text-[10px] text-[#9F2F2D]/80">
            * Khoản chi phí {isForging ? 'khuôn' : 'mẫu'} này không phân bổ vào giá vốn sản phẩm, khách hàng thanh toán riêng theo hợp đồng làm {isForging ? 'khuôn' : 'mẫu'}.
          </p>
        </div>
      )}

      {/* Final Quoted Unit Price Highlights */}
      <div className="p-4 rounded-[10px] bg-[#111111] text-white space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
          <span>Đơn Giá Báo Giá Cuối Cùng ({currency})</span>
          <span>{rfq.product_name || 'SP'}</span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <p className="text-2xl font-extrabold font-mono">
            {formatCurrencyValue(finalPriceVnd, currency, exchangeRate)}
          </p>
          <span className="text-xs font-semibold text-slate-300">/ Chi tiết</span>
        </div>

        {currency !== 'VND' && (
          <p className="text-[10px] text-slate-400 font-mono pt-0.5">
            (Tương đương {Math.round(finalPriceVnd).toLocaleString('vi-VN')} VNĐ với tỷ giá 1 {currency} = {exchangeRate.toLocaleString('vi-VN')} VNĐ)
          </p>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Sản lượng: {(rfq.annual_volume || 0).toLocaleString('vi-VN')} Pcs/năm</span>
          <span>Doanh số: {formatCurrencyValue((rfq.annual_volume || 0) * finalPriceVnd, currency, exchangeRate)}</span>
        </div>
      </div>
    </div>
  );
};
