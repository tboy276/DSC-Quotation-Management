import { useState, useEffect } from 'react';
import type { QuoteRecord, UnifiedRfqStatus, QuotationFilterOptions } from '../../types/quote';
import { fetchQuotes, updateQuoteStatus } from '../../lib/quotation-service';
import { QuoteStatusBadge } from '../rfq/QuoteStatusBadge';
import { QuoteDetailModal } from '../rfq/QuoteDetailModal';
import { CreateDocumentModal } from './CreateDocumentModal';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Workflow,
  Box,
  Plus,
  AlertCircle,
  User,
  X,
  Check,
} from 'lucide-react';

export const QuotationsManager = () => {
  const { profile, user } = useAuth();
  const currentUserEmail = profile?.email || user?.email || '';
  const isEstimator = profile?.role === 'estimator';

  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Checkbox selection state
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [showCreateDocModal, setShowCreateDocModal] = useState<boolean>(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<UnifiedRfqStatus | 'ALL'>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<'forging' | 'casting' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Selected Quote for Detail Modal
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);

  // Cancel Modal State
  const [showCancelReasonModal, setShowCancelReasonModal] = useState<boolean>(false);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [quotesToCancel, setQuotesToCancel] = useState<QuoteRecord[]>([]);

  useEffect(() => {
    loadQuotes();
  }, [statusFilter, segmentFilter, searchQuery, fromDate, toDate]);

  const loadQuotes = async () => {
    setLoading(true);
    const filterOptions: QuotationFilterOptions = {
      status: statusFilter,
      segment: segmentFilter,
      searchQuery,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };

    const data = await fetchQuotes(filterOptions);
    setQuotes(data);
    setLoading(false);
  };

  // Helper check ownership permission (Sales can only edit/status-change their own RFQs)
  const canModifyQuote = (quote: QuoteRecord): boolean => {
    if (isEstimator) return true; // Estimator is admin
    if (!currentUserEmail) return true;
    const creatorEmail = quote.rfq?.created_by_email || quote.created_by_email;
    return creatorEmail === currentUserEmail;
  };

  // Status Change logic (SUCCESSFUL)
  const handleMarkSuccessful = async (selectedRows: QuoteRecord[]) => {
    for (const q of selectedRows) {
      if (canModifyQuote(q)) {
        await updateQuoteStatus(q.id, 'SUCCESSFUL');
      }
    }
    loadQuotes();
  };

  // Open Cancel Reason Modal
  const handleOpenCancelModal = (selectedRows: QuoteRecord[]) => {
    const validRows = selectedRows.filter((q) => canModifyQuote(q));
    if (validRows.length === 0) return;
    setQuotesToCancel(validRows);
    setCancelReasonText('');
    setShowCancelReasonModal(true);
  };

  // Submit Cancel Reason
  const handleConfirmCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReasonText.trim()) return;

    for (const q of quotesToCancel) {
      await updateQuoteStatus(q.id, 'CANCELLED', cancelReasonText.trim());
    }

    setShowCancelReasonModal(false);
    loadQuotes();
  };

  // Export Excel
  const handleExportExcel = () => {
    if (quotes.length === 0) return;

    const exportRows = quotes.map((q, idx) => {
      const cur = q.currency || 'VND';
      const rate = q.exchange_rate || 1;
      return {
        STT: idx + 1,
        'Mã Báo Giá': q.id,
        'Tên Khách Hàng': q.rfq?.customer_name || 'N/A',
        'Tên / Mã Sản Phẩm': q.rfq?.product_name || 'N/A',
        'Sản Lượng (Pcs/năm)': q.rfq?.annual_volume || 0,
        'Phân Hệ Công Nghệ': q.segment === 'forging' ? 'Rèn Dập' : 'Đúc Gang',
        'Điều Kiện Giao Hàng': q.rfq?.trade_terms || 'FOB',
        'Tiền Tệ': cur,
        'Tỷ Giá Quy Đổi': rate,
        'Target Price': formatCurrencyValue(q.rfq?.target_price || 0, cur, rate),
        'Đơn Giá Báo Giá': formatCurrencyValue(q.final_quoted_price || 0, cur, rate),
        'Đơn Giá Gốc (VNĐ)': Math.round(q.final_quoted_price || 0),
        'Trạng Thái RFQ': q.rfq?.status || q.status,
        'Lý Do Huỷ (nếu có)': q.cancel_reason || q.rfq?.cancel_reason || '',
        'Người Tạo (Sales/Estimator)': q.rfq?.created_by_email || q.created_by_email || 'N/A',
        'Ngày Tạo': new Date(q.created_at).toLocaleDateString('vi-VN'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Báo Giá DISOCO');

    const fileName = `Danh_Sach_Bao_Gia_DISOCO_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const selectedQuoteObjects = quotes.filter((q) => selectedQuoteIds.includes(q.id));

  // Validate group request: check if all selected quotes belong to the same segment
  const handleGroupRequest = (selectedRows: QuoteRecord[]) => {
    setSelectionError(null);
    if (selectedRows.length === 0) return;

    const firstSeg = selectedRows[0].segment;
    const sameSeg = selectedRows.every((r) => r.segment === firstSeg);

    if (!sameSeg) {
      setSelectionError(
        'Chỉ có thể gộp các sản phẩm cùng phân hệ công nghệ (tất cả Rèn Dập hoặc tất cả Đúc Gang)!'
      );
      return;
    }

    setShowCreateDocModal(true);
  };

  // DataTable Column Definitions
  const columns: DataTableColumn<QuoteRecord>[] = [
    {
      key: 'customer_name',
      header: 'Tên Khách Hàng',
      sortable: true,
      sortValue: (q) => q.rfq?.customer_name || '',
      render: (q) => <span className="font-bold text-[#111111]">{q.rfq?.customer_name || 'N/A'}</span>,
    },
    {
      key: 'product_name',
      header: 'Sản Phẩm / Mã Bản Vẽ',
      sortable: true,
      sortValue: (q) => q.rfq?.product_name || '',
      render: (q) => <span className="font-medium text-[#2F3437]">{q.rfq?.product_name || 'N/A'}</span>,
    },
    {
      key: 'segment',
      header: 'Phân Hệ',
      sortable: true,
      render: (q) =>
        q.segment === 'forging' ? (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Workflow className="w-3 h-3" />
            <span>Rèn Dập</span>
          </span>
        ) : (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Box className="w-3 h-3" />
            <span>Đúc Gang</span>
          </span>
        ),
    },
    {
      key: 'created_by',
      header: 'Người Tạo',
      sortable: true,
      sortValue: (q) => q.rfq?.created_by_email || '',
      render: (q) => (
        <span className="inline-flex items-center space-x-1 text-[11px] text-[#787774]">
          <User className="w-3 h-3 text-[#111111]" />
          <span>{q.rfq?.created_by_email || q.created_by_email || 'System'}</span>
        </span>
      ),
    },
    {
      key: 'final_quoted_price',
      header: 'Đơn Giá Báo Giá',
      sortable: true,
      className: 'text-right font-mono font-extrabold text-sm text-[#111111]',
      render: (q) =>
        q.status === 'CANCELLED' || q.rfq?.status === 'CANCELLED' ? (
          <span className="text-[#9F2F2D] italic text-xs">Đã huỷ RFQ</span>
        ) : (
          formatCurrencyValue(q.final_quoted_price, q.currency || 'VND', q.exchange_rate || 1)
        ),
    },
    {
      key: 'status',
      header: 'Trạng Thái RFQ',
      sortable: true,
      render: (q) => <QuoteStatusBadge status={q.rfq?.status || q.status} size="sm" />,
    },
  ];

  // DataTable Top Toolbar Actions
  const toolbarActions: DataTableAction<QuoteRecord>[] = [
    {
      key: 'view_detail',
      label: 'Xem Chi Tiết Báo Giá',
      icon: <Eye className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => setSelectedQuote(selectedRows[0]),
    },
    {
      key: 'group_document',
      label: '+ Gộp Thành Văn Bản Báo Giá',
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: 'success',
      enabled: (count) => count >= 1,
      onClick: (selectedRows) => handleGroupRequest(selectedRows),
    },
    {
      key: 'approve',
      label: 'Thành Công (SUCCESSFUL)',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      variant: 'success',
      enabled: (count, selectedRows) =>
        count >= 1 && selectedRows.every((r) => canModifyQuote(r) && (r.rfq?.status === 'SENT' || r.status === 'SENT')),
      onClick: (selectedRows) => handleMarkSuccessful(selectedRows),
    },
    {
      key: 'reject',
      label: 'Huỷ Bỏ (CANCELLED)',
      icon: <XCircle className="w-3.5 h-3.5" />,
      variant: 'danger',
      enabled: (count, selectedRows) =>
        count >= 1 && selectedRows.every((r) => canModifyQuote(r)),
      onClick: (selectedRows) => handleOpenCancelModal(selectedRows),
    },
    {
      key: 'export_excel',
      label: 'Xuất Excel (.xlsx)',
      icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 stroke-[2]" />,
      variant: 'secondary',
      enabled: () => quotes.length > 0,
      onClick: () => handleExportExcel(),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Info Banner */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111111] tracking-tight">
            Quản Lý Danh Sách RFQ & Báo Giá (Quotations Manager)
          </h2>
          <p className="text-xs text-[#787774]">
            {isEstimator
              ? 'Quyền Estimator: Bạn có toàn quyền quản lý, cập nhật trạng thái và xuất file báo giá.'
              : 'Quyền Sales: Bạn có quyền sửa/huỷ các RFQ do chính mình tạo. RFQ người khác chỉ xem.'}
          </p>
        </div>
      </div>

      {/* Selection Error Banner */}
      {selectionError && (
        <div className="p-3 rounded-[8px] bg-[#FDEBEC] border border-[#FADBDC] text-[#9F2F2D] text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{selectionError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search Text Input */}
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tìm Kiếm Khách Hàng / Sản Phẩm / Email
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên khách hàng, sản phẩm, email..."
                className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* Unified Status Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Lọc Trạng Thái RFQ
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="DRAFT">Đang Tính Toán (DRAFT)</option>
              <option value="SENT">Đã Gửi Khách (SENT)</option>
              <option value="SUCCESSFUL">Thành Công (SUCCESSFUL)</option>
              <option value="CANCELLED">Đã Huỷ Bỏ (CANCELLED)</option>
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Lọc Công Nghệ
            </label>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
            >
              <option value="ALL">Tất cả (Rèn + Đúc)</option>
              <option value="forging">Phân Hệ Rèn Dập</option>
              <option value="casting">Phân Hệ Đúc Gang</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Khoảng Ngày Tạo (Từ - Đến)
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111]"
              />
              <span className="text-[#787774]">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shared Reusable DataTable */}
      <DataTable
        data={quotes}
        columns={columns}
        keyExtractor={(q) => q.id}
        toolbarActions={toolbarActions}
        selectedIds={selectedQuoteIds}
        onSelectionChange={(ids) => setSelectedQuoteIds(ids)}
        onRowClick={(q) => setSelectedQuote(q)}
        loading={loading}
        emptyMessage="Không tìm thấy báo giá nào phù hợp với bộ lọc."
      />

      {/* Snapshot & Breakdown View Modal */}
      <QuoteDetailModal
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
      />

      {/* Group Quotes into Document Modal */}
      {showCreateDocModal && (
        <CreateDocumentModal
          selectedQuotes={selectedQuoteObjects}
          onClose={() => setShowCreateDocModal(false)}
          onSuccess={() => {
            setSelectedQuoteIds([]);
            loadQuotes();
          }}
        />
      )}

      {/* Modal Enter Cancellation Reason */}
      {showCancelReasonModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] shadow-xl max-w-md w-full p-5 space-y-4 text-xs text-[#111111]">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-[#9F2F2D]" />
                <h3 className="text-sm font-bold text-[#111111]">
                  Xác Nhận Huỷ RFQ ({quotesToCancel.length} dòng)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelReasonModal(false)}
                className="text-[#787774] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#9F2F2D] uppercase tracking-wider mb-1">
                  Nhập Lý Do Huỷ Bỏ (Bắt Bắt Nhập Text Tự Do) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Ví dụ: Khách hàng báo giá vượt target price, đối thủ cạnh tranh rẻ hơn 10%..."
                  className="w-full p-2.5 border border-[#FADBDC] bg-white rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#9F2F2D]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setShowCancelReasonModal(false)}
                  className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!cancelReasonText.trim()}
                  className="px-4 py-1.5 bg-[#9F2F2D] hover:bg-[#7F2321] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Huỷ RFQ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
