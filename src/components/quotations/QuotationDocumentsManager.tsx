import { useState, useEffect } from 'react';
import type { QuotationDocument } from '../../types/quotation-document';
import { fetchQuotationDocuments, updateDocumentDisplayConfig } from '../../lib/quotation-document-service';
import { DocumentDetailModal } from './DocumentDetailModal';
import { QuotationPreviewPanel } from './QuotationPreviewPanel';
import { Modal } from '../ui/Modal';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { formatDate } from '../../lib/format-date';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import {
  Download,
  Eye,
  Search,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createRepricingRfqFromDocument } from '../../lib/repricing-service';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';

export const QuotationDocumentsManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [documents, setDocuments] = useState<QuotationDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRepricing, setIsRepricing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<QuotationDocument | null>(null);
  const [pdfPreviewDoc, setPdfPreviewDoc] = useState<QuotationDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const [showVoided, setShowVoided] = useState<boolean>(false);

  const loadDocuments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchQuotationDocuments();
      setDocuments(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải danh sách văn bản báo giá.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents
    .filter((doc) => showVoided || doc.status !== 'VOIDED')
    .filter((doc) => {
      if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          doc.customer_name.toLowerCase().includes(q) ||
          doc.contact_person.toLowerCase().includes(q) ||
          doc.id.toLowerCase().includes(q) ||
          (doc.document_code || '').toLowerCase().includes(q) ||
          (doc.rfq_code || '').toLowerCase().includes(q)
        );
      });

  // Tính tóm tắt trạng thái các dòng bên trong (VD: "3 SENT, 1 SUCCESSFUL")
  const getStatusSummary = (doc: QuotationDocument): string => {
    if (!doc.items || doc.items.length === 0) return 'Chưa có dòng sản phẩm';

    const counts: Record<string, number> = {};
    doc.items.forEach((item) => {
      const st = item.quote?.rfqItem?.status || item.quote?.status || 'IN_COSTING';
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([st, count]) => `${count} ${st}`)
      .join(', ');
  };

  // DataTable Column Definitions
  const columns: DataTableColumn<QuotationDocument>[] = [
    {
      key: 'document_code',
      header: 'Mã Báo Giá',
      sortable: true,
      className: 'font-mono font-bold text-[#111111]',
      render: (doc) => doc.document_code || <span className="text-[#787774] italic">N/A</span>,
    },
    {
      key: 'rfq_code',
      header: 'Mã RFQ',
      sortable: true,
      className: 'font-mono text-[#787774]',
      render: (doc) => doc.rfq_code || '-',
    },
    {
      key: 'customer_name',
      header: 'Tên Khách Hàng',
      sortable: true,
      render: (doc) => <span className="font-bold text-[#111111]">{doc.customer_name}</span>,
    },
    {
      key: 'contact_person',
      header: 'Người Nhận (Attn)',
      sortable: true,
      render: (doc) => <span className="font-medium text-[#2F3437]">{doc.contact_person || 'N/A'}</span>,
    },
    {
      key: 'quotation_date',
      header: 'Ngày Báo Giá',
      sortable: true,
      className: 'font-mono text-[11px] text-[#787774]',
      render: (doc) => formatDate(doc.quotation_date),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      sortable: true,
      render: (doc) => (
        doc.status === 'VOIDED' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 line-through">
            Đã thu hồi
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDF3EC] text-[#346538]">
            Đang hiệu lực
          </span>
        )
      ),
    },
    {
      key: 'items_count',
      header: 'Số Dòng Sản Phẩm',
      sortable: true,
      sortValue: (doc) => doc.items?.length || 0,
      className: 'text-center font-mono font-bold',
      render: (doc) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#F0F0EE] text-[#111111] text-xs">
          {doc.items?.length || 0} sản phẩm
        </span>
      ),
    },
    {
      key: 'status_summary',
      header: 'Tóm Tắt Trạng Thái',
      render: (doc) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E1F3FE] text-[#1F6C9F] border border-[#BDE3FD] font-mono">
          {getStatusSummary(doc)}
        </span>
      ),
    },
    {
      key: 'total_value',
      header: 'Tổng Giá Trị',
      sortable: true,
      sortValue: (doc) =>
        doc.items?.reduce((sum, it) => sum + (it.quote?.final_quoted_price || 0), 0) || 0,
      className: 'text-right font-mono font-extrabold text-sm text-[#111111]',
      render: (doc) => {
        const totalVnd =
          doc.items?.reduce((sum, it) => sum + (it.quote?.final_quoted_price || 0), 0) || 0;
        return formatCurrencyValue(totalVnd, doc.currency || 'VND', doc.exchange_rate || 1);
      },
    },
  ];

  // DataTable Actions
  const toolbarActions: DataTableAction<QuotationDocument>[] = [
    {
      key: 'view_detail',
      label: 'Xem chi tiết',
      icon: <Eye className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => setSelectedDoc(selectedRows[0]),
    },
    {
      key: 'reprice',
      label: 'Cập Nhật Báo Giá',
      icon: <RefreshCw className={`w-3.5 h-3.5 ${isRepricing ? 'animate-spin' : ''}`} />,
      variant: 'neutral',
      enabled: (count, selectedRows) => {
        if (count !== 1) return false;
        const doc = selectedRows[0];
        if (doc.status !== 'ACTIVE') return false;
        if (!doc.items || doc.items.length === 0) return false;
        return doc.items.every(
          (it) => (it.quote?.rfqItem?.status || it.quote?.status) === 'SUCCESSFUL'
        );
      },
      onClick: async (selectedRows) => {
        const doc = selectedRows[0];
        const numItems = doc.items?.length || 0;
        
        const confirmed = await confirm({
          title: 'Xác Nhận Tái Báo Giá',
          message: `Sẽ tạo 1 RFQ mới với đầy đủ ${numItems} dòng sản phẩm giống văn bản ${doc.document_code}, giữ nguyên toàn bộ thông số & giá cũ (bạn có thể sửa lại từng dòng ở bước Tính Giá).\n\nVăn bản ${doc.document_code} và đơn hàng cũ KHÔNG bị thay đổi gì.\n\nLƯU Ý: Khi gộp báo giá mới, bắt buộc phải gộp ĐỦ cả ${numItems} dòng, không được gộp thiếu.\n\nXác nhận tiến hành cập nhật báo giá?`,
          confirmLabel: 'Tiến Hành Cập Nhật',
          variant: 'default',
        });
        
        if (!confirmed) {
          return;
        }

        try {
          setIsRepricing(true);
          const { newRfq } = await createRepricingRfqFromDocument(doc, user?.email || 'sales@disoco.vn');
          navigate(`/quotations?stage=internal`, { state: { prefillSearch: newRfq.rfq_code } });
        } catch (error: any) {
          console.error(error);
          toast.error(error.message || 'Có lỗi xảy ra khi tạo RFQ tái báo giá.');
        } finally {
          setIsRepricing(false);
        }
      },
    },
  ];

  const filterContent = (
    <div className="flex items-center gap-3">
      <div className="relative w-full max-w-sm flex-1">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo Mã RFQ, Mã Báo Giá, khách hàng..."
          className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
        />
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium text-[#111111] bg-slate-50 px-2.5 py-1.5 rounded-[6px] border border-[#EAEAEA] hover:bg-slate-100 select-none">
          <input
            type="checkbox"
            checked={showVoided}
            onChange={() => setShowVoided(!showVoided)}
            className="rounded text-[#0F172A] focus:ring-0 cursor-pointer"
          />
          <span className="font-bold text-[11px] text-slate-700">Hiện đã thu hồi</span>
        </label>
        <span className="text-[11px] text-[#787774] font-medium hidden sm:inline whitespace-nowrap">
          Tổng số: <strong>{filteredDocs.length}</strong> văn bản
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[8px] text-sm font-medium flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Shared Reusable DataTable */}
      <DataTable
        tableName="quotation_documents_table"
        data={filteredDocs}
        columns={columns}
        keyExtractor={(doc) => doc.id}
        toolbarActions={toolbarActions}
        toolbarLeftContent={filterContent}
        selectedIds={selectedDocIds}
        onSelectionChange={(ids) => setSelectedDocIds(ids)}
        onRowClick={(doc) => setSelectedDoc(doc)}
        loading={loading}
        emptyMessage="Chưa có văn bản báo giá gộp nào. Hãy vào tab 'Quản Lý RFQ/Báo Giá', chọn các dòng Quote và bấm 'Gộp thành Văn bản Báo giá'."
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onRefresh={loadDocuments}
      />

      {/* Direct PDF Preview Modal */}
      {pdfPreviewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setPdfPreviewDoc(null)}
          size="full"
          maxWidthClass="max-w-[98vw] max-h-[96vh]"
          icon={<Download className="w-4 h-4" />}
          title="Xem Trước & Tải Thư Báo Giá PDF DISOCO"
          subtitle={`${pdfPreviewDoc.document_code || `Văn bản #${pdfPreviewDoc.id.substring(0, 10)}`} - ${pdfPreviewDoc.customer_name}`}
        >
          <QuotationPreviewPanel
            document={pdfPreviewDoc}
            readOnly={true}
            onBack={() => setPdfPreviewDoc(null)}
            onSaveAndSend={async (newConfig) => {
              await updateDocumentDisplayConfig(pdfPreviewDoc.id, newConfig);
              setPdfPreviewDoc(null);
              loadDocuments();
            }}
          />
        </Modal>
      )}
    </div>
  );
};
