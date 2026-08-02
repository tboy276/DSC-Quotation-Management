import { useState } from 'react';
import type { QuoteRecord, CurrencyType } from '../../types/quote';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from '../../lib/calculation-engine/types';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { formatCurrencyValue } from './RealtimeSummaryPanel';
import { FileText, X, Layers, ListFilter } from 'lucide-react';

interface QuoteDetailModalProps {
  quote: QuoteRecord | null;
  onClose: () => void;
}

export const QuoteDetailModal = ({ quote, onClose }: QuoteDetailModalProps) => {
  if (!quote) return null;

  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'breakdown'>('summary');

  const isForging = quote.segment === 'forging';
  const rfq = quote.rfq;

  // Snapshot Isolation Enforcement: Read directly from frozen JSON snapshots for SENT/SUCCESSFUL/CANCELLED
  const statusStr = (rfq?.status || quote.status) as string;
  const isSnapshotFrozen = statusStr === 'SENT' || statusStr === 'SUCCESSFUL' || statusStr === 'CANCELLED' || statusStr === 'APPROVED' || statusStr === 'REJECTED';

  const res = quote.results_json as any;
  const inp = quote.inputs_json as any;

  const currency: CurrencyType = quote.currency || 'VND';
  const exchangeRate = quote.exchange_rate || 1;

  const C_mat = isForging ? res.C_mat_forging : res.C_metal_casting;
  const C_ops = isForging ? res.C_ops_forging : res.C_ops_casting;
  const C_machining = isForging ? res.C_machining : res.C_machining_casting;
  const C_amortization = isForging ? res.C_die_amortization : res.C_pattern_amortization;
  const COGS = res.COGS;
  const pre_profit_price = res.pre_profit_price;
  const finalPriceVnd = quote.final_quoted_price || (isForging ? res.P_FORGING : res.P_CASTING);

  // Render 5 Sections Breakdown Table for "Chi Tiết Bóc Tách" tab
  const renderBreakdownTable = () => {
    const breakdownRows: { section: string; rows: { name: string; val: string | number }[] }[] = [];

    if (isForging) {
      const fInp = inp as ForgingInput;
      const fRes = res as ForgingResult;
      breakdownRows.push({
        section: 'SECTION 1 — CHI PHÍ VẬT LIỆU (FORGING STEEL MATERIAL)',
        rows: [
          { name: 'Trọng lượng tinh m_tinh (kg/cái)', val: `${fInp.m_tinh || 0} kg` },
          { name: 'Trọng lượng bavia m_bavia (kg/cái)', val: `${fInp.m_bavia || 0} kg` },
          { name: 'Tỷ lệ tổn thất phôi k_loss (%)', val: `${fInp.k_loss || 0}%` },
          { name: 'Trọng lượng phôi rèn m_phoi (kg/cái)', val: `${fRes?.m_phoi || 0} kg` },
          { name: 'Đơn giá thép mua vào DG_steel (VNĐ/kg)', val: `${fInp.DG_steel?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Đơn giá phế liệu thu hồi DG_scrap (VNĐ/kg)', val: `${fInp.DG_scrap?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Chi phí vật liệu tinh C_mat_forging (VNĐ/cái)', val: formatCurrencyValue(fRes?.C_mat_forging || 0, currency, exchangeRate) },
        ],
      });

      breakdownRows.push({
        section: 'SECTION 2 — CÔNG NGHỆ RÈN & NHIỆT LUYỆN (FORGING PROCESS)',
        rows: [
          { name: 'Thời gian cắt phôi t_cut (giây/cái)', val: `${fInp.t_cut_sec || 0}s` },
          { name: 'Cước máy cưa đĩa DG_sawing (VNĐ/giờ)', val: `${fInp.DG_sawing_machine_hour?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Tiêu hao điện rèn w_elec (kWh/kg)', val: `${fInp.w_elec_kwh_per_kg || 0} kWh/kg` },
          { name: 'Đơn giá điện công nghiệp DG_elec (VNĐ/kWh)', val: `${fInp.DG_elec_kwh?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Thời gian dập nóng t_forging (giây/cái)', val: `${fInp.t_forging_sec || 0}s` },
          { name: 'Cước máy dập/búa DG_machine (VNĐ/giờ)', val: `${fInp.DG_forging_machine_hour?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Chi phí công nghệ rèn C_ops_forging (VNĐ/cái)', val: formatCurrencyValue(fRes?.C_ops_forging || 0, currency, exchangeRate) },
        ],
      });
    } else {
      const cInp = inp as CastingInput;
      const cRes = res as CastingResult;
      breakdownRows.push({
        section: 'SECTION 1 — CHI PHÍ NẤU ĐÚC KIM LOẠI (CASTING METAL COST)',
        rows: [
          { name: 'Trọng lượng vật đúc m_cast (kg/cái)', val: `${cInp.m_cast || 0} kg` },
          { name: 'Tỷ lệ thu hồi kim loại Y_yield (%)', val: `${cInp.Y_yield || 0}%` },
          { name: 'Tổng kim loại lỏng m_liquid (kg/cái)', val: `${cRes?.m_liquid || 0} kg` },
          { name: 'Đơn giá nước gang lỏng DG_liquid (VNĐ/kg)', val: `${cInp.DG_liquid?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Đơn giá hồi liệu đúc DG_cast_scrap (VNĐ/kg)', val: `${cInp.DG_cast_scrap?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Chi phí vật liệu đúc C_metal_casting (VNĐ/cái)', val: formatCurrencyValue(cRes?.C_metal_casting || 0, currency, exchangeRate) },
        ],
      });

      breakdownRows.push({
        section: 'SECTION 2 — CÔNG NGHỆ TẠO KHUÔN & TẠO RUỘT (SINTO & CORE)',
        rows: [
          { name: 'Cước tạo khuôn Sinto DG_sinto (VNĐ/khuôn)', val: `${cInp.DG_sinto_op?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Số lòng khuôn n_cavity (chi tiết/khuôn)', val: `${cInp.n_cavity_per_mold || 1} chi tiết` },
          { name: 'Trọng lượng ruột cát m_core (kg/cái)', val: `${cInp.m_core || 0} kg` },
          { name: 'Đơn giá cát ruột & keo DG_core_sand (VNĐ/kg)', val: `${cInp.DG_core_sand_kg?.toLocaleString('vi-VN')} VNĐ` },
          { name: 'Chi phí công nghệ đúc C_ops_casting (VNĐ/cái)', val: formatCurrencyValue(cRes?.C_ops_casting || 0, currency, exchangeRate) },
        ],
      });
    }

    // Section 3: CNC Machining Ops
    const ops = inp.machining_operations || [];
    breakdownRows.push({
      section: 'SECTION 3 — CHI TIẾT GIA CÔNG CƠ KHÍ CNC (MACHINING OPERATIONS)',
      rows: [
        { name: 'Số lượng công đoạn CNC:', val: `${ops.length} công đoạn` },
        ...ops.map((op: any, i: number) => ({
          name: `CD ${i + 1}: ${op.name}`,
          val: `t_prep=${op.t_prep_min}m | t_man=${op.t_man_min}m | Cước=${op.DG_machine_hour?.toLocaleString('vi-VN')}đ/h | Tool=${op.C_tooling}đ`,
        })),
        { name: 'Tổng chi phí gia công CNC (VNĐ/cái)', val: formatCurrencyValue(C_machining || 0, currency, exchangeRate) },
      ],
    });

    // Section 4: Tooling Amortization
    breakdownRows.push({
      section: 'SECTION 4 — KHẤU HAO KHUÔN / MẪU (TOOLING AMORTIZATION)',
      rows: [
        { name: 'Cơ chế tiền khuôn:', val: quote.die_cost_treatment || 'amortized' },
        { name: 'Tổng giá trị bộ khuôn/mẫu (VNĐ)', val: `${(inp.C_die_total || inp.C_pattern_total || 0).toLocaleString('vi-VN')} VNĐ` },
        { name: 'Tuổi thọ bộ khuôn/mẫu (chi tiết/bộ)', val: `${(inp.L_die_life || inp.L_pattern_life || 0).toLocaleString('vi-VN')} chi tiết` },
        { name: 'Chi phí khấu hao khuôn C_amortization (VNĐ/cái)', val: formatCurrencyValue(C_amortization || 0, currency, exchangeRate) },
      ],
    });

    // Section 5: Profit & Final Quoted Price
    breakdownRows.push({
      section: 'SECTION 5 — GIÁ VỐN & ĐƠN GIÁ BÁO GIÁ CUỐI CÙNG',
      rows: [
        { name: 'Tổng Giá Vốn COGS (VNĐ/cái)', val: formatCurrencyValue(COGS || 0, currency, exchangeRate) },
        { name: 'Tỷ lệ chi phí quản lý k_mgmt (%)', val: `${inp.k_mgmt || inp.k_mgmt_cast || 0}%` },
        { name: 'Chi phí trước lợi nhuận pre_profit_price (VNĐ/cái)', val: formatCurrencyValue(pre_profit_price || 0, currency, exchangeRate) },
        { name: 'Tỷ lệ lợi nhuận mục tiêu k_profit (%)', val: `${inp.k_profit_forging || inp.k_profit_casting || 0}%` },
        { name: 'ĐƠN GIÁ BÁO GIÁ CUỐI CÙNG', val: formatCurrencyValue(finalPriceVnd || 0, currency, exchangeRate) },
      ],
    });

    return (
      <div className="space-y-4">
        {breakdownRows.map((sec, sIdx) => (
          <div key={sIdx} className="border border-[#EAEAEA] rounded-[8px] overflow-hidden">
            <div className="bg-[#FBFBFA] px-3 py-1.5 border-b border-[#EAEAEA]">
              <h5 className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">
                {sec.section}
              </h5>
            </div>
            <table className="w-full text-xs font-mono border-collapse">
              <tbody className="divide-y divide-[#F0F0EE]">
                {sec.rows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FBFBFA]">
                    <td className="py-1.5 px-3 text-[#2F3437] font-sans w-2/3">{r.name}</td>
                    <td className="py-1.5 px-3 font-bold text-[#111111] text-right">{r.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-up">
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 text-xs text-[#111111]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#111111] text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#111111]">
                  Chi Tiết Báo Giá #{quote.id.substring(0, 10)} ({currency})
                </h3>
                <QuoteStatusBadge status={rfq?.status || quote.status} size="sm" />
              </div>
              <p className="text-[10px] text-[#787774]">
                {isSnapshotFrozen ? (
                  <span className="text-[#346538] font-bold">
                    ✓ Snapshot Đóng Băng (Dữ liệu cố định tại thời điểm gửi, không bị đổi theo Master Data)
                  </span>
                ) : (
                  <span className="text-[#956400]">⚡ Bản nháp DRAFT (Đang tính toán Real-time)</span>
                )}
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation Header */}
          <div className="flex items-center space-x-1 bg-[#F0F0EE] p-1 rounded-[6px] border border-[#EAEAEA]">
            <button
              onClick={() => setActiveSubTab('summary')}
              className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
                activeSubTab === 'summary'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1" />
              <span>Tổng Quan</span>
            </button>
            <button
              onClick={() => setActiveSubTab('breakdown')}
              className={`px-3 py-1 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
                activeSubTab === 'breakdown'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 inline mr-1" />
              <span>Chi Tiết Bóc Tách (5 Section)</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#787774] hover:text-[#111111] p-1 rounded-md cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Thông Tin RFQ */}
        <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
              Thông Tin RFQ Khách Hàng
            </h4>
            <span className="text-[11px] font-mono font-bold text-[#111111] bg-white px-2 py-0.5 border border-[#EAEAEA] rounded">
              Tiền tệ: {currency} {currency !== 'VND' && `(Tỷ giá: 1 ${currency} = ${exchangeRate.toLocaleString('vi-VN')} VNĐ)`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#787774]">Khách hàng:</span>{' '}
              <strong className="text-[#111111]">{rfq?.customer_name || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[#787774]">Sản phẩm:</span>{' '}
              <strong className="text-[#111111]">{rfq?.product_name || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[#787774]">Sản lượng dự kiến:</span>{' '}
              <strong className="font-mono text-[#111111]">{(rfq?.annual_volume || 0).toLocaleString('vi-VN')} Pcs/năm</strong>
            </div>
            <div>
              <span className="text-[#787774]">Trade Terms / Target Price:</span>{' '}
              <strong className="font-mono text-[#111111]">
                {rfq?.trade_terms} | {formatCurrencyValue(rfq?.target_price || 0, currency, exchangeRate)}
              </strong>
            </div>
            <div className="col-span-2 border-t border-[#EAEAEA] pt-1 mt-1 text-[11px]">
              <span className="text-[#787774]">Người tạo RFQ:</span>{' '}
              <strong className="text-[#111111] font-mono">{rfq?.created_by_email || quote.created_by_email || 'N/A'}</strong>
            </div>
            {(rfq?.cancel_reason || quote.cancel_reason) && (
              <div className="col-span-2 p-2 bg-[#FDEBEC] border border-[#FADBDC] rounded text-[#9F2F2D] font-mono font-semibold text-[11px]">
                💬 Lý do huỷ bỏ: "{rfq?.cancel_reason || quote.cancel_reason}"
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Tổng Quan Snapshot */}
        {activeSubTab === 'summary' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider border-b border-[#EAEAEA] pb-1">
                Tóm Tắt 5 Section Chi Phí ({isForging ? 'Công Nghệ Rèn Dập' : 'Công Nghệ Đúc Gang'}) ({currency})
              </h4>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
                  <span className="text-[#787774] font-sans">Section 1 — Chi phí vật liệu:</span>
                  <span className="font-bold text-[#111111]">{formatCurrencyValue(C_mat || 0, currency, exchangeRate)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
                  <span className="text-[#787774] font-sans">Section 2 — Chi phí công nghệ & nhiệt luyện/đúc:</span>
                  <span className="font-bold text-[#111111]">{formatCurrencyValue(C_ops || 0, currency, exchangeRate)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
                  <span className="text-[#787774] font-sans">Section 3 — Chi phí gia công CNC ({inp.machining_operations?.length || 0} công đoạn):</span>
                  <span className="font-bold text-[#111111]">{formatCurrencyValue(C_machining || 0, currency, exchangeRate)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
                  <span className="text-[#787774] font-sans">
                    Section 4 — Khấu hao {isForging ? 'Khuôn' : 'Mẫu'} ({quote.die_cost_treatment}):
                  </span>
                  <span className="font-bold text-[#111111]">{formatCurrencyValue(C_amortization || 0, currency, exchangeRate)}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 bg-[#FBFBFA] px-2 rounded font-bold">
                  <span className="text-[#111111] font-sans">➜ Tổng Giá Vốn COGS:</span>
                  <span className="text-[#111111]">{formatCurrencyValue(COGS || 0, currency, exchangeRate)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#F0F0EE]">
                  <span className="text-[#787774] font-sans">Section 5 — Giá trước lợi nhuận:</span>
                  <span className="font-bold text-[#111111]">{formatCurrencyValue(pre_profit_price || 0, currency, exchangeRate)}</span>
                </div>
              </div>
            </div>

            {/* Khối Nổi Bật Đơn Giá Cuối Cùng */}
            <div className="bg-[#111111] text-white p-4 rounded-[10px] space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-semibold">
                <span>Đơn Giá Báo Giá ({currency})</span>
                <span>Ngày tạo: {new Date(quote.created_at).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <p className="text-2xl font-extrabold font-mono">{formatCurrencyValue(finalPriceVnd || 0, currency, exchangeRate)}</p>
                <span className="text-xs text-slate-300 font-semibold">/ Chi tiết</span>
              </div>

              {currency !== 'VND' && (
                <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                  (Gốc VNĐ: {Math.round(finalPriceVnd || 0).toLocaleString('vi-VN')} VNĐ | Tỷ giá: 1 {currency} = {exchangeRate.toLocaleString('vi-VN')} VNĐ)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Chi Tiết Bóc Tách (In-App Breakdown Table) */}
        {activeSubTab === 'breakdown' && renderBreakdownTable()}

        <div className="flex justify-end pt-2 border-t border-[#EAEAEA]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] cursor-pointer text-xs"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
