import type { QuotationDocument } from "../types/quotation-document";
import { DISOCO_COMPANY_CONFIG } from "../config/company-config";
import { mapQuoteToDisplayCosts } from "../lib/quotation-cost-mapper";

export const generateAstemoQuotationPdf = async (
  document: QuotationDocument,
  materialsMap?: Map<string, string>,
  gradesMap?: Map<string, string>
) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const currency = document.currency || "VND";
  const validItems = [...(document.items || [])].sort((a, b) => a.display_order - b.display_order).filter(i => i.quote);

  validItems.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const q = item.quote!;
    const res = q.results_json as any;
    const inp = q.inputs_json as any;

    const idMap = q.segment === "casting" ? gradesMap : materialsMap;
    const resolvedId = q.segment === "casting" ? inp.selected_casting_grade_id : inp.selected_material_id;
    let materialName = (resolvedId && idMap?.get(resolvedId)) 
      || inp.material_name 
      || inp.selected_material_name 
      || (q.segment === "casting" ? "FCD450-10" : "S45C");

    const {
      weightChiKg, weightPhoiKg, weightTinhKg,
      materialCostVnd, formingCostVnd, machiningCostVnd,
      heatTreatCostVnd, paintCostVnd, packageCostVnd,
      deliveryCostVnd, dieAmortizedVnd, unitPriceVnd,
      sgaAndPVnd
    } = mapQuoteToDisplayCosts(q, res, inp);

    const breakdown = res.die_components_breakdown || [];

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION SHEET", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${document.quotation_date}`, 14, 30);
    doc.text(`To: ${document.customer_name}`, 14, 36);

    doc.text(DISOCO_COMPANY_CONFIG.name, 196, 30, { align: "right" });
    doc.text(DISOCO_COMPANY_CONFIG.address.substring(0, 50), 196, 36, { align: "right" });

    // Part Info Table
    autoTable(doc, {
      startY: 45,
      theme: "grid",
      head: [],
      body: [
        ["Part Name", q.rfqItem?.product_name || "", "Part No", q.rfqItem?.part_number || ""],
        ["Material", materialName, "Weight (Net/Gross)", `${Number(weightTinhKg || weightPhoiKg).toFixed(2)} / ${Number(weightChiKg).toFixed(2)} kg`]
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [240, 240, 240] },
        2: { fontStyle: "bold", fillColor: [240, 240, 240] }
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    
    // 1. Material Cost Breakdown
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Material Cost Breakdown", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      theme: "grid",
      head: [["Input Weight (g)", "Output Weight (g)", "Scrap Weight (g)", `Material Cost (${currency})`]],
      body: [
        [
          Math.round((Number(inp.m_chi) || 0) * 1000).toLocaleString("en-US"),
          Math.round((Number(inp.m_phoi) || 0) * 1000).toLocaleString("en-US"),
          Math.round((Number(res.m_bavia_forging) || 0) * 1000).toLocaleString("en-US"),
          Math.round(materialCostVnd).toLocaleString("en-US")
        ]
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240] }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 2. Processing Cost Breakdown

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. Processing Cost Breakdown", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      theme: "grid",
      head: [["Process", `Cost (${currency})`]],
      body: [
        ["Shearing", Math.round(res.C_cut || 0).toLocaleString("en-US")],
        ["Heating", Math.round(res.C_heat_induction || 0).toLocaleString("en-US")],
        ["Forging", Math.round(res.C_forging_op || 0).toLocaleString("en-US")],
        ["Shot Blast", Math.round(res.C_clean || 0).toLocaleString("en-US")],
        ["Machining (CNC)", Math.round(machiningCostVnd).toLocaleString("en-US")],
        [{ content: "Total Processing Cost", styles: { fontStyle: "bold", halign: "right" } }, { content: Math.round(formingCostVnd + machiningCostVnd).toLocaleString("en-US"), styles: { fontStyle: "bold" } }]
      ],
      styles: { fontSize: 10, cellPadding: 3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Tooling Amortization Breakdown
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. Tooling Amortization Breakdown", 14, currentY);

    const toolingBody = breakdown.length > 0 
      ? breakdown.map((b: any) => [
          b.name,
          Math.round(b.lineItemCost).toLocaleString("en-US"),
          Math.round(b.depreciationQty).toLocaleString("en-US"),
          Math.round(b.costPerUnit).toLocaleString("en-US")
        ])
      : [[{ content: "No tooling breakdown available", colSpan: 4, styles: { fontStyle: "italic", halign: "center" } }]];

    toolingBody.push([
      { content: "Total Tooling Amortization", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } },
      { content: Math.round(dieAmortizedVnd).toLocaleString("en-US"), styles: { fontStyle: "bold" } }
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      theme: "grid",
      head: [["Tool Name", `Cost (${currency})`, "Life (pcs)", `Amortization (${currency}/pc)`]],
      body: toolingBody as any,
      styles: { fontSize: 10, cellPadding: 3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 4. Agreed Cost
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. Agreed Cost", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      theme: "grid",
      head: [],
      body: [
        [{ content: "Material Cost", styles: { fontStyle: "bold" } }, Math.round(materialCostVnd).toLocaleString("en-US")],
        [{ content: "Processing Cost", styles: { fontStyle: "bold" } }, Math.round(formingCostVnd + machiningCostVnd).toLocaleString("en-US")],
        [{ content: "Treatment Cost (Heat/Paint)", styles: { fontStyle: "bold" } }, Math.round(heatTreatCostVnd + paintCostVnd).toLocaleString("en-US")],
        [{ content: "Tooling Amortization", styles: { fontStyle: "bold" } }, Math.round(dieAmortizedVnd).toLocaleString("en-US")],
        [{ content: "SGA & Profit", styles: { fontStyle: "bold" } }, Math.round(sgaAndPVnd).toLocaleString("en-US")],
        [{ content: "Delivery & Package", styles: { fontStyle: "bold" } }, Math.round(deliveryCostVnd + packageCostVnd).toLocaleString("en-US")],
        [{ content: "Unit Price", styles: { fontStyle: "bold", fillColor: [240, 240, 240], fontSize: 12 } }, { content: Math.round(unitPriceVnd).toLocaleString("en-US"), styles: { fontStyle: "bold", textColor: [255, 0, 0], fillColor: [240, 240, 240], fontSize: 12 } }]
      ],
      styles: { fontSize: 10, cellPadding: 3 }
    });
  });

  doc.save(`Quotation_${document.rfq_code || 'Astemo'}.pdf`);
  return doc;
};
