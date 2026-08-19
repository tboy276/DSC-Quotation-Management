import React from 'react';
import type { QuotationDocument, DocumentDisplayConfig } from '../../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../../types/quotation-document';
import type { CurrencyType } from '../../types/quote';
import { DISOCO_COMPANY_CONFIG, DOCUMENT_FORM_CODE, DOCUMENT_REVISION_NO, DOCUMENT_ISSUE_DATE } from '../../config/company-config';
import { getToolingColumnFlags } from '../../utils/quotation-tooling-columns';

interface QuotationPdfContentProps {
  document: QuotationDocument;
  config?: DocumentDisplayConfig;
  materialsMap?: Map<string, string>;
  gradesMap?: Map<string, string>;
}

export const QuotationPdfContent: React.FC<QuotationPdfContentProps> = ({
  document,
  config: propConfig,
  materialsMap = new Map(),
  gradesMap = new Map(),
}) => {
  const config = propConfig || document.display_config || DEFAULT_DISPLAY_CONFIG;
  const items = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);
  const currency: CurrencyType = document.currency || 'VND';
  const lang = config.language || 'both';

  const { showDieAmortizedCost, showToolingPrice, showToolingUsage } = getToolingColumnFlags(items, config);

  // Count active cost columns
  const activeCostCols = [
    config.showMaterialCost,
    config.showFormingCost,
    config.showMachiningCost,
    config.showHeatTreatCost,
    config.showPaintCost,
    showDieAmortizedCost,
    config.showPackageCost,
    config.showDeliveryCost,
    config.showSgaP,
  ].filter(Boolean).length;

  const hasSubHeader = activeCostCols > 0;

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
            {lang === 'vi' ? 'CÔNG TY TNHH MTV DIESEL SÔNG CÔNG' : DISOCO_COMPANY_CONFIG.name}
          </h1>
          <p className="text-[10px] text-gray-700 leading-tight">
            {lang === 'vi' ? 'Số 362 đường Cách Mạng Tháng Mười, phường Bá Xuyên, tỉnh Thái Nguyên, Việt Nam.' : DISOCO_COMPANY_CONFIG.address}
          </p>
          <p className="text-[10px] text-gray-700 font-mono">
            {lang === 'vi' ? 'Mã số thuế: ' : 'Tax code: '} {DISOCO_COMPANY_CONFIG.taxCode}
          </p>
          <p className="text-[10px] text-gray-700">
            {lang === 'vi' ? 'Điện thoại: ' : 'Tel: '} {DISOCO_COMPANY_CONFIG.tel} &nbsp;|&nbsp; Fax: {DISOCO_COMPANY_CONFIG.fax}
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
        {document.document_code && (
          <p className="text-[10px] font-mono font-bold text-gray-700 mt-0.5">
            {getText('Số', 'No.')}: {document.document_code}
          </p>
        )}
      </div>

      {/* Customer Info Block */}
      <div className="space-y-1 text-xs text-center">
        <p>
          <strong className="uppercase underline">
            {lang === 'vi' ? 'Kính gửi' : 'To'} : {document.customer_name}
          </strong>
        </p>
        <p className="italic text-gray-800">
          Attn: {document.contact_person || 'Purchasing Department'}
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
              <th rowSpan={hasSubHeader ? 2 : 1} className="border border-black p-1.5 min-w-[80px]">
                {getText('Kí hiệu', 'Part Number')}
              </th>
              <th rowSpan={hasSubHeader ? 2 : 1} className="border border-black p-1.5 w-14">
                {getText('Vật liệu', 'Material')}
              </th>

              {config.showWeightChi && (
                <th rowSpan={2} className="border border-black p-1.5 w-14">
                  {getText('TL Chi', 'Gross Wt')}
                  <br />(Kg)
                </th>
              )}
              {config.showWeightPhoi && (
                <th rowSpan={2} className="border border-black p-1.5 w-14">
                  {getText('TL Phôi', 'Net Wt')}
                  <br />(Kg)
                </th>
              )}
              {config.showWeightTinh && (
                <th rowSpan={2} className="border border-black p-1.5 w-14">
                  {getText('TL Tinh', 'Final Wt')}
                  <br />(Kg)
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

              {showToolingPrice && (
                <th rowSpan={2} className="border border-black p-1.5 w-20">
                  {getText('Tiền khuôn', 'Tooling price')}
                  <br />({currency}/Bộ)
                </th>
              )}

              {showToolingUsage && (
                <th rowSpan={2} className="border border-black p-1.5 w-16">
                  {getText('Tuổi thọ khuôn', 'Tooling usage')}
                  <br />(Cái/bộ)
                </th>
              )}
            </tr>

            {activeCostCols > 0 && (
              <tr className="bg-gray-50 text-center font-semibold text-[9px]">
                {config.showMaterialCost && <th className="border border-black p-1">{getText('Vật Tư', 'Material')}</th>}
                {config.showFormingCost && <th className="border border-black p-1">{getText('Phí Chế Tạo', 'Forming')}</th>}
                {config.showMachiningCost && <th className="border border-black p-1">{getText('Gia Công CNC', 'Machining')}</th>}
                {config.showHeatTreatCost && <th className="border border-black p-1">{getText('Nhiệt Luyện', 'Heat Treat')}</th>}
                {config.showPaintCost && <th className="border border-black p-1">{getText('Sơn/Bề Mặt', 'Paint')}</th>}
                {showDieAmortizedCost && <th className="border border-black p-1">{getText('Khuôn', 'Die')}</th>}
                {config.showPackageCost && <th className="border border-black p-1">{getText('Bao Gói', 'Package')}</th>}
                {config.showDeliveryCost && <th className="border border-black p-1">{getText('Vận Chuyển', 'Delivery')}</th>}
                {config.showSgaP && <th className="border border-black p-1">{getText('Quản Lý & LN', 'S.G.A & P')}</th>}
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const q = item.quote;
              if (!q) return null;

              const inp = q.inputs_json as any;
              
              const idMap = q.segment === 'casting' ? gradesMap : materialsMap;
              const resolvedId = q.segment === 'casting' ? inp.selected_casting_grade_id : inp.selected_material_id;
              let materialName = (resolvedId && idMap.get(resolvedId)) 
                || inp.material_name 
                || inp.selected_material_name 
                || (q.segment === 'casting' ? 'FCD450-10' : 'S45C');

              const res = q.results_json as any;
              const seg = q.segment;
              const weightChiKg = seg === 'casting' ? res.m_liquid : inp.m_chi;
              const weightPhoiKg = seg === 'casting' ? inp.m_cast : (seg === 'forging' ? res.shipping_weight_kg : (res.m_phoi || inp.m_phoi));
              const weightTinhKg = inp.m_tinh;

              let materialCostVnd = 0;
              let formingCostVnd = 0;
              let machiningCostVnd = 0;
              let heatTreatCostVnd = 0;
              let paintCostVnd = 0;
              let packageCostVnd = 0;
              let deliveryCostVnd = 0;
              let dieAmortizedVnd = 0;
              let fallbackPrice = 0;

              if (seg === 'forging') {
                materialCostVnd = res.C_mat_forging ?? 0;
                formingCostVnd = res.C_ops_forging ?? 0;
                machiningCostVnd = res.C_machining ?? 0;
                heatTreatCostVnd = res.C_heat_treat ?? 0;
                paintCostVnd = res.C_paint ?? 0;
                dieAmortizedVnd = res.C_die_amortized_per_unit ?? 0;
                fallbackPrice = res.P_FORGING ?? 0;
              } else if (seg === 'casting') {
                materialCostVnd = 0; // As requested, set Material Cost to 0 for Casting
                formingCostVnd = (res.C_metal_casting ?? 0) + (res.C_ops_casting ?? 0) + (res.C_part_b_total ?? 0);
                machiningCostVnd = res.C_machining_casting ?? 0;
                heatTreatCostVnd = res.C_heat_treat ?? 0;
                paintCostVnd = res.C_paint ?? 0;
                dieAmortizedVnd = res.C_pattern_amortization_per_unit ?? 0;
                fallbackPrice = res.P_CASTING ?? 0;
              } else if (seg === 'sawing') {
                materialCostVnd = res.C_mat_sawing ?? 0;
                formingCostVnd = 0;
                machiningCostVnd = (res.C_ops_sawing ?? 0) + (res.C_machining ?? 0);
                heatTreatCostVnd = res.C_heat_treat ?? 0;
                paintCostVnd = res.C_paint ?? 0;
                fallbackPrice = res.P_SAWING ?? 0;
              } else if (seg === 'machining') {
                materialCostVnd = 0;
                formingCostVnd = 0;
                machiningCostVnd = res.C_machining ?? 0;
                heatTreatCostVnd = res.C_heat_treat ?? 0;
                paintCostVnd = res.C_paint ?? 0;
                fallbackPrice = res.P_MACHINING ?? 0;
              }

              const finalWeight = seg === 'forging' ? (res.shipping_weight_kg || 0) : (inp.m_tinh || weightPhoiKg || weightChiKg || 0);
              packageCostVnd = inp.DG_pack_kg !== undefined && inp.DG_pack_kg > 0 ? (inp.DG_pack_kg * finalWeight) : (inp.C_pack || 0);
              deliveryCostVnd = finalWeight * (inp.DG_trans_kg || 0);

              const unitPriceVnd = q.final_quoted_price ?? fallbackPrice;
              const sgaAndPVnd = unitPriceVnd - (materialCostVnd + formingCostVnd + machiningCostVnd + heatTreatCostVnd + paintCostVnd + packageCostVnd + deliveryCostVnd);

              const isSeparateTooling = (seg === 'forging' || seg === 'casting') && q.die_cost_treatment === 'separate';
              const toolingPriceVnd = seg === 'forging' ? res.actual_C_die_total : seg === 'casting' ? inp.C_pattern_total : 0;
              const toolingLife = seg === 'forging' ? res.actual_L_die_life : seg === 'casting' ? inp.L_pattern_life : 0;
              
              const quotedMoq = inp.quoted_moq;

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
                    {materialName}
                  </td>

                  {config.showWeightChi && (
                    <td className="border border-black p-1.5 font-mono">
                      {weightChiKg ? Number(weightChiKg).toFixed(2) : '-'}
                    </td>
                  )}
                  {config.showWeightPhoi && (
                    <td className="border border-black p-1.5 font-mono">
                      {weightPhoiKg ? Number(weightPhoiKg).toFixed(2) : '-'}
                    </td>
                  )}
                  {config.showWeightTinh && (
                    <td className="border border-black p-1.5 font-mono">
                      {weightTinhKg ? Number(weightTinhKg).toFixed(2) : '-'}
                    </td>
                  )}

                  {config.showMOQ && (
                    <td className="border border-black p-1.5 font-mono">
                      {quotedMoq ? quotedMoq.toLocaleString('vi-VN') : '-'}
                    </td>
                  )}

                  {/* Active Cost Columns */}
                  {config.showMaterialCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(materialCostVnd)}
                    </td>
                  )}
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
                  {config.showHeatTreatCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(heatTreatCostVnd)}
                    </td>
                  )}
                  {config.showPaintCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {formatNum(paintCostVnd)}
                    </td>
                  )}
                  {showDieAmortizedCost && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {(seg === 'forging' || seg === 'casting') ? (q.die_cost_treatment === 'amortized' ? formatNum(dieAmortizedVnd) : '-') : ''}
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
                  {showToolingPrice && (
                    <td className="border border-black p-1.5 font-mono text-right">
                      {isSeparateTooling ? (
                        formatNum(toolingPriceVnd || 0)
                      ) : (
                        "-"
                      )}
                    </td>
                  )}

                  {/* Tooling Usage */}
                  {showToolingUsage && (
                    <td className="border border-black p-1.5 font-mono">
                      {isSeparateTooling ? (toolingLife || 0).toLocaleString('vi-VN') : "-"}
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
        </div>
        <div>
          <p>{lang === 'vi' ? 'CÔNG TY TNHH MTV DIESEL SÔNG CÔNG' : 'SONGCONG DIESEL LTD,. CO'}</p>
          <div className="h-20" />
        </div>
      </div>

      {/* Footer ISO */}
      <div className="mt-16 pt-2 text-[9px] text-gray-700 flex justify-between items-end italic font-serif">
        <div className="text-left leading-tight">
          <p>{DOCUMENT_FORM_CODE}</p>
          <p>{DOCUMENT_REVISION_NO}</p>
        </div>
        <div className="text-center">
          <p>{DOCUMENT_ISSUE_DATE}</p>
        </div>
        <div className="text-right">
          <p>Trang số: 1/1</p>
        </div>
      </div>
    </div>
  );
};
