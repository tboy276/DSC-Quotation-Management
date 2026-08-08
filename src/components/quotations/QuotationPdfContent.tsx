import React from 'react';
import type { QuotationDocument, DocumentDisplayConfig } from '../../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../../types/quotation-document';
import type { CurrencyType } from '../../types/quote';
import { DISOCO_COMPANY_CONFIG } from '../../config/company-config';

interface QuotationPdfContentProps {
  document: QuotationDocument;
  config?: DocumentDisplayConfig;
}

export const QuotationPdfContent: React.FC<QuotationPdfContentProps> = ({
  document,
  config: propConfig,
}) => {
  const config = propConfig || document.display_config || DEFAULT_DISPLAY_CONFIG;
  const items = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);
  const currency: CurrencyType = document.currency || 'VND';
  const lang = config.language || 'both';

  // Check segment mix
  const hasForging = items.some((it) => it.quote?.segment === 'forging');
  const hasCasting = items.some((it) => it.quote?.segment === 'casting');
  const isMixed = hasForging && hasCasting;

  const formingCostHeader = lang === 'en'
    ? (isMixed ? 'Forming Cost' : hasForging ? 'Forging Cost' : 'Casting Cost')
    : lang === 'vi'
    ? (isMixed ? 'Chi phí tạo phôi' : hasForging ? 'Chi phí rèn phôi' : 'Chi phí đúc phôi')
    : (isMixed ? 'Chi phí tạo phôi / Forming Cost' : hasForging ? 'Rèn phôi / Forging Cost' : 'Đúc phôi / Casting Cost');

  // Count active cost columns
  const activeCostCols = [
    config.showFormingCost,
    config.showMachiningCost,
    config.showPackageCost,
    config.showDeliveryCost,
    config.showSgaP,
  ].filter(Boolean).length;

  const formattedDate = new Date(document.quotation_date).toLocaleDateString(
    lang === 'vi' ? 'vi-VN' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const isLandscape = config.layoutOrientation === 'landscape';

  const getText = (viText: string, enText: string) => {
    if (lang === 'vi') return viText;
    if (lang === 'en') return enText;
    return `${viText} / ${enText}`;
  };

  const formatNum = (val: number | null | undefined) => {
    if (!val || val === 0) return '-';
    return Math.round(val).toLocaleString('vi-VN');
  };

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 text-[#111111] font-sans text-xs bg-white print:p-0 print:overflow-visible transition-all ${
        isLandscape ? 'max-w-[1140px] w-full mx-auto' : 'max-w-[840px] w-full mx-auto'
      }`}
      id="quotation-pdf-content"
    >
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm;
          }
        }
      `}</style>

      {/* Header Block */}
      <div className="grid grid-cols-12 gap-4 items-center border-b border-gray-300 pb-4">
        {/* Left: Logo */}
        <div className="col-span-3 flex items-center justify-start">
          <img
            src="https://res.cloudinary.com/ppzbydbc/image/upload/v1783387548/logo.png"
            alt="DISOCO Logo"
            crossOrigin="anonymous"
            className="h-16 w-auto max-w-full object-contain"
          />
        </div>

        {/* Center: Company Info */}
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
          {lang === 'vi' ? 'BẢNG BÁO GIÁ' : lang === 'en' ? 'QUOTATION' : 'THƯ BÁO GIÁ / QUOTATION'}
        </h2>
      </div>

      {/* Customer Info Block */}
      <div className="space-y-1 text-xs text-center">
        <p>
          <strong className="uppercase underline">
            {lang === 'vi' ? 'Kính gửi' : 'To'} : {document.customer_name}
          </strong>
        </p>
        <p className="italic text-gray-800">
          Attn: {document.contact_person || 'Purchasing Department'} &lt;{document.contact_email || 'N/A'}&gt;
        </p>
      </div>

      <div className="text-xs pt-1 pb-2 font-medium text-gray-900 text-left">
        <p>
          {lang === 'vi'
            ? 'Công ty DISOCO trân trọng gửi tới Quý khách hàng bảng báo giá chi tiết sản phẩm dưới đây:'
            : lang === 'en'
            ? 'DISOCO would like to send you our Quotation for goods as below:'
            : 'DISOCO trân trọng gửi báo giá chi tiết / DISOCO would like to send you our Quotation for goods as below:'}
        </p>
      </div>

      {/* Main Cost Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-[10px] text-left">
          <thead>
            <tr className="bg-gray-100 text-center font-bold border-b border-black">
              <th rowSpan={2} className="border border-black p-1.5 w-7">
                {lang === 'vi' ? 'STT' : lang === 'en' ? 'No.' : 'TT / No.'}
              </th>
              <th rowSpan={2} className="border border-black p-1.5 min-w-[100px]">
                {getText('Tên sản phẩm', 'Part Name')}
              </th>
              <th rowSpan={2} className="border border-black p-1.5 min-w-[80px]">
                {getText('Mã bản vẽ', 'Part Number')}
              </th>
              <th rowSpan={2} className="border border-black p-1.5 w-14">
                {getText('Mác VL', 'Material')}
              </th>

              {config.showWeight && (
                <th rowSpan={2} className="border border-black p-1.5 w-16">
                  {getText('Trọng lượng', 'Weight (Kg)')}
                </th>
              )}

              {config.showMOQ && (
                <th rowSpan={2} className="border border-black p-1.5 w-14">
                  MOQ<br />(pcs/lot)
                </th>
              )}

              {activeCostCols > 0 && (
                <th colSpan={activeCostCols} className="border border-black p-1.5 bg-gray-200">
                  {getText('Tập hợp chi phí', 'Cost Breakdown')} ({currency}/cái)
                </th>
              )}

              <th rowSpan={2} className="border border-black p-1.5 w-20 font-extrabold bg-gray-200">
                {getText('Đơn giá', 'Unit Price')}
                <br />({currency})
              </th>

              {config.showToolingPrice && (
                <th rowSpan={2} className="border border-black p-1.5 w-20">
                  {getText('Tiền khuôn', 'Tooling price')}
                  <br />({currency}/Bộ)
                </th>
              )}

              {config.showToolingUsage && (
                <th rowSpan={2} className="border border-black p-1.5 w-16">
                  {getText('Tuổi thọ khuôn', 'Tooling usage')}
                  <br />(Cái/bộ)
                </th>
              )}
            </tr>

            {activeCostCols > 0 && (
              <tr className="bg-gray-50 text-center font-semibold text-[9px]">
                {config.showFormingCost && <th className="border border-black p-1">{formingCostHeader}</th>}
                {config.showMachiningCost && <th className="border border-black p-1">{getText('Gia công', 'Machining')}</th>}
                {config.showPackageCost && <th className="border border-black p-1">{getText('Bao gói', 'Package')}</th>}
                {config.showDeliveryCost && <th className="border border-black p-1">{getText('Vận chuyển', 'Delivery')}</th>}
                {config.showSgaP && <th className="border border-black p-1">{getText('Quản lý & LN', 'S.G.A & P')}</th>}
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const q = item.quote;
              if (!q) return null;

              const isForging = q.segment === 'forging';
              const inp = q.inputs_json as any;
              const res = q.results_json as any;

              const weightKg = isForging ? res.m_phoi || inp.m_tinh : inp.m_cast;

              const seg = q.segment;
              let formingCostVnd = 0;
              let machiningCostVnd = 0;
              let fallbackPrice = 0;

              if (seg === 'forging') {
                formingCostVnd = (res.C_mat_forging ?? 0) + (res.C_ops_forging ?? 0);
                machiningCostVnd = res.C_machining ?? 0;
                fallbackPrice = res.P_FORGING ?? 0;
              } else if (seg === 'casting') {
                formingCostVnd = (res.C_metal_casting ?? 0) + (res.C_ops_casting ?? 0);
                machiningCostVnd = res.C_machining_casting ?? 0;
                fallbackPrice = res.P_CASTING ?? 0;
              } else if (seg === 'sawing') {
                formingCostVnd = (res.C_mat_sawing ?? 0) + (res.C_ops_sawing ?? 0);
                machiningCostVnd = res.C_machining ?? 0;
                fallbackPrice = res.P_SAWING ?? 0;
              } else if (seg === 'machining') {
                formingCostVnd = 0;
                machiningCostVnd = res.C_machining ?? 0;
                fallbackPrice = res.P_MACHINING ?? 0;
              }

              const packageCostVnd = inp.C_pack ?? 0;
              const deliveryCostVnd = (weightKg ?? 0) * (inp.DG_trans_kg ?? 0);

              const unitPriceVnd = q.final_quoted_price ?? fallbackPrice;
              const sgaAndPVnd = unitPriceVnd - (formingCostVnd + machiningCostVnd + packageCostVnd + deliveryCostVnd);

              const isSeparateTooling = (seg === 'forging' || seg === 'casting') && q.die_cost_treatment === 'separate';
              const toolingPriceVnd = seg === 'forging' ? inp.C_die_total : seg === 'casting' ? inp.C_pattern_total : 0;
              const toolingLife = seg === 'forging' ? inp.L_die_life : seg === 'casting' ? inp.L_pattern_life : 0;

              return (
                <tr key={item.id} className="border-b border-black text-center">
                  <td className="border border-black p-1.5 font-bold">{idx + 1}</td>
                  <td className="border border-black p-1.5 font-bold text-left">
                    {q.rfqItem?.product_name || 'Chi tiết sản phẩm'}
                  </td>
                  <td className="border border-black p-1.5 font-mono text-left">
                    {q.rfqItem?.part_number || 'No PN'}
                  </td>
                  <td className="border border-black p-1.5 font-mono">
                    {inp.selected_material_id || 'S45C'}
                  </td>

                  {config.showWeight && (
                    <td className="border border-black p-1.5 font-mono">
                      {Number(weightKg).toFixed(2)}
                    </td>
                  )}

                  {config.showMOQ && (
                    <td className="border border-black p-1.5 font-mono">
                      {inp.N_order || (q.rfqItem?.annual_volume ? Math.round(q.rfqItem.annual_volume / 12) : 1000)}
                    </td>
                  )}

                  {/* Active Cost Columns */}
                  {config.showFormingCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(formingCostVnd)}
                    </td>
                  )}
                  {config.showMachiningCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(machiningCostVnd)}
                    </td>
                  )}
                  {config.showPackageCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(packageCostVnd)}
                    </td>
                  )}
                  {config.showDeliveryCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(deliveryCostVnd)}
                    </td>
                  )}
                  {config.showSgaP && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(sgaAndPVnd)}
                    </td>
                  )}

                  {/* Final Unit Price */}
                  <td className="border border-black p-1.5 font-mono font-extrabold text-right bg-gray-50">
                    {formatNum(unitPriceVnd)}
                  </td>

                  {/* Tooling Price */}
                  {config.showToolingPrice && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {isSeparateTooling ? (
                        formatNum(toolingPriceVnd || 0)
                      ) : (
                        <span className="text-[9px] italic text-gray-600 font-sans">
                          {lang === 'vi' ? 'Đã phân bổ vào giá' : 'Amortized into price'}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Tooling Usage */}
                  {config.showToolingUsage && (
                    <td className="border border-black p-1.5 font-mono">
                      {(toolingLife || 0).toLocaleString('vi-VN')}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      <div className="space-y-1 text-[11px] pt-2">
        <p className="font-bold uppercase tracking-wider underline">
          {lang === 'vi' ? 'Ghi chú :' : lang === 'en' ? 'Notes :' : 'Ghi chú / Notes :'}
        </p>
        <ol className="list-decimal list-inside space-y-0.5 text-gray-800 font-medium">
          {config.remarks.map((r, i) => {
            const content = lang === 'vi' ? r.vi : lang === 'en' ? r.en : `${r.vi} ${r.en ? `(${r.en})` : ''}`;
            return <li key={r.id || i}>{content}</li>;
          })}
        </ol>
      </div>

      {/* Signature Blocks */}
      <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-bold uppercase">
        <div>
          <p>{lang === 'vi' ? 'XÁC NHẬN CỦA KHÁCH HÀNG' : 'CUSTOMER CONFIRMATION'}</p>
          <div className="h-20" />
          <p className="text-[10px] text-gray-500 font-normal capitalize">
            {lang === 'vi' ? 'Chữ ký & Dấu xác nhận khách hàng' : 'Signature & Stamp'}
          </p>
        </div>
        <div>
          <p>SONGCONG DIESEL LTD,. CO</p>
          <div className="h-20" />
          <p className="text-[10px] text-gray-500 font-normal capitalize">
            {lang === 'vi' ? 'Đại diện DISOCO ký tên' : 'Authorized Representative'}
          </p>
        </div>
      </div>

      {/* Footer ISO */}
      <div className="mt-16 pt-2 text-[9px] text-gray-700 flex justify-between items-end italic font-serif">
        <div className="text-left leading-tight">
          <p>BM/05-000-006</p>
          <p>Ban hành lần: 2</p>
        </div>
        <div className="text-center">
          <p>Ban hành ngày: 01/3/2025</p>
        </div>
        <div className="text-right">
          <p>Trang số: 1/1</p>
        </div>
      </div>
    </div>
  );
};
