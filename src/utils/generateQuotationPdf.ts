import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuotationDocument } from '../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../types/quotation-document';

import { DISOCO_COMPANY_CONFIG, DOCUMENT_FORM_CODE, DOCUMENT_REVISION_NO, DOCUMENT_ISSUE_DATE } from '../config/company-config';

// Import Fonts Base64
import { RobotoRegularBase64 } from '../assets/fonts/Roboto-Regular';
import { RobotoBoldBase64 } from '../assets/fonts/Roboto-Bold';
import { RobotoItalicBase64 } from '../assets/fonts/Roboto-Italic';
import { getToolingColumnFlags } from './quotation-tooling-columns';

function removeVietnameseTones(str: string) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  return str;
}

export function generatePdfFilename(customerName: string, id: string, documentCode?: string): string {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const shortId = id.substring(0, 8);
  let slugName = customerName || 'KhachHang';
  slugName = removeVietnameseTones(slugName);
  slugName = slugName.replace(/[^a-zA-Z0-9]/g, '_');
  slugName = slugName.replace(/_+/g, '_');
  slugName = slugName.replace(/^_|_$/g, '');
  // Ưu tiên dùng document_code (BG-[rfq_code]-rev-XX) để tên file tự thể hiện mã tra cứu
  const codePart = documentCode ? documentCode.replace(/[^a-zA-Z0-9-]/g, '_') : shortId;
  return `DISOCO_BaoGia_${slugName}_${dateStr}_${codePart}.pdf`;
}

