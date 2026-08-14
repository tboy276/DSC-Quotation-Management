import { useState, useEffect, useMemo } from 'react';
import type { QuoteRecord } from '../../types/quote';
import type { QuotationDocument, DocumentDisplayConfig } from '../../types/quotation-document';
import { DEFAULT_DISPLAY_CONFIG } from '../../types/quotation-document';
import { createQuotationDocument, DEFAULT_PAYMENT_TERMS, DEFAULT_DELIVERY_NOTES } from '../../lib/quotation-document-service';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { QuotationPreviewPanel } from './QuotationPreviewPanel';
import type { DocFields } from './QuotationPreviewPanel';
import { FileText, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CreateDocumentModalProps {
  selectedQuotes: QuoteRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDocumentModal = ({
  selectedQuotes,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) => {
  const { profile, user } = useAuth();
  const currentUserEmail = profile?.email || user?.email || '';

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState<boolean>(false);
  const [finalConfig, setFinalConfig] = useState<DocumentDisplayConfig | undefined>(undefined);
  const [finalDocFields, setFinalDocFields] = useState<DocFields | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sourceDocumentCode, setSourceDocumentCode] = useState<string | null>(null);

  // Fallback defaults
  const firstQuote = selectedQuotes[0];
  const [isLoadingSource, setIsLoadingSource] = useState<boolean>(!!firstQuote?.rfq?.source_document_id);

  useEffect(() => {
    const fetchSourceDocCode = async () => {
      const sourceDocumentId = firstQuote?.rfq?.source_document_id;
      if (sourceDocumentId) {
        setIsLoadingSource(true);
        const { data } = await supabase
          .from('quotation_documents')
          .select('document_code')
          .eq('id', sourceDocumentId)
          .maybeSingle();
        if (data?.document_code) {
          setSourceDocumentCode(data.document_code);
        }
        setIsLoadingSource(false);
      } else {
        setIsLoadingSource(false);
      }
    };
    fetchSourceDocCode();
  }, [firstQuote?.rfq?.source_document_id]);

  const initialConfig = useMemo(() => {
    if (!sourceDocumentCode) return undefined;
    return {
      ...DEFAULT_DISPLAY_CONFIG,
      remarks: [
        {
          id: 'remark-repricing-auto',
          vi: `Báo giá này cập nhật/thay thế cho báo giá số ${sourceDocumentCode}.`,
          en: `This quotation updates/replaces quotation No. ${sourceDocumentCode}.`,
        },
        ...DEFAULT_DISPLAY_CONFIG.remarks,
      ],
    };
  }, [sourceDocumentCode]);

  const rfqCode = firstQuote?.rfq?.rfq_code || '';
  const customerName = firstQuote?.rfq?.customer_name || 'Khách hàng DISOCO';
  const tradeTerms = firstQuote?.rfq?.trade_terms || 'EXW';
  const contactPerson = firstQuote?.rfq?.customer_contact_person || 'Mr. Attn (Phòng Mua Hàng)';

  const tempDocument: QuotationDocument = {
    id: 'temp-doc',
    document_code: `BG-${rfqCode}-rev-XX`,
    rfq_code: rfqCode,
    customer_name: customerName,
    contact_person: contactPerson,
    quotation_date: new Date().toISOString().slice(0, 10),
    trade_terms: tradeTerms,
    currency: 'VND',
    exchange_rate: 1,
    payment_terms: DEFAULT_PAYMENT_TERMS,
    delivery_notes: DEFAULT_DELIVERY_NOTES,
    created_at: new Date().toISOString(),
    created_by: currentUserEmail,
    items: selectedQuotes.map((q, idx) => ({
      id: `preview-item-${idx}`,
      quotation_document_id: 'temp-doc',
      quote_id: q.id,
      display_order: idx + 1,
      created_at: new Date().toISOString(),
      quote: q,
      rfq_item: q.rfqItem,
    })),
  };

  const handlePreviewSubmitRequest = (config: DocumentDisplayConfig, docFields?: DocFields) => {
    if (!docFields) return;
    setFinalConfig(config);
    setFinalDocFields(docFields);
    setShowConfirmSendDialog(true);
  };

  const handleConfirmFinalSubmit = async () => {
    if (!finalConfig || !finalDocFields || selectedQuotes.length === 0) return;
    
    // Validate required fields
    if (!finalDocFields.contact_person.trim() || !finalDocFields.quotation_date) {
      setErrorMsg('Vui lòng điền đầy đủ Attn và Ngày lập văn bản trước khi gửi.');
      setShowConfirmSendDialog(false);
      return;
    }
    
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await createQuotationDocument({
        rfq_code: rfqCode,
        customer_name: customerName,
        contact_person: finalDocFields.contact_person,
        quotation_date: finalDocFields.quotation_date,
        trade_terms: finalDocFields.trade_terms,
        currency: finalDocFields.currency,
        exchange_rate: finalDocFields.exchange_rate,
        payment_terms: DEFAULT_PAYMENT_TERMS,
        delivery_notes: DEFAULT_DELIVERY_NOTES,
        display_config: finalConfig,
        selected_quote_ids: selectedQuotes.map((q) => q.id),
      });

      setShowConfirmSendDialog(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi khi tạo và lưu văn bản báo giá.');
      setShowConfirmSendDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        size="full"
        title={`Văn Bản Báo Giá Gộp - RFQ [${rfqCode}]`}
      >
        <div className="flex flex-col h-full bg-white relative">
          {errorMsg && (
            <div className="absolute top-0 left-0 w-full p-2 bg-red-100 text-red-800 text-xs text-center z-50 font-bold border-b border-red-200">
              {errorMsg}
            </div>
          )}
          {isLoadingSource ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-sm text-gray-500 font-medium">Đang tải dữ liệu liên kết...</span>
            </div>
          ) : (
            <QuotationPreviewPanel
              document={tempDocument}
              initialConfig={initialConfig}
              onBack={onClose}
              onSaveAndSend={handlePreviewSubmitRequest}
              isSubmitting={submitting}
            />
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog before Final Sending */}
      <Modal
        isOpen={showConfirmSendDialog}
        onClose={() => setShowConfirmSendDialog(false)}
        size="sm"
        icon={<FileText className="w-5 h-5 text-[#111111]" />}
        title="Xác Nhận Gửi Báo Giá Cho Khách Hàng"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowConfirmSendDialog(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmFinalSubmit}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer disabled:opacity-40"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? 'Đang Phát Hành...' : 'Xác Nhận & Gửi Ngay'}</span>
            </button>
          </>
        }
      >
        <p className="text-xs text-[#787774] leading-relaxed">
          Bạn có chắc chắn muốn phát hành Văn Bản Báo Giá cho khách hàng <strong>"{customerName}"</strong> gồm <strong>{selectedQuotes.length} mã sản phẩm</strong>?
          <br />
          <span className="text-[#346538] font-bold block mt-1">
            ✓ Tất cả mã sản phẩm trong văn bản sẽ được chuyển sang trạng thái QUOTED_SENT và lưu ngày gửi quoted_sent_at.
          </span>
        </p>
      </Modal>
    </>
  );
};
