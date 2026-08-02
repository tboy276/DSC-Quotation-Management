import type { QuotationDocument } from '../../types/quotation-document';
import type { CurrencyType } from '../../types/quote';
import { DISOCO_COMPANY_CONFIG } from '../../config/company-config';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { Printer, X } from 'lucide-react';

interface PdfQuotationModalProps {
  document: QuotationDocument | null;
  onClose: () => void;
}

export const PdfQuotationModal = ({ document, onClose }: PdfQuotationModalProps) => {
  if (!document || !document.items) return null;

  const items = [...document.items].sort((a, b) => a.display_order - b.display_order);
  const currency: CurrencyType = document.currency || 'VND';
  const exchangeRate = document.exchange_rate || 1;

  // Check if document mixes Forging & Casting
  const hasForging = items.some((it) => it.quote?.segment === 'forging');
  const hasCasting = items.some((it) => it.quote?.segment === 'casting');
  const isMixed = hasForging && hasCasting;

  // Tier 1 group header title
  const formingCostHeader = isMixed
    ? 'Chi phí tạo phôi/Forming Cost'
    : hasForging
    ? 'Rèn phôi/Forging Cost'
    : 'Đúc phôi/Casting Cost';

  // Format date in English (e.g. "Tuesday, July 28, 2026")
  const formattedDate = new Date(document.quotation_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in-up">
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-[#EAEAEA] bg-[#FBFBFA]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#111111] text-sm">
              Xem Trước Thư Báo Giá DISOCO (PDF Quotation Preview)
            </span>
            <span className="text-xs text-[#787774] font-mono">#{document.id.substring(0, 8)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>In / Tải PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#787774] hover:text-[#111111] p-1.5 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PDF Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-6 text-[#111111] font-sans text-xs bg-white print:p-0 print:overflow-visible" id="printable-quotation">
          {/* Header Block: Logo, Company Info & Date */}
          <div className="grid grid-cols-12 gap-4 items-start border-b border-gray-300 pb-4">
            {/* Left: Logo Placeholder */}
            <div className="col-span-3">
              <div className="w-36 h-14 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-center p-1">
                <span className="font-extrabold text-slate-900 tracking-wider text-sm">DISOCO</span>
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Songcong Diesel</span>
              </div>
            </div>

            {/* Center: Company Details */}
            <div className="col-span-6 text-center space-y-0.5">
              <h1 className="font-extrabold text-sm uppercase tracking-wide text-[#111111]">
                {DISOCO_COMPANY_CONFIG.name}
              </h1>
              <p className="text-[10px] text-gray-700 leading-tight">
                {DISOCO_COMPANY_CONFIG.address}
              </p>
              <p className="text-[10px] text-gray-700 font-mono">
                Tax code: {DISOCO_COMPANY_CONFIG.taxCode}
              </p>
              <p className="text-[10px] text-gray-700">
                Tel: {DISOCO_COMPANY_CONFIG.tel} &nbsp;|&nbsp; Fax: {DISOCO_COMPANY_CONFIG.fax}
              </p>
            </div>

            {/* Right: Date */}
            <div className="col-span-3 text-right">
              <p className="text-[11px] font-medium text-gray-700 font-serif italic">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Title Block */}
          <div className="text-center py-2">
            <h2 className="text-xl font-black uppercase tracking-widest text-[#111111]">
              QUOTATION
            </h2>
          </div>

          {/* Customer Info Block */}
          <div className="space-y-1 text-xs">
            <p>
              <strong className="uppercase underline">To : {document.customer_name}</strong>
            </p>
            <p className="italic text-gray-800">
              Attn: {document.contact_person || 'Purchasing Department'} &lt;{document.contact_email || 'N/A'}&gt;
            </p>
            <p className="pt-1 font-medium text-gray-900">
              DISOCO would like to send you our Quotation for goods as below:
            </p>
          </div>

          {/* Main 2-Tier Header Cost Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[10px] text-left">
              <thead>
                <tr className="bg-gray-100 text-center font-bold border-b border-black">
                  <th rowSpan={2} className="border border-black p-1.5 w-7">TT<br/>No.</th>
                  <th rowSpan={2} className="border border-black p-1.5 min-w-[100px]">Tên<br/>Part Name</th>
                  <th rowSpan={2} className="border border-black p-1.5 min-w-[80px]">Kí hiệu<br/>Part Number</th>
                  <th rowSpan={2} className="border border-black p-1.5 w-14">Mác VL<br/>Material</th>
                  <th rowSpan={2} className="border border-black p-1.5 w-16">Trọng lượng phôi<br/>Weight (Kg)</th>
                  <th rowSpan={2} className="border border-black p-1.5 w-14">MOQ<br/>(pcs/lot)</th>
                  <th colSpan={5} className="border border-black p-1.5 bg-gray-200">
                    Tập hợp chi phí / Cost ({currency}/cái)
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-20 font-extrabold bg-gray-200">
                    Đơn giá<br/>Unit Price<br/>({currency})
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-20">
                    Tiền khuôn<br/>Tooling price<br/>({currency}/Bộ)
                  </th>
                  <th rowSpan={2} className="border border-black p-1.5 w-16">
                    Tuổi thọ khuôn<br/>Tooling usage<br/>(Cái/bộ)
                  </th>
                </tr>
                <tr className="bg-gray-50 text-center font-semibold text-[9px]">
                  <th className="border border-black p-1">{formingCostHeader}</th>
                  <th className="border border-black p-1">Gia công<br/>Machining</th>
                  <th className="border border-black p-1">Bao gói<br/>Package</th>
                  <th className="border border-black p-1">Vận chuyển<br/>Delivery</th>
                  <th className="border border-black p-1">Quản lý&lợi nhuận<br/>S.G.A&P</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const q = item.quote;
                  if (!q) return null;

                  const rfq = q.rfq;
                  const isForging = q.segment === 'forging';
                  const inp = q.inputs_json as any;
                  const res = q.results_json as any;

                  // 1. Weight
                  const weightKg = isForging ? res.m_phoi || inp.m_tinh : inp.m_cast;

                  // 2. Cost Components (converted if currency != VND)
                  const formingCostVnd = isForging
                    ? (res.C_mat_forging || 0) + (res.C_ops_forging || 0)
                    : (res.C_metal_casting || 0) + (res.C_ops_casting || 0);

                  const machiningCostVnd = isForging
                    ? res.C_machining || 0
                    : res.C_machining_casting || 0;

                  const packageCostVnd = inp.C_pack || 0;
                  const deliveryCostVnd = (weightKg || 0) * (inp.DG_trans_kg || 0);

                  const unitPriceVnd = q.final_quoted_price || (isForging ? res.P_FORGING : res.P_CASTING);

                  // S.G.A & P = Unit Price - sum of other 4 costs
                  const sgaAndPVnd = unitPriceVnd - (formingCostVnd + machiningCostVnd + packageCostVnd + deliveryCostVnd);

                  // Tooling
                  const isSeparateTooling = q.die_cost_treatment === 'separate';
                  const toolingPriceVnd = isForging ? inp.C_die_total : inp.C_pattern_total;
                  const toolingLife = isForging ? inp.L_die_life : inp.L_pattern_life;

                  return (
                    <tr key={item.id} className="border-b border-black text-center">
                      <td className="border border-black p-1.5 font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 font-bold text-left">{rfq?.product_name}</td>
                      <td className="border border-black p-1.5 font-mono text-left">{rfq?.product_name}</td>
                      <td className="border border-black p-1.5 font-mono">{inp.selected_material_id || 'S45C'}</td>
                      <td className="border border-black p-1.5 font-mono">{Number(weightKg).toFixed(2)}</td>
                      <td className="border border-black p-1.5 font-mono">{inp.N_order || (rfq?.annual_volume ? Math.round(rfq.annual_volume / 12) : 1000)}</td>

                      {/* 5 Cost Columns */}
                      <td className="border border-black p-1.5 font-mono text-right">
                        {formatCurrencyValue(formingCostVnd, currency, exchangeRate)}
                      </td>
                      <td className="border border-black p-1.5 font-mono text-right">
                        {formatCurrencyValue(machiningCostVnd, currency, exchangeRate)}
                      </td>
                      <td className="border border-black p-1.5 font-mono text-right">
                        {packageCostVnd > 0 ? formatCurrencyValue(packageCostVnd, currency, exchangeRate) : '-'}
                      </td>
                      <td className="border border-black p-1.5 font-mono text-right">
                        {deliveryCostVnd > 0 ? formatCurrencyValue(deliveryCostVnd, currency, exchangeRate) : '-'}
                      </td>
                      <td className="border border-black p-1.5 font-mono text-right">
                        {formatCurrencyValue(sgaAndPVnd, currency, exchangeRate)}
                      </td>

                      {/* Final Unit Price */}
                      <td className="border border-black p-1.5 font-mono font-extrabold text-right bg-gray-50">
                        {formatCurrencyValue(unitPriceVnd, currency, exchangeRate)}
                      </td>

                      {/* Tooling Price */}
                      <td className="border border-black p-1.5 font-mono text-right">
                        {isSeparateTooling ? (
                          formatCurrencyValue(toolingPriceVnd || 0, currency, exchangeRate)
                        ) : (
                          <span className="text-[9px] italic text-gray-600 font-sans">Đã phân bổ vào giá</span>
                        )}
                      </td>

                      {/* Tooling Usage */}
                      <td className="border border-black p-1.5 font-mono">
                        {(toolingLife || 0).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          <div className="space-y-1 text-[11px] pt-2">
            <p className="font-bold uppercase tracking-wider underline">Ghi chú / Notes:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-gray-800 font-medium">
              <li>Đơn giá trên chưa bao gồm thuế VAT.</li>
              <li>Trọng lượng phôi trong báo giá là tạm tính, sẽ được thống nhất lại bằng trọng lượng thực tế trước khi sản xuất loạt.</li>
              <li>Điều kiện giao hàng: {document.trade_terms || 'FOB'} DISOCO (Sông Công, Thái Nguyên) @Incoterm 2020.</li>
              <li>Thanh toán: {document.payment_terms}</li>
              <li>Thời gian giao hàng: {document.delivery_notes}</li>
            </ol>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold uppercase">
            <div>
              <p>CUSTOMER CONFIRMATION</p>
              <div className="h-20" /> {/* Blank space for hand signature */}
              <p className="text-[10px] text-gray-500 font-normal capitalize">Chữ ký & Dấu xác nhận khách hàng</p>
            </div>
            <div>
              <p>SONGCONG DIESEL LTD,. CO</p>
              <div className="h-20" /> {/* Blank space for hand signature */}
              <p className="text-[10px] text-gray-500 font-normal capitalize">Đại diện DISOCO ký tên</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
