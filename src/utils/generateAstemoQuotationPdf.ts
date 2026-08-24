import type { QuotationDocument, DocumentDisplayConfig } from "../types/quotation-document";

export const generateAstemoQuotationPdf = async (
  document: QuotationDocument,
  _config?: DocumentDisplayConfig,
  _materialsMap?: Map<string, string>,
  _gradesMap?: Map<string, string>
) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pages = window.document.querySelectorAll('.astemo-pdf-page');

  if (!pages || pages.length === 0) {
    throw new Error("Không tìm thấy nội dung bản xem trước. Hãy đảm bảo bạn đang mở mẫu Astemo.");
  }

  for (let i = 0; i < pages.length; i++) {
    const pageElement = pages[i] as HTMLElement;

    // Use html2canvas to render the element to a canvas
    const canvas = await html2canvas(pageElement, {
      scale: 2, // higher resolution
      useCORS: true,
      logging: false,
    });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Calculate dimensions
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfPageHeight = doc.internal.pageSize.getHeight();
    const totalPdfHeight = (canvas.height * pdfWidth) / canvas.width;

    if (i > 0) {
      doc.addPage();
    }

    let heightLeft = totalPdfHeight;
    let position = 0;

    doc.addImage(imgData, "JPEG", 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfPageHeight;

    while (heightLeft > 0) {
      position = position - pdfPageHeight;
      doc.addPage();
      doc.addImage(imgData, "JPEG", 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfPageHeight;
    }
  }

  // Save the PDF
  const filename = document.document_code || `Quotation_${document.customer_name}`;
  doc.save(`${filename}.pdf`);
};
