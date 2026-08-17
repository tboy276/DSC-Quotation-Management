import { useState, useEffect } from 'react';
import type { QuotationDocument, QuotationDocumentItem } from '../../types/quotation-document';
import type { UnifiedRfqStatus } from '../../types/quote';
import { updateDocumentItemsOrder, updateDocumentDisplayConfig, voidQuotationDocument } from '../../lib/quotation-document-service';
import { updateQuoteStatus } from '../../lib/quotation-service';
import { exportDocumentToExcel } from '../../utils/excel-generator';
import { QuoteStatusBadge } from '../rfq/QuoteStatusBadge';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { formatDate } from '../../lib/format-date';
import { useToast } from '../../context/ToastContext';
import { QuotationPreviewPanel } from './QuotationPreviewPanel';
import { canManageRecord } from '../../lib/permission-utils';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmDialogContext';
import {
  FileText,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Download,
  RotateCcw,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: QuotationDocument | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailModal = ({
  document,
  onClose,
  onRefresh,
}: DocumentDetailModalProps) => {
  if (!document) return null;

  const { profile, user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState<QuotationDocumentItem[]>([]);
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);

  const currentUserEmail = profile?.email || user?.email || '';

  const canManageDocument = canManageRecord(profile, currentUserEmail, document);

  useEffect(() => {
    if (document.items) {
      setItems([...document.items].sort((a, b) => a.display_order - b.display_order));
    }
  }, [document]);

  // Di chuyển dòng sản phẩm Lên / Xuống
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);
    await updateDocumentItemsOrder(document.id, newItems);
    onRefresh();
  };

  // Cập nhật trạng thái từng dòng sản phẩm (SUCCESSFUL / CANCELLED_AFTER_QUOTE)
  const handleItemStatusChange = async (quoteId: string, newStatus: UnifiedRfqStatus) => {
    await updateQuoteStatus(quoteId, newStatus);

    setItems(
      items.map((it) =>
        it.quote_id === quoteId && it.quote
          ? { ...it, quote: { ...it.quote, status: newStatus } }
          : it
      )
    );
    onRefresh();
  };

  const currency = document.currency || 'VND';
  const exchangeRate = document.exchange_rate || 1;



  const handleVoidDocument = async () => {
    const confirmed = await confirm({
      title: 'Thu Hồi Văn Bản Báo Giá',
      message: `Toàn bộ ${items.length} dòng sản phẩm trong văn bản ${document.document_code} sẽ được đưa trở lại bước Tính Giá để chỉnh sửa. Văn bản hiện tại sẽ được đánh dấu Đã Thu Hồi và không thể hoàn tác. Bạn có chắc chắn?`,
      confirmLabel: 'Thu Hồi & Sửa Lại',
      variant: 'danger'
    });
    if (!confirmed) {
      return;
    }
    try {
      await voidQuotationDocument(document.id);
      toast.success('Thu hồi văn bản thành công!');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message || e}`);
    }
  };

  const isVoided = document.status === 'VOIDED';

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        size="2xl"
        icon={<FileText className="w-4 h-4" />}
        title={
          <div className="flex items-center space-x-2">
            <span>Chi Tiết Văn Bản Báo Giá {document.document_code || `#${document.id.substring(0, 10)}`}</span>
            {isVoided && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-black rounded-sm border border-slate-300 ml-2">
                ĐÃ THU HỒI
              </span>
            )}
          </div>
        }
        subtitle={`Mã RFQ: ${document.rfq_code || 'N/A'} | Khách hàng: ${document.customer_name} | Ngày lập: ${formatDate(document.quotation_date)}`}
        headerExtra={
          <div className="flex items-center space-x-2 mr-2">
            {!isVoided && canManageDocument && (
              <button
                onClick={handleVoidDocument}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-[6px] text-xs transition-colors cursor-pointer inline-flex items-center space-x-1 border border-red-200"
                title="Thu hồi văn bản để chỉnh sửa lại thông số báo giá"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
                <span>Thu hồi để sửa</span>
              </button>
            )}

            <button
              onClick={() => setShowCustomizeModal(true)}
              className="px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] text-xs transition-all cursor-pointer inline-flex items-center space-x-1 shadow-xs"
              title="Xem Trước & Tải PDF"
            >
              <Download className="w-3.5 h-3.5 text-sky-300 stroke-[2]" />
              <span>Xem Trước & Tải PDF</span>
            </button>

            <button
              onClick={async () => {
                try {
                  await exportDocumentToExcel(document);
                  toast.success('Xuất Excel thành công!');
                } catch (e) {
                  console.error(e);
                  toast.error('Lỗi xuất Excel');
                }
              }}
              className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-bold rounded-[6px] text-xs transition-colors cursor-pointer inline-flex items-center space-x-1 border border-[#EAEAEA]"
              title="Tải về file Excel multi-sheet bóc tách 5 section"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
              <span>Xuất Excel</span>
            </button>
          </div>
        }
        footer={
          <ActionButton
            variant="primary"
            onClick={onClose}
            label="Đóng Cửa Sổ"
          />
        }
      >
        <div className="space-y-5 text-xs text-[#111111]">
          {/* Thông Tin Văn Bản Báo Giá */}
          <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-3.5 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <span className="text-[#787774] block text-[10px]">Mã Báo Giá:</span>
                <strong className="font-mono text-[#111111]">{document.document_code || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[#787774] block text-[10px]">Mã RFQ Cha:</span>
                <strong className="font-mono text-[#111111]">{document.rfq_code || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[#787774] block text-[10px]">Người nhận (Attn):</span>
                <strong className="text-[#111111]">{document.contact_person || 'N/A'}</strong>
              </div>

              <div>
                <span className="text-[#787774] block text-[10px]">Incoterms / Trade Terms:</span>
                <strong className="font-mono text-[#111111]">{document.trade_terms || 'FOB'}</strong>
              </div>
              <div>
                <span className="text-[#787774] block text-[10px]">Tiền tệ / Tỷ giá:</span>
                <strong className="font-mono text-[#111111]">
                  {currency} {currency !== 'VND' && `(1 ${currency} = ${exchangeRate.toLocaleString('vi-VN')} VNĐ)`}
                </strong>
              </div>
            </div>
          </div>

          {/* Danh Sách Dòng Sản Phẩm Trong Văn Bản */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-1.5">
              <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                Danh Sách {items.length} Dòng Sản Phẩm / Part Numbers Trong Văn Bản
              </h4>
              <span className="text-[10px] text-[#787774] italic">
                Nút ↑/↓ để sắp xếp thứ tự hiển thị dòng
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const q = item.quote;
                if (!q) return null;

                const itemStatus = q.rfqItem?.status || q.status;

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-[#EAEAEA] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FBFBFA] transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Reorder Buttons Up/Down */}
                      {!isVoided && canManageDocument && (
                        <div className="flex flex-col space-y-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="p-0.5 rounded bg-[#F0F0EE] hover:bg-[#E0E0DE] disabled:opacity-30 cursor-pointer"
                            title="Di chuyển dòng lên"
                          >
                            <ArrowUp className="w-3 h-3 text-[#111111]" />
                          </button>
                          <button
                            type="button"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="p-0.5 rounded bg-[#F0F0EE] hover:bg-[#E0E0DE] disabled:opacity-30 cursor-pointer"
                            title="Di chuyển dòng xuống"
                          >
                            <ArrowDown className="w-3 h-3 text-[#111111]" />
                          </button>
                        </div>
                      )}

                      <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-bold text-[#111111] text-xs">
                          {q.rfqItem?.product_name || 'Chi tiết sản phẩm'} ({q.rfqItem?.part_number || 'No PN'})
                        </p>
                        <p className="text-[10px] text-[#787774]">
                          Sản lượng: {(q.rfqItem?.annual_volume || 0).toLocaleString('vi-VN')} Pcs/năm | Phân hệ: {q.segment === 'forging' ? 'Rèn Dập' : 'Đúc Gang'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 justify-between sm:justify-end">
                      <div className="text-right font-mono">
                        <p className="font-extrabold text-sm text-[#111111]">
                          {formatCurrencyValue(q.final_quoted_price, currency, exchangeRate)}
                        </p>
                      </div>

                      {/* Individual Item Status Badge */}
                      <QuoteStatusBadge status={itemStatus} size="sm" />

                      {/* Inline Status Toggle */}
                      {!isVoided && canManageDocument && (String(itemStatus) === 'QUOTED_SENT' || String(itemStatus) === 'SENT') && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleItemStatusChange(q.id, 'SUCCESSFUL')}
                            className="p-1 bg-[#EDF3EC] border border-[#C6E1C4] hover:bg-[#DDF0DC] text-[#346538] rounded cursor-pointer"
                            title="Đánh dấu Thành công (SUCCESSFUL)"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleItemStatusChange(q.id, 'CANCELLED_AFTER_QUOTE')}
                            className="p-1 bg-[#FDEBEC] border border-[#FADBDC] hover:bg-[#F8C9CA] text-[#9F2F2D] rounded cursor-pointer"
                            title="Đánh dấu Từ chối (CANCELLED_AFTER_QUOTE)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



        </div>
      </Modal>

      {showCustomizeModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCustomizeModal(false)}
          size="full"
          maxWidthClass="max-w-[98vw] max-h-[96vh]"
          icon={<Download className="w-4 h-4" />}
          title="Xem Trước & Tải Thư Báo Giá PDF DISOCO"
          subtitle={`Văn bản #${document.id.substring(0, 10)} - ${document.customer_name}`}
        >
          <QuotationPreviewPanel
            document={document}
            readOnly={true}
            onBack={() => setShowCustomizeModal(false)}
            onSaveAndSend={async (newConfig) => {
              await updateDocumentDisplayConfig(document.id, newConfig);
              setShowCustomizeModal(false);
              onRefresh();
            }}
          />
        </Modal>
      )}
    </>
  );
};
