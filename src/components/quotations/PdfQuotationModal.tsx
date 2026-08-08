import type { QuotationDocument } from '../../types/quotation-document';
import { Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
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
      size="full"
      maxWidthClass="max-w-[98vw] max-h-[96vh]"
      title="Xem Trước Thư Báo Giá DISOCO (PDF Quotation Preview)"
      subtitle={`#${document.id.substring(0, 8)}`}
      headerExtra={
        <ActionButton
          onClick={handlePrint}
          variant="primary"
          icon={Printer}
          label="In / Tải PDF"
          className="mr-2"
        />
      }
    >
      <QuotationPdfContent document={document} />
    </Modal>
  );
};
