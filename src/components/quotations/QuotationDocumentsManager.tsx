import { useState, useEffect } from 'react';
import type { QuotationDocument } from '../../types/quotation-document';
import { fetchQuotationDocuments } from '../../lib/quotation-document-service';
import { DocumentDetailModal } from './DocumentDetailModal';
import { exportDocumentToExcel } from '../../utils/excel-generator';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { formatDate } from '../../lib/format-date';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import {
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  AlertTriangle,
  X,
} from 'lucide-react';

export const QuotationDocumentsManager = () => {
  const [documents, setDocuments] = useState<QuotationDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<QuotationDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

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

  const filteredDocs = searchQuery.trim()
    ? documents.filter(
        (doc) =>
          doc.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

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
      label: 'Xem Chi Tiết Văn Bản',
      icon: <Eye className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => setSelectedDoc(selectedRows[0]),
    },
    {
      key: 'export_pdf',
      label: 'Xuất PDF Thư Báo Giá',
      icon: <Download className="w-3.5 h-3.5 text-red-600" />,
      variant: 'secondary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => setSelectedDoc(selectedRows[0]),
    },
    {
      key: 'export_excel',
      label: 'Xuất Excel (.xlsx)',
      icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" />,
      variant: 'secondary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => exportDocumentToExcel(selectedRows[0]),
    },
  ];

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

      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111111] tracking-tight">
            Danh Sách Văn Bản Báo Giá Gộp (Quotation Documents)
          </h2>
          <p className="text-xs text-[#787774]">
            Tích chọn văn bản báo giá trên bảng để xem chi tiết sản phẩm, xuất thư PDF chuẩn DISOCO hoặc xuất Excel bóc tách
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên khách hàng, người nhận Attn..."
            className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>

        <span className="text-xs text-[#787774] font-medium hidden sm:inline">
          Tổng số: <strong>{filteredDocs.length}</strong> văn bản
        </span>
      </div>

      {/* Shared Reusable DataTable */}
      <DataTable
        tableName="quotation_documents_table"
        data={filteredDocs}
        columns={columns}
        keyExtractor={(doc) => doc.id}
        toolbarActions={toolbarActions}
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
    </div>
  );
};