async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateQuotationPdf(document: QuotationDocument) {
  const config = document.display_config || DEFAULT_DISPLAY_CONFIG;
  const isLandscape = config.layoutOrientation === 'landscape';
  const lang = config.language || 'both';
  const currency = document.currency || 'VND';

  const getText = (viText: string, enText: string) => {
    if (lang === 'vi') return viText;
    if (lang === 'en') return enText;
    return `${viText} / ${enText}`;
  };

  const formatNum = (val: number | null | undefined) => {
    if (!val || val === 0) return '-';
    return Math.round(val).toLocaleString('vi-VN');
  };

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Fonts
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.addFileToVFS('Roboto-Italic.ttf', RobotoItalicBase64);
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');
  
  doc.setFont('Roboto', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Logo
  try {
    const logoBase64 = await getBase64ImageFromUrl('https://res.cloudinary.com/ppzbydbc/image/upload/v1783387548/logo.png');
    // Original logo ratio is approx 2.14:1 (e.g., 3000x1400). Let's use 26x12.
    doc.addImage(logoBase64, 'PNG', margin, currentY, 26, 12);
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  // Company Info
  const companyName = lang === 'vi' ? 'CÔNG TY TNHH MTV DIESEL SÔNG CÔNG' : DISOCO_COMPANY_CONFIG.name;
  const companyAddress = lang === 'vi' ? 'Số 362 đường Cách Mạng Tháng Mười, phường Bá Xuyên, tỉnh Thái Nguyên, Việt Nam.' : DISOCO_COMPANY_CONFIG.address;
  const taxCodeText = lang === 'vi' ? `Mã số thuế: ${DISOCO_COMPANY_CONFIG.taxCode}` : `Tax code: ${DISOCO_COMPANY_CONFIG.taxCode}`;
  const telFaxText = lang === 'vi' ? `Điện thoại: ${DISOCO_COMPANY_CONFIG.tel} | Fax: ${DISOCO_COMPANY_CONFIG.fax}` : `Tel: ${DISOCO_COMPANY_CONFIG.tel} | Fax: ${DISOCO_COMPANY_CONFIG.fax}`;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.text(companyName, pageWidth / 2, currentY + 4, { align: 'center' });
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.text(companyAddress, pageWidth / 2, currentY + 8, { align: 'center' });
  doc.text(taxCodeText, pageWidth / 2, currentY + 12, { align: 'center' });
  doc.text(telFaxText, pageWidth / 2, currentY + 16, { align: 'center' });

  // Date
  const formattedDate = new Date(document.quotation_date).toLocaleDateString(
    lang === 'vi' ? 'vi-VN' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  doc.setFont('Roboto', 'italic');
  doc.text(formattedDate, pageWidth - margin, currentY + 16, { align: 'right' });
  
  doc.setFont('Roboto', 'normal');
  
  // Line separator
  currentY += 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Title
  currentY += 10;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  const titleText = lang === 'vi' ? 'BẢNG BÁO GIÁ' : lang === 'en' ? 'QUOTATION' : 'THƯ BÁO GIÁ / QUOTATION';
  doc.text(titleText, pageWidth / 2, currentY, { align: 'center' });

  // Document Code (Số báo giá) — cho phép tra cứu ngược về RFQ gốc
  if (document.document_code) {
    currentY += 5;
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    const noLabel = lang === 'vi' ? 'Số' : 'No.';
    doc.text(`${noLabel}: ${document.document_code}`, pageWidth / 2, currentY, { align: 'center' });
  }

  // Customer Info
  currentY += 8;
  doc.setFontSize(10);
  const toText = lang === 'vi' ? 'Kính gửi' : 'To';
  doc.text(`${toText} : ${document.customer_name}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('Roboto', 'italic');
  doc.setFontSize(9);
  doc.text(`Attn: ${document.contact_person || 'Purchasing Department'}`, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  const introText = lang === 'vi' 
    ? 'Công ty DISOCO trân trọng gửi tới Quý khách hàng bảng báo giá chi tiết sản phẩm dưới đây:' 
    : lang === 'en' 
    ? 'DISOCO would like to send you our Quotation for goods as below:' 
    : 'DISOCO trân trọng gửi báo giá chi tiết / DISOCO would like to send you our Quotation for goods as below:';
  doc.text(introText, margin, currentY);

  currentY += 5;

  // Table Setup
  const items = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order);
  
  const { showDieAmortizedCost, showToolingPrice, showToolingUsage } = getToolingColumnFlags(items, config);

  const activeCostCols = [
    { key: 'showMaterialCost', labelVi: 'Vật Tư', labelEn: 'Material' },
    { key: 'showFormingCost', labelVi: 'Phí Chế Tạo', labelEn: 'Forming' },
    { key: 'showMachiningCost', labelVi: 'Gia Công CNC', labelEn: 'Machining' },
    { key: 'showHeatTreatCost', labelVi: 'Nhiệt Luyện', labelEn: 'Heat Treat' },
    { key: 'showPaintCost', labelVi: 'Sơn/Bề Mặt', labelEn: 'Paint' },
    ...(showDieAmortizedCost ? [{ key: 'showDieAmortizedCost', labelVi: 'Khuôn', labelEn: 'Die', alwaysShow: true }] : []),
    { key: 'showPackageCost', labelVi: 'Bao Gói', labelEn: 'Package' },
    { key: 'showDeliveryCost', labelVi: 'Vận Chuyển', labelEn: 'Delivery' },
    { key: 'showSgaP', labelVi: 'Quản Lý & LN', labelEn: 'S.G.A & P' }
  ].filter(col => col.alwaysShow || (config as any)[col.key]);

  const hasSubHeader = activeCostCols.length > 0;

  const headRow1: any[] = [
    { content: lang === 'vi' ? 'STT' : lang === 'en' ? 'No.' : 'TT / No.', rowSpan: hasSubHeader ? 2 : 1 },
    { content: getText('Tên sản phẩm', 'Part Name'), rowSpan: hasSubHeader ? 2 : 1 },
    { content: getText('Kí hiệu', 'Part Number'), rowSpan: hasSubHeader ? 2 : 1 },
    { content: getText('Vật liệu', 'Material'), rowSpan: hasSubHeader ? 2 : 1 }
  ];

  if (config.showWeightChi) headRow1.push({ content: getText('TL Chi', 'Gross Wt') + '\n(Kg)', rowSpan: hasSubHeader ? 2 : 1 });
  if (config.showWeightPhoi) headRow1.push({ content: getText('TL Phôi', 'Net Wt') + '\n(Kg)', rowSpan: hasSubHeader ? 2 : 1 });
  if (config.showWeightTinh) headRow1.push({ content: getText('TL Tinh', 'Final Wt') + '\n(Kg)', rowSpan: hasSubHeader ? 2 : 1 });
  if (config.showMOQ) headRow1.push({ content: 'MOQ\n(pcs/lot)', rowSpan: hasSubHeader ? 2 : 1 });

  if (activeCostCols.length > 0) {
    headRow1.push({ content: `${getText('Tập hợp chi phí', 'Cost Breakdown')} (${currency}/cái)`, colSpan: activeCostCols.length });
  }

  headRow1.push({ content: getText('Đơn giá', 'Unit Price') + `\n(${currency})`, rowSpan: hasSubHeader ? 2 : 1 });

  if (showToolingPrice) headRow1.push({ content: getText('Tiền khuôn', 'Tooling price') + `\n(${currency}/Bộ)`, rowSpan: hasSubHeader ? 2 : 1 });
  if (showToolingUsage) headRow1.push({ content: getText('Tuổi thọ khuôn', 'Tooling usage') + '\n(Cái/bộ)', rowSpan: hasSubHeader ? 2 : 1 });

  const headRow2: any[] = [];
  if (activeCostCols.length > 0) {
    activeCostCols.forEach(col => {
      headRow2.push(getText(col.labelVi, col.labelEn));
    });
  }

  const head = headRow2.length > 0 ? [headRow1, headRow2] : [headRow1];

  const validItems = items.filter(item => item && item.quote);
  
  const body: any[][] = validItems.map((item, idx) => {
    const q = item.quote!;
    
    const inp = q.inputs_json as any;
    const res = q.results_json as any;
    const seg = q.segment;
    const weightChiKg = seg === 'casting' ? res.m_liquid : inp.m_chi;
    const weightPhoiKg = seg === 'casting' ? inp.m_cast : (res.m_phoi || inp.m_phoi);
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
      materialCostVnd = 0;
      formingCostVnd = (res.C_metal_casting ?? 0) + (res.C_ops_casting ?? 0) + (res.C_part_b_total ?? 0);
      machiningCostVnd = res.C_machining_casting ?? 0;
      heatTreatCostVnd = res.C_heat_treat ?? 0;
      paintCostVnd = res.C_paint ?? 0;
      dieAmortizedVnd = res.C_pattern_amortization_per_unit ?? 0;
      fallbackPrice = res.P_CASTING ?? 0;
    } else if (seg === 'sawing') {
      materialCostVnd = res.C_mat_sawing ?? 0;
      formingCostVnd = res.C_ops_sawing ?? 0;
      machiningCostVnd = res.C_machining ?? 0;
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

    const finalWeight = inp.m_tinh || weightPhoiKg || weightChiKg || 0;
    packageCostVnd = inp.DG_pack_kg !== undefined && inp.DG_pack_kg > 0 ? (inp.DG_pack_kg * finalWeight) : (inp.C_pack || 0);
    deliveryCostVnd = finalWeight * (inp.DG_trans_kg || 0);

    const unitPriceVnd = q.final_quoted_price ?? fallbackPrice;
    const sgaAndPVnd = unitPriceVnd - (materialCostVnd + formingCostVnd + machiningCostVnd + heatTreatCostVnd + paintCostVnd + packageCostVnd + deliveryCostVnd);

    const isSeparateTooling = (seg === 'forging' || seg === 'casting') && q.die_cost_treatment === 'separate';
    const toolingPriceVnd = seg === 'forging' ? inp.C_die_total : seg === 'casting' ? inp.C_pattern_total : 0;
    const toolingLife = seg === 'forging' ? inp.L_die_life : seg === 'casting' ? inp.L_pattern_life : 0;
    
    const quotedMoq = inp.quoted_moq;

    const materialName = inp.material_name || inp.selected_material_name || (inp.selected_material_id && !inp.selected_material_id.startsWith('mat-') ? inp.selected_material_id : null) || (q.segment === 'casting' ? 'FCD450-10' : 'S45C');

    const row: any[] = [
      idx + 1,
      q.rfqItem?.product_name || 'Chi tiết sản phẩm',
      q.rfqItem?.part_number || 'No PN',
      materialName
    ];

    if (config.showWeightChi) row.push(weightChiKg ? Number(weightChiKg).toFixed(2) : '-');
    if (config.showWeightPhoi) row.push(weightPhoiKg ? Number(weightPhoiKg).toFixed(2) : '-');
    if (config.showWeightTinh) row.push(weightTinhKg ? Number(weightTinhKg).toFixed(2) : '-');
    if (config.showMOQ) row.push(quotedMoq ? quotedMoq.toLocaleString('vi-VN') : '-');

    if (config.showMaterialCost) row.push(formatNum(materialCostVnd));
    if (config.showFormingCost) row.push(formatNum(formingCostVnd));
    if (config.showMachiningCost) row.push(formatNum(machiningCostVnd));
    if (config.showHeatTreatCost) row.push(formatNum(heatTreatCostVnd));
    if (config.showPaintCost) row.push(formatNum(paintCostVnd));
    if (showDieAmortizedCost) row.push((seg === 'forging' || seg === 'casting') ? (q.die_cost_treatment === 'amortized' ? formatNum(dieAmortizedVnd) : '-') : '');
    if (config.showPackageCost) row.push(formatNum(packageCostVnd));
    if (config.showDeliveryCost) row.push(formatNum(deliveryCostVnd));
    if (config.showSgaP) row.push(formatNum(sgaAndPVnd));

    row.push(formatNum(unitPriceVnd));

    if (showToolingPrice) {
      row.push(isSeparateTooling ? formatNum(toolingPriceVnd || 0) : "-");
    }
    if (showToolingUsage) {
      row.push(isSeparateTooling ? (toolingLife || 0).toLocaleString('vi-VN') : "-");
    }

    return row;
  });

  autoTable(doc, {
    startY: currentY,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 7,
      cellPadding: 1,
      textColor: [17, 17, 17],
      lineColor: [0, 0, 0],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 17, 17],
      halign: 'center',
      valign: 'middle',
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'left' },
      2: { halign: 'left' }
    },
    bodyStyles: {
      valign: 'middle',
      halign: 'center'
    },
    margin: { left: margin, right: margin, bottom: 25 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;
  
  // Remarks
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = margin;
  }
  
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text(lang === 'vi' ? 'GHI CHÚ :' : lang === 'en' ? 'NOTES :' : 'GHI CHÚ / NOTES :', margin, currentY);
  currentY += 5;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  
  config.remarks.forEach((r, i) => {
    const content = lang === 'vi' ? r.vi : lang === 'en' ? r.en : `${r.vi} ${r.en ? `(${r.en})` : ''}`;
    const textLines = doc.splitTextToSize(`${i + 1}. ${content}`, pageWidth - margin * 2);
    
    if (currentY + textLines.length * 4 > pageHeight - 40) {
        doc.addPage();
        currentY = margin;
    }
    
    doc.text(textLines, margin, currentY);
    currentY += textLines.length * 4;
  });

  // Signature Block
  currentY += 15;
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.text(lang === 'vi' ? 'XÁC NHẬN CỦA KHÁCH HÀNG' : 'CUSTOMER CONFIRMATION', pageWidth * 0.25, currentY, { align: 'center' });
  const footerCompanyName = lang === 'vi' ? 'CÔNG TY TNHH MTV DIESEL SÔNG CÔNG' : 'SONGCONG DIESEL LTD,. CO';
  doc.text(footerCompanyName, pageWidth * 0.75, currentY, { align: 'center' });
  
  // Footer ISO on ALL pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'italic');
    doc.setFontSize(8);
    // Left: Ma hieu + Ban hanh lan
    doc.text(DOCUMENT_FORM_CODE, margin, pageHeight - 11);
    doc.text(DOCUMENT_REVISION_NO, margin, pageHeight - 7);
    // Center: Ngay ban hanh
    doc.text(DOCUMENT_ISSUE_DATE, pageWidth / 2, pageHeight - 11, { align: 'center' });
    // Right: Trang i/totalPages
    doc.text(`Trang ${i}/${totalPages}`, pageWidth - margin, pageHeight - 11, { align: 'right' });
  }

  const filename = generatePdfFilename(document.customer_name, document.id, document.document_code);
  doc.save(filename);
}
