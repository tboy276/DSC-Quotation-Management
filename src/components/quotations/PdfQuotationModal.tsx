import type { QuotationDocument } from '../../types/quotation-document';
import { Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { QuotationPdfContent } from './QuotationPdfContent';

interface PdfQuotationModalProps {
  document: QuotationDocument | null;
  onClose: () => void;
}

export const PdfQuotationModal = ({ document, onClose }: PdfQuotationModalProps) => {
  if (!document || !document.items) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="2xl"
      title="Xem Trước Thư Báo Giá DISOCO (PDF Quotation Preview)"
      subtitle={`#${document.id.substring(0, 8)}`}
      headerExtra={
        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[6px] transition-all cursor-pointer shadow-xs mr-2"
        >
          <Printer className="w-4 h-4" />
          <span>In / Tải PDF</span>
        </button>
      }
    >
      <QuotationPdfContent document={document} />
    </Modal>
  );
};
