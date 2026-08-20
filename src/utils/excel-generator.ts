import type { QuotationDocument } from '../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../types/quotation-document';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from '../lib/calculation-engine/types';
import { formatCurrencyValue } from '../components/rfq/RealtimeSummaryPanel';
import { getToolingColumnFlags } from './quotation-tooling-columns';

/**
 * Export Quotation Document to multi-sheet Excel file (.xlsx)
 * - Sheet 1: Summary table of all products
 * - Sheet 2..N: Detailed breakdown per product (2-column Variable / Value format covering all 5 Sections)
 */
export const exportDocumentToExcel = async (document: QuotationDocument) => {
  const XLSX = await import('xlsx');
  
  if (!document.items || document.items.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const currency = document.currency || 'VND';
  const exchangeRate = document.exchange_rate || 1;
  const config = document.display_config || DEFAULT_DISPLAY_CONFIG;
  const lang = config.language || 'both';

  // ----------------------------------------------------
  // SHEET 1: TỔNG HỢP VĂN BẢN BÁO GIÁ (Summary Sheet)
  // ----------------------------------------------------
  const { showDieAmortizedCost, showToolingPrice, showToolingUsage } = getToolingColumnFlags(document.items, config);

  const summaryRows = document.items.map((item, idx) => {
    const q = item.quote;
    const rfqItem = q?.rfqItem;
    const seg = q?.segment;
    const isForging = seg === 'forging';
    const isCasting = seg === 'casting';
    const inp = q?.inputs_json as any || {};
    const res = q?.results_json as any || {};

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

    const weightKg = isCasting ? inp.m_cast : (isForging ? res.shipping_weight_kg : (inp.m_phoi || inp.m_chi || 0));
    const finalWeight = isForging ? (res.shipping_weight_kg || 0) : (inp.m_tinh || weightKg || 0);
    packageCostVnd = inp.DG_pack_kg !== undefined && inp.DG_pack_kg > 0 ? (inp.DG_pack_kg * finalWeight) : (inp.C_pack || 0);
    deliveryCostVnd = finalWeight * (inp.DG_trans_kg || 0);

    const unitPriceVnd = q?.final_quoted_price || fallbackPrice || 0;
    const sgaAndPVnd = unitPriceVnd - (materialCostVnd + formingCostVnd + machiningCostVnd + heatTreatCostVnd + paintCostVnd + packageCostVnd + deliveryCostVnd);

    const isSeparateTooling = (seg === 'forging' || seg === 'casting') && q?.die_cost_treatment === 'separate';
    const toolingPriceVnd = seg === 'forging' ? res.actual_C_die_total : seg === 'casting' ? inp.C_pattern_total : 0;
    const toolingLife = seg === 'forging' ? res.actual_L_die_life : seg === 'casting' ? inp.L_pattern_life : 0;

    const rowData: Record<string, any> = {
      'STT / No.': idx + 1,
      'Mã Báo Giá': document.document_code || 'N/A',
      'Mã RFQ': document.rfq_code || 'N/A',
      'Mã Dòng Sản Phẩm': rfqItem?.item_code || 'N/A',
      'Tên Sản Phẩm / Part Name': rfqItem?.product_name || 'N/A',
      'Part Number': rfqItem?.part_number || 'N/A',
      'Phân Hệ Công Nghệ': isForging ? 'Rèn Dập' : 'Đúc Gang',
      'Sản Lượng (Pcs/năm)': rfqItem?.annual_volume || 0,
    };

    if (config.showWeightChi) {
      rowData['TL Chi (Kg)'] = (inp.m_chi || res.m_liquid) ? Number(inp.m_chi || res.m_liquid).toFixed(2) : '-';
    }
    if (config.showWeightPhoi) {
      rowData['TL Phôi (Kg)'] = weightKg ? Number(weightKg).toFixed(2) : '-';
    }
    if (config.showWeightTinh) {
      rowData['TL Tinh (Kg)'] = inp.m_tinh ? Number(inp.m_tinh).toFixed(2) : '-';
    }

    if (config.showMOQ) {
      rowData['MOQ (pcs/lô)'] = inp.quoted_moq || '-';
    }

    if (config.showMaterialCost) {
      rowData[`Vật Tư (${currency})`] = formatCurrencyValue(materialCostVnd, currency, exchangeRate);
    }
    if (config.showFormingCost) {
      rowData[`Phí Chế Tạo (${currency})`] = formatCurrencyValue(formingCostVnd, currency, exchangeRate);
    }
    if (config.showMachiningCost) {
      rowData[`Gia Công CNC (${currency})`] = formatCurrencyValue(machiningCostVnd, currency, exchangeRate);
    }
    if (config.showHeatTreatCost) {
      rowData[`Nhiệt Luyện (${currency})`] = formatCurrencyValue(heatTreatCostVnd, currency, exchangeRate);
    }
    if (config.showPaintCost) {
      rowData[`Sơn/Bề Mặt (${currency})`] = formatCurrencyValue(paintCostVnd, currency, exchangeRate);
    }
    if (showDieAmortizedCost) {
      rowData[`Khuôn (${currency}/cái)`] = (isForging || isCasting) ? (q?.die_cost_treatment === 'amortized' ? formatCurrencyValue(dieAmortizedVnd, currency, exchangeRate) : '-') : '';
    }
    if (config.showPackageCost) {
      rowData[`Bao Gói (${currency})`] = formatCurrencyValue(packageCostVnd, currency, exchangeRate);
    }
    if (config.showDeliveryCost) {
      rowData[`Vận Chuyển (${currency})`] = formatCurrencyValue(deliveryCostVnd, currency, exchangeRate);
    }
    if (config.showSgaP) {
      rowData[`Quản Lý & LN (${currency})`] = formatCurrencyValue(sgaAndPVnd, currency, exchangeRate);
    }

    rowData[`Đơn Giá Báo (${currency})`] = formatCurrencyValue(unitPriceVnd, currency, exchangeRate);

    if (showToolingPrice) {
      rowData[`Tiền Khuôn (${currency})`] = isSeparateTooling ? formatCurrencyValue(toolingPriceVnd || 0, currency, exchangeRate) : '-';
    }
    if (showToolingUsage) {
      rowData['Tuổi Thọ Khuôn (Lần)'] = isSeparateTooling ? toolingLife || '-' : '-';
    }

    rowData['Điều Kiện Giao Hàng'] = document.trade_terms || 'FOB';
    rowData['Trạng Thái Dòng'] = rfqItem?.status || q?.status || 'IN_COSTING';

    return rowData;
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  // Add Remarks to bottom of Summary Sheet
  if (config.remarks && config.remarks.length > 0) {
    const remarkHeaderRow = summaryRows.length + 3;
    XLSX.utils.sheet_add_aoa(
      summarySheet,
      [
        ['GHI CHÚ / REMARKS:'],
        ...config.remarks.map((r, i) => [
          `${i + 1}. ${lang === 'vi' ? r.vi : lang === 'en' ? r.en : `${r.vi} / ${r.en}`}`,
        ]),
      ],
      { origin: `A${remarkHeaderRow}` }
    );
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong_Hop_Bao_Gia');

  // ----------------------------------------------------
  // SHEET 2..N: DETAILED BREAKDOWN PER PRODUCT (5 SECTIONS)
  // ----------------------------------------------------
  document.items.forEach((item, idx) => {
    const q = item.quote;
    if (!q) return;

    const rfqItem = q.rfqItem;
    const isForging = q.segment === 'forging';
    const inp = q.inputs_json as any;
    const res = q.results_json as any;

    const sheetData: any[][] = [];

    // Header info block
    sheetData.push(['BÓC TÁCH CHI TIẾT NỘI BỘ NĂNG LỰC TÍNH GIÁ DISOCO', '']);
    sheetData.push(['Mã Báo Giá:', document.document_code || 'N/A']);
    sheetData.push(['Mã RFQ Cha:', document.rfq_code || 'N/A']);
    sheetData.push(['Mã Dòng Sản Phẩm:', rfqItem?.item_code || 'N/A']);
    sheetData.push(['Sản phẩm / Part Name:', `${rfqItem?.product_name || 'N/A'} (${rfqItem?.part_number || 'No PN'})`]);
    sheetData.push(['Khách hàng:', document.customer_name]);
    sheetData.push(['Phân hệ công nghệ:', isForging ? 'Rèn Dập (Forging)' : 'Đúc Gang (Iron Casting)']);
    sheetData.push(['Tiền tệ / Tỷ giá:', `${currency} (1 ${currency} = ${exchangeRate} VNĐ)`]);
    sheetData.push(['', '']); // Empty row

    sheetData.push(['=== SECTION 1 — CHI PHÍ VẬT LIỆU (MATERIAL COST) ===', '']);
    if (isForging) {
      const fInp = inp as ForgingInput;
      const fRes = res as ForgingResult;
      if (fInp.use_m_tinh) {
        sheetData.push(['Trọng lượng tinh m_tinh (kg/cái)', fInp.m_tinh || 0]);
      }
      sheetData.push(['Trọng lượng phôi rèn m_phoi (kg/cái)', fInp.m_phoi || 0]);
      sheetData.push(['Trọng lượng chi m_chi (kg/cái)', fInp.m_chi || 0]);
      sheetData.push(['Trọng lượng bavia m_bavia (kg/cái)', fRes.m_bavia || 0]);
      sheetData.push(['Tỷ lệ tổn thất phôi k_loss (%)', fInp.k_loss]);
      sheetData.push(['Đơn giá thép mua vào DG_steel (VNĐ/kg)', fInp.DG_steel]);
      sheetData.push(['Đơn giá phế liệu thu hồi DG_scrap (VNĐ/kg)', fInp.DG_scrap]);
      sheetData.push(['Chi phí vật liệu tinh C_mat_forging (VNĐ/cái)', Math.round(fRes.C_mat_forging)]);
    } else {
      const cInp = inp as CastingInput;
      const cRes = res as CastingResult;
      sheetData.push(['Trọng lượng vật đúc m_cast (kg/cái)', cInp.m_cast]);
      sheetData.push(['Tỷ lệ thu hồi kim loại Y_yield (%)', cInp.Y_yield]);
      sheetData.push(['Tổng lượng kim loại lỏng cần nấu m_liquid (kg/cái)', cRes.m_liquid]);
      sheetData.push(['Đơn giá nén đúc nước gang lỏng DG_liquid (VNĐ/kg)', cInp.DG_liquid]);
      sheetData.push(['Đơn giá phế hồi liệu đúc DG_cast_scrap (VNĐ/kg)', cInp.DG_cast_scrap]);
      sheetData.push(['Chi phí vật liệu đúc C_metal_casting (VNĐ/cái)', Math.round(cRes.C_metal_casting)]);
    }

    sheetData.push(['', '']); // Empty row
    sheetData.push(['=== SECTION 2 — CÔNG NGHỆ & NHIỆT LỰA / TẠO KHUÔN ===', '']);
    if (isForging) {
      const fInp = inp as ForgingInput;
      const fRes = res as ForgingResult;
      sheetData.push(['Thời gian cắt phôi t_cut (giây/cái)', fInp.t_cut_sec]);
      sheetData.push(['Đơn giá máy cưa đĩa DG_sawing (VNĐ/giờ)', fInp.DG_sawing_machine_hour]);
      sheetData.push(['Tiêu hao điện rèn w_elec (kWh/kg)', fInp.w_elec_kwh_per_kg]);
      sheetData.push(['Đơn giá điện công nghiệp DG_elec (VNĐ/kWh)', fInp.DG_elec_kwh]);
      sheetData.push(['Năng suất dự kiến (Cái/ca)', fInp.expected_productivity]);
      sheetData.push(['Đơn giá cước hệ máy dập/búa DG_machine (VNĐ/giờ)', fInp.DG_forging_machine_hour]);
      sheetData.push(['Chi phí công nghệ rèn C_ops_forging (VNĐ/cái)', Math.round(fRes.C_ops_forging)]);
    } else {
      const cInp = inp as CastingInput;
      const cRes = res as CastingResult;
      sheetData.push(['Đơn giá công đoạn tạo khuôn Sinto DG_sinto (VNĐ/khuôn)', cInp.DG_sinto_op]);
      sheetdiv(sheetData, 'Số lòng khuôn n_cavity (chi tiết/khuôn)', cInp.n_cavity_per_mold);
      sheetData.push(['Trọng lượng thao cát nhựa (kg/cái)', cInp.m_resin_core]);
      sheetData.push(['Đơn giá thao cát nhựa (VND/kg)', cInp.DG_resin_core_per_kg]);
      sheetData.push(['Chi phí công nghệ tạo khuôn & đúc C_ops_casting (VNĐ/cái)', Math.round(cRes.C_ops_casting)]);
    }

    sheetData.push(['', '']); // Empty row
    sheetData.push(['=== SECTION 3 — GIA CÔNG CƠ KHÍ CNC (MACHINING) ===', '']);
    const ops = inp.machining_operations || [];
    sheetData.push(['Số công đoạn gia công CNC:', ops.length]);
    ops.forEach((op: any, opIdx: number) => {
      sheetData.push([
        `Công đoạn ${opIdx + 1}: ${op.name}`,
        `t_prep=${op.t_prep_min}m | t_man=${op.t_man_min}m | Cước=${op.DG_machine_hour}đ/h | Dao=${op.C_tooling}đ`,
      ]);
    });
    const C_machining = isForging ? res.C_machining : res.C_machining_casting;
    sheetData.push(['Tổng chi phí gia công CNC (VNĐ/cái)', Math.round(C_machining || 0)]);

    sheetData.push(['', '']); // Empty row
    sheetData.push(['=== SECTION 4 — KHẤU HAO KHUÔN / MẪU (TOOLING AMORTIZATION) ===', '']);
    sheetData.push(['Cơ chế tiền khuôn:', q.die_cost_treatment]);
    sheetData.push(['Tổng chi phí bộ khuôn/mẫu (VNĐ)', isForging ? (res.actual_C_die_total || 0) : (inp.C_pattern_total || 0)]);
    sheetData.push(['Tuổi thọ bộ khuôn/mẫu (chi tiết/bộ)', isForging ? (res.actual_L_die_life || 0) : (inp.L_pattern_life || 0)]);
    const C_amortization = isForging ? res.C_die_amortization : res.C_pattern_amortization;
    sheetData.push(['Chi phí khấu hao khuôn phân bổ C_amortization (VNĐ/cái)', Math.round(C_amortization || 0)]);

    sheetData.push(['', '']); // Empty row
    sheetData.push(['=== SECTION 5 — CHI PHÍ TRƯỚC LỢI NHUẬN & ĐƠN GIÁ BÁO GIÁ ===', '']);
    sheetData.push(['Tổng Giá Vốn Sản Xuất COGS (VNĐ/cái)', Math.round(res.COGS || 0)]);
    sheetData.push(['Tỷ lệ chi phí quản lý k_mgmt (%)', inp.k_mgmt || inp.k_mgmt_cast || 0]);
    sheetData.push(['Chi phí trước lợi nhuận pre_profit_price (VNĐ/cái)', Math.round(res.pre_profit_price || 0)]);
    sheetData.push(['Tỷ lệ lợi nhuận mục tiêu k_profit (%)', inp.k_profit_forging || inp.k_profit_casting || 0]);
    sheetData.push(['ĐƠN GIÁ BÁO GIÁ CUỐI CÙNG (VNĐ/cái)', Math.round(q.final_quoted_price)]);
    sheetData.push(['ĐƠN GIÁ BÁO GIÁ QUY ĐỔI (' + currency + ')', formatCurrencyValue(q.final_quoted_price, currency, exchangeRate)]);

    const detailSheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths for readability
    detailSheet['!cols'] = [{ wch: 45 }, { wch: 55 }];

    // Sheet name: safe sheet name up to 30 chars
    let rawSheetName = rfqItem?.product_name || `SP_${idx + 1}`;
    let safeSheetName = rawSheetName.replace(/[:\\/?*\[\]]/g, '_').slice(0, 30);
    if (workbook.SheetNames.includes(safeSheetName)) {
      safeSheetName = `${safeSheetName.slice(0, 26)}_${idx + 1}`;
    }

    XLSX.utils.book_append_sheet(workbook, detailSheet, safeSheetName);
  });

  // Download filename
  const codePart = (document.document_code || document.id.substring(0, 8)).replace(/[^a-zA-Z0-9-]/g, '_');
  const fileName = `DISOCO_Breakdown_${document.customer_name.replace(/\s+/g, '_')}_${codePart}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

function sheetdiv(sheetData: any[][], key: string, val: any) {
  sheetData.push([key, val]);
}
