import * as XLSX from 'xlsx';
import type { QuotationDocument } from '../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../types/quotation-document';
import type { ForgingInput, CastingInput, ForgingResult, CastingResult } from '../lib/calculation-engine/types';
import { formatCurrencyValue } from '../components/rfq/RealtimeSummaryPanel';

/**
 * Export Quotation Document to multi-sheet Excel file (.xlsx)
 * - Sheet 1: Summary table of all products
 * - Sheet 2..N: Detailed breakdown per product (2-column Variable / Value format covering all 5 Sections)
 */
export const exportDocumentToExcel = (document: QuotationDocument) => {
  if (!document.items || document.items.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const currency = document.currency || 'VND';
  const exchangeRate = document.exchange_rate || 1;
  const config = document.display_config || DEFAULT_DISPLAY_CONFIG;
  const lang = config.language || 'both';

  // ----------------------------------------------------
  // SHEET 1: TỔNG HỢP VĂN BẢN BÁO GIÁ (Summary Sheet)
  // ----------------------------------------------------
  const summaryRows = document.items.map((item, idx) => {
    const q = item.quote;
    const rfqItem = q?.rfqItem;
    const isForging = q?.segment === 'forging';
    const inp = q?.inputs_json as any || {};
    const res = q?.results_json as any || {};

    const weightKg = isForging ? inp.m_phoi : inp.m_cast;
    const formingCostVnd = isForging
      ? (res.C_mat_forging || 0) + (res.C_ops_forging || 0)
      : (res.C_metal_casting || 0) + (res.C_ops_casting || 0);

    const machiningCostVnd = isForging ? res.C_machining || 0 : res.C_machining_casting || 0;
    const packageCostVnd = inp.C_pack || 0;
    const deliveryCostVnd = (weightKg || 0) * (inp.DG_trans_kg || 0);
    const unitPriceVnd = q?.final_quoted_price || (isForging ? res.P_FORGING : res.P_CASTING) || 0;
    const sgaAndPVnd = unitPriceVnd - (formingCostVnd + machiningCostVnd + packageCostVnd + deliveryCostVnd);

    const isSeparateTooling = q?.die_cost_treatment === 'separate';
    const toolingPriceVnd = isForging ? inp.C_die_total : inp.C_pattern_total;
    const toolingLife = isForging ? inp.L_die_life : inp.L_pattern_life;

    const rowData: Record<string, any> = {
      'STT / No.': idx + 1,
      'Tên Sản Phẩm / Part Name': rfqItem?.product_name || 'N/A',
      'Part Number': rfqItem?.part_number || 'N/A',
      'Phân Hệ Công Nghệ': isForging ? 'Rèn Dập' : 'Đúc Gang',
      'Sản Lượng (Pcs/năm)': rfqItem?.annual_volume || 0,
    };

    if (config.showWeight) {
      rowData['Trọng lượng phôi (Kg)'] = weightKg ? Number(weightKg).toFixed(2) : '-';
    }

    if (config.showMOQ) {
      rowData['MOQ (pcs/lô)'] = inp.N_order || (rfqItem?.annual_volume ? Math.round(rfqItem.annual_volume / 12) : 1000);
    }

    if (config.showFormingCost) {
      rowData[`Tạo phôi (${currency})`] = formatCurrencyValue(formingCostVnd, currency, exchangeRate);
    }
    if (config.showMachiningCost) {
      rowData[`Gia công (${currency})`] = formatCurrencyValue(machiningCostVnd, currency, exchangeRate);
    }
    if (config.showPackageCost) {
      rowData[`Bao gói (${currency})`] = packageCostVnd > 0 ? formatCurrencyValue(packageCostVnd, currency, exchangeRate) : '-';
    }
    if (config.showDeliveryCost) {
      rowData[`Vận chuyển (${currency})`] = deliveryCostVnd > 0 ? formatCurrencyValue(deliveryCostVnd, currency, exchangeRate) : '-';
    }
    if (config.showSgaP) {
      rowData[`Quản lý & LN (${currency})`] = formatCurrencyValue(sgaAndPVnd, currency, exchangeRate);
    }

    rowData[`Đơn Giá Báo (${currency})`] = formatCurrencyValue(unitPriceVnd, currency, exchangeRate);

    if (config.showToolingPrice) {
      rowData[`Tiền Khuôn (${currency})`] = isSeparateTooling ? formatCurrencyValue(toolingPriceVnd || 0, currency, exchangeRate) : 'Đã phân bổ';
    }
    if (config.showToolingUsage) {
      rowData['Tuổi Thọ Khuôn (Lần)'] = toolingLife || '-';
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
      sheetData.push(['Trọng lượng ruột cát m_core (kg/cái)', cInp.m_core]);
      sheetData.push(['Đơn giá cát ruột & keo DG_core_sand (VNĐ/kg)', cInp.DG_core_sand_kg]);
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
    sheetData.push(['Tổng chi phí bộ khuôn/mẫu (VNĐ)', inp.C_die_total || inp.C_pattern_total || 0]);
    sheetData.push(['Tuổi thọ bộ khuôn/mẫu (chi tiết/bộ)', inp.L_die_life || inp.L_pattern_life || 0]);
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
  const fileName = `DISOCO_Breakdown_${document.customer_name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

function sheetdiv(sheetData: any[][], key: string, val: any) {
  sheetData.push([key, val]);
}
