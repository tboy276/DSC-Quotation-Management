import { useState, useEffect, useMemo } from 'react';
import type {
  QuoteRecord,
  RfqItemStatus,
  QuotationFilterOptions,
  RfqItemRecord,
  QuantityUnitType,
  TechnologyRequirementType,
} from '../../types/quote';
import { fetchPaginatedQuotes, updateQuoteStatus, createRfqDossierWithItems, deleteRfqItems } from '../../lib/quotation-service';
import { Modal } from '../ui/Modal';
import { QuoteStatusBadge } from '../rfq/QuoteStatusBadge';
import { QuoteDetailModal } from '../rfq/QuoteDetailModal';
import { CreateDocumentModal } from './CreateDocumentModal';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { useAuth } from '../../context/AuthContext';
import { useQuotationStore } from '../../store/useQuotationStore';
import { parseStructuredRfqText } from '../../utils/rfq-parser';
import { formatDate } from '../../lib/format-date';
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
  X,
  Check,
  Calculator,
  Layers,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Columns,
  Settings,
  Clipboard,
} from 'lucide-react';

interface QuotationsManagerProps {
  onNavigateToCalculator?: (segment: 'forging' | 'casting') => void;
}

interface ColumnDef {
  key: string;
  header: string;
  defaultHidden?: boolean;
}

const ALL_ITEM_COLUMNS: ColumnDef[] = [
  // Mặc định HIỆN (theo đúng thứ tự):
  { key: 'item_code', header: 'Mã Dòng Sản Phẩm', defaultHidden: false },
  { key: 'customer_name', header: 'Tên Khách Hàng', defaultHidden: false },
  { key: 'product_name', header: 'Tên Sản Phẩm', defaultHidden: false },
  { key: 'part_number', header: 'Part Number', defaultHidden: false },
  { key: 'technology_requirement', header: 'Yêu Cầu Công Nghệ', defaultHidden: false },
  { key: 'status', header: 'Trạng Thái', defaultHidden: false },
  { key: 'final_quoted_price', header: 'Đơn Giá Báo Giá', defaultHidden: false },
  { key: 'annual_volume', header: 'Sản Lượng', defaultHidden: false },

  // Mặc định ẨN (bật lên được qua nút ẩn/hiện cột):
  { key: 'rfq_code', header: 'Mã Hồ Sơ RFQ', defaultHidden: true },
  { key: 'rfq_received_date', header: 'Ngày Nhận RFQ', defaultHidden: true },
  { key: 'customer_deadline', header: 'Deadline', defaultHidden: true },
  { key: 'trade_terms', header: 'Trade Term', defaultHidden: true },
  { key: 'customer_address', header: 'Địa Chỉ Khách Hàng', defaultHidden: true },
  { key: 'delivery_address', header: 'Địa Chỉ Giao Hàng', defaultHidden: true },
  { key: 'customer_contact_person', header: 'Người Gửi RFQ (Attn)', defaultHidden: true },
  { key: 'target_price', header: 'Target Price', defaultHidden: true },
  { key: 'created_by_email', header: 'Người Tạo', defaultHidden: true },
  { key: 'quoted_sent_at', header: 'Ngày Gửi Báo Giá', defaultHidden: true },
  { key: 'resolved_at', header: 'Ngày Có Kết Luận', defaultHidden: true },
  { key: 'notes', header: 'Ghi Chú', defaultHidden: true },
];

export const QuotationsManager = ({ onNavigateToCalculator }: QuotationsManagerProps) => {
  const { profile, user } = useAuth();
  const currentUserEmail = profile?.email || user?.email || '';
  const isEstimator = profile?.role === 'estimator';

  const setRfqField = useQuotationStore((state) => state.setRfqField);
  const setSegment = useQuotationStore((state) => state.setSegment);
  const setActiveRfqItemId = useQuotationStore((state) => state.setActiveRfqItemId);

  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection & Action state
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [showCreateDocModal, setShowCreateDocModal] = useState<boolean>(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Sorting State for Flat Table Columns
  const [sortCol, setSortCol] = useState<string>('rfq_received_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Single-Line Primary Filters State
  const [statusFilter, setStatusFilter] = useState<RfqItemStatus | 'ALL'>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<'forging' | 'casting' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Advanced Filters Popover State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Column Visibility State & localStorage Persistence
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rfq_flat_table_hidden_cols');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    return ALL_ITEM_COLUMNS.filter((c) => c.defaultHidden).map((c) => c.key);
  });

  const [showColMenu, setShowColMenu] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('rfq_flat_table_hidden_cols', JSON.stringify(hiddenCols));
    } catch (e) {
      // Ignore
    }
  }, [hiddenCols]);

  const toggleColumnHidden = (key: string) => {
    setHiddenCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const visibleCols = ALL_ITEM_COLUMNS.filter((c) => !hiddenCols.includes(c.key));

  // Server-side Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals State
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);
  const [showNewRfqModal, setShowNewRfqModal] = useState<boolean>(false);

  // Paste Structured Text Sub-Modal State
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteRawText, setPasteRawText] = useState<string>('');
  const [pasteWarnings, setPasteWarnings] = useState<string[]>([]);

  // Cancel Reason Modal State
  const [showCancelReasonModal, setShowCancelReasonModal] = useState<boolean>(false);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [itemToCancel, setItemToCancel] = useState<{ id: string; targetStatus: RfqItemStatus } | null>(null);

  // Expanded New RFQ Dossier Quick Entry Modal Form State
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>('');
  const [newRfqCode, setNewRfqCode] = useState<string>('');
  const [newCustomerContactPerson, setNewCustomerContactPerson] = useState<string>('');
  const [newRfqReceivedDate, setNewRfqReceivedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newCustomerDeadline, setNewCustomerDeadline] = useState<string>(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [newTradeTerms, setNewTradeTerms] = useState<'' | 'EXW' | 'FOB' | 'CIF' | 'DAP'>();
  const [newDeliveryAddress, setNewDeliveryAddress] = useState<string>('');
  const [newSpecialRequirements, setNewSpecialRequirements] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const [newMultiItems, setNewMultiItems] = useState<
    Array<{
      id: string;
      product_name: string;
      part_number: string;
      annual_volume: number;
      quantity_unit: QuantityUnitType;
      target_price: number;
      technology_requirement: TechnologyRequirementType;
    }>
  >([{
    id: '1',
    product_name: '',
    part_number: '',
    annual_volume: 0,
    quantity_unit: 'pcs/năm',
    target_price: 0,
    technology_requirement: 'Rèn+Gia công',
  }]);

  // Generate RFQ Code automatically on opening modal
  useEffect(() => {
    if (showNewRfqModal) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      // Format: YYYYMMDD-XXX — NO "RFQ-" prefix per Phase 10.5 spec
      const generatedCode = `${dateStr}-${String(totalCount + 1).padStart(3, '0')}`;
      setNewRfqCode(generatedCode);
    }
  }, [showNewRfqModal, totalCount]);

  useEffect(() => {
    loadQuotes();
  }, [statusFilter, segmentFilter, searchQuery, fromDate, toDate, currentPage, pageSize]);

  const loadQuotes = async () => {
    setLoading(true);
    const filterOptions: QuotationFilterOptions = {
      status: statusFilter,
      segment: segmentFilter,
      searchQuery,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: currentPage,
      pageSize,
    };

    const res = await fetchPaginatedQuotes(filterOptions);
    setQuotes(res.data);
    setTotalCount(res.totalCount);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  const canModifyQuote = (quote: QuoteRecord): boolean => {
    if (isEstimator) return true;
    if (!currentUserEmail) return true;
    const creatorEmail = quote.rfq?.created_by_email || quote.created_by_email;
    return creatorEmail === currentUserEmail;
  };

  // Flat Table Column Header Sort Handler
  const handleSortColumnClick = (key: string) => {
    if (sortCol === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDirection('asc');
    }
  };

  // Sort flat quotes array
  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      const getVal = (q: QuoteRecord) => {
        switch (sortCol) {
          case 'customer_name': return q.rfq?.customer_name || '';
          case 'product_name': return q.rfqItem?.product_name || '';
          case 'part_number': return q.rfqItem?.part_number || '';
          case 'technology_requirement': return q.rfqItem?.technology_requirement || '';
          case 'status': return q.rfqItem?.status || q.status;
          case 'final_quoted_price': return q.final_quoted_price || 0;
          case 'annual_volume': return q.rfqItem?.annual_volume || 0;
          case 'rfq_code': return q.rfq?.rfq_code || '';
          case 'rfq_received_date': return q.rfq?.rfq_received_date || '';
          case 'customer_deadline': return q.rfq?.customer_deadline || '';
          case 'trade_terms': return q.rfq?.trade_terms || '';
          case 'customer_address': return q.rfq?.customer_address || '';
          case 'delivery_address': return q.rfq?.delivery_address || '';
          case 'customer_contact_person': return q.rfq?.customer_contact_person || '';
          case 'quantity_unit': return q.rfqItem?.quantity_unit || '';
          case 'target_price': return q.rfqItem?.target_price || 0;
          case 'created_by_email': return q.rfq?.created_by_email || q.created_by_email || '';
          case 'quoted_sent_at': return q.rfqItem?.quoted_sent_at || '';
          case 'resolved_at': return q.rfqItem?.resolved_at || '';
          case 'notes': return q.rfq?.notes || '';
          default: return q.created_at;
        }
      };

      const valA = getVal(a);
      const valB = getVal(b);
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB), 'vi')
        : String(valB).localeCompare(String(valA), 'vi');
    });
  }, [quotes, sortCol, sortDirection]);

  // Selection state helper checks for Toolbar button enablement
  const selectedSingleQuote = selectedQuoteIds.length === 1
    ? quotes.find((q) => q.id === selectedQuoteIds[0])
    : null;

  const selectedItemStatus = selectedSingleQuote
    ? (selectedSingleQuote.rfqItem?.status || selectedSingleQuote.status)
    : null;

  const selectedTechRequirement = selectedSingleQuote?.rfqItem?.technology_requirement || 'Rèn+Gia công';
  const isSawedBilletTech = selectedTechRequirement === 'Phôi cưa' || selectedTechRequirement === 'Phôi cưa+Gia công';

  const canApproveFeasibility = selectedSingleQuote && selectedItemStatus === 'PENDING_REVIEW' && canModifyQuote(selectedSingleQuote);
  const canGoToCalculator = selectedSingleQuote && selectedItemStatus === 'IN_COSTING' && !isSawedBilletTech;
  const canMarkSentStatus = selectedSingleQuote && selectedItemStatus === 'QUOTED_SENT' && canModifyQuote(selectedSingleQuote);

  const handleDeleteSelectedItems = async () => {
    if (selectedQuoteIds.length === 0) return;
    const selectedQuotes = quotes.filter((q) => selectedQuoteIds.includes(q.id));
    const count = selectedQuotes.length;

    if (!window.confirm(`XÁC NHẬN XOÁ:\nBạn có chắc chắn muốn xóa (${count}) mã sản phẩm RFQ đã chọn khỏi cơ sở dữ liệu Supabase không?`)) {
      return;
    }

    try {
      const itemIds = selectedQuotes.map((q) => q.rfq_item_id);
      await deleteRfqItems(itemIds);
      setSelectedQuoteIds([]);
      loadQuotes();
    } catch (err: any) {
      alert(`❌ LỖI XOÁ DỮ LIỆU THẤT BẠI TRÊN SUPABASE:\n${err.message || err}`);
    }
  };

  const handleApproveFeasibility = async (quote: QuoteRecord) => {
    await updateQuoteStatus(quote.id, 'IN_COSTING');
    if (quote.rfq && !quote.rfq.technical_review_completed_at) {
      quote.rfq.technical_review_completed_at = new Date().toISOString();
    }
    loadQuotes();
  };

  const handleOpenItemCancelModal = (quote: QuoteRecord, targetStatus: RfqItemStatus) => {
    setItemToCancel({ id: quote.id, targetStatus });
    setCancelReasonText('');
    setShowCancelReasonModal(true);
  };

  const handleConfirmItemCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToCancel || !cancelReasonText.trim()) return;

    await updateQuoteStatus(itemToCancel.id, itemToCancel.targetStatus, cancelReasonText.trim());
    setShowCancelReasonModal(false);
    setItemToCancel(null);
    loadQuotes();
  };

  const handleGoToCalculator = (quote: QuoteRecord) => {
    if (isSawedBilletTech) return;

    setActiveRfqItemId(quote.rfq_item_id);
    const tech = quote.rfqItem?.technology_requirement || 'Rèn+Gia công';
    const targetSegment = tech.includes('Đúc') ? 'casting' : 'forging';

    setSegment(targetSegment);
    setRfqField('product_name', quote.rfqItem?.product_name || 'Sản phẩm mới');
    setRfqField('annual_volume', quote.rfqItem?.annual_volume || 10000);
    setRfqField('target_price', quote.rfqItem?.target_price || 0);

    if (onNavigateToCalculator) {
      onNavigateToCalculator(targetSegment);
    }
  };

  const handleMarkItemSuccessful = async (quote: QuoteRecord) => {
    await updateQuoteStatus(quote.id, 'SUCCESSFUL');
    loadQuotes();
  };

  const handleAddRowToNewDossier = () => {
    setNewMultiItems([
      ...newMultiItems,
      {
        id: String(Date.now()),
        product_name: `Sản phẩm ${newMultiItems.length + 1}`,
        part_number: `PN-0${newMultiItems.length + 1}`,
        annual_volume: 5000,
        quantity_unit: 'pcs/năm',
        target_price: 50000,
        technology_requirement: 'Rèn+Gia công',
      },
    ]);
  };

  const handleRemoveRowFromNewDossier = (id: string) => {
    if (newMultiItems.length <= 1) return;
    setNewMultiItems(newMultiItems.filter((row) => row.id !== id));
  };

  const handleCreateNewDossierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || newMultiItems.length === 0) return;
    if (!newTradeTerms) {
      alert('Vui lòng chọn Trade Terms trước khi lưu.');
      return;
    }
    const hasEmptyName = newMultiItems.some((it) => !it.product_name.trim());
    if (hasEmptyName) {
      alert('Vui lòng nhập tên sản phẩm cho tất cả các dòng.');
      return;
    }

    const formattedItems = newMultiItems.map((it) => ({
      product_name: it.product_name.trim(),
      part_number: it.part_number.trim(),
      annual_volume: Number(it.annual_volume),
      quantity_unit: it.quantity_unit,
      target_price: Number(it.target_price),
      technology_requirement: it.technology_requirement,
      is_feasible: true,
    }));

    try {
      await createRfqDossierWithItems(
        {
          customer_name: newCustomerName.trim(),
          customer_address: newCustomerAddress.trim() || undefined,
          rfq_code: newRfqCode,
          customer_contact_person: newCustomerContactPerson.trim() || undefined,
          rfq_received_date: newRfqReceivedDate,
          customer_deadline: newCustomerDeadline,
          trade_terms: newTradeTerms as 'EXW' | 'FOB' | 'CIF' | 'DAP',
          delivery_address: newTradeTerms !== 'EXW' ? newDeliveryAddress.trim() : undefined,
          special_requirements: newSpecialRequirements.trim() || undefined,
          notes: newNotes.trim() || undefined,
        },
        formattedItems,
        currentUserEmail
      );

      setShowNewRfqModal(false);
      setNewCustomerName('');
      loadQuotes();
    } catch (err: any) {
      alert(`❌ LỖI GHI DỮ LIỆU TẠO RFQ THẤT BẠI TRÊN SUPABASE:\n${err.message || err}`);
    }
  };

  const handleApplyPasteText = () => {
    if (!pasteRawText.trim()) return;

    const parsed = parseStructuredRfqText(pasteRawText);

    if (parsed.dossier.customer_name) setNewCustomerName(parsed.dossier.customer_name);
    if (parsed.dossier.customer_address) setNewCustomerAddress(parsed.dossier.customer_address);
    if (parsed.dossier.customer_contact_person) setNewCustomerContactPerson(parsed.dossier.customer_contact_person);
    if (parsed.dossier.rfq_received_date) setNewRfqReceivedDate(parsed.dossier.rfq_received_date);
    if (parsed.dossier.customer_deadline) setNewCustomerDeadline(parsed.dossier.customer_deadline);
    if (parsed.dossier.trade_terms) setNewTradeTerms(parsed.dossier.trade_terms);
    if (parsed.dossier.delivery_address) setNewDeliveryAddress(parsed.dossier.delivery_address);
    if (parsed.dossier.special_requirements) setNewSpecialRequirements(parsed.dossier.special_requirements);
    if (parsed.dossier.notes) setNewNotes(parsed.dossier.notes);

    if (parsed.items.length > 0) {
      setNewMultiItems(parsed.items);
    }

    setPasteWarnings(parsed.warnings);

    if (parsed.warnings.length === 0) {
      setShowPasteModal(false);
      setPasteRawText('');
    }
  };

  // Section B Excel Export: Exports ALL currently filtered rows with ALL columns
  const handleExportExcel = () => {
    if (quotes.length === 0) return;

    const exportRows = quotes.map((q, idx) => {
      const cur = q.currency || 'VND';
      const rate = q.exchange_rate || 1;
      const rfqItem = q.rfqItem;
      const dossier = q.rfq;

      return {
        STT: idx + 1,
        'Mã Dòng Sản Phẩm': rfqItem?.item_code || `${dossier?.rfq_code || '20260803-001'}-01`,
        'Tên Khách Hàng': dossier?.customer_name || 'N/A',
        'Tên Sản Phẩm': rfqItem?.product_name || 'N/A',
        'Part Number': rfqItem?.part_number || 'N/A',
        'Yêu Cầu Công Nghệ': rfqItem?.technology_requirement || 'Rèn+Gia công',
        'Trạng Thái': rfqItem?.status || q.status,
        'Đơn Giá Báo Giá (VNĐ)': Math.round(q.final_quoted_price || 0),
        'Sản Lượng': `${(rfqItem?.annual_volume || 0).toLocaleString('vi-VN')} ${rfqItem?.quantity_unit || 'pcs/năm'}`,
        'Mã Hồ Sơ RFQ': dossier?.rfq_code || 'N/A',
        'Ngày Nhận RFQ': formatDate(dossier?.rfq_received_date),
        'Customer Deadline': formatDate(dossier?.customer_deadline),
        'Trade Term': dossier?.trade_terms || 'FOB',
        'Địa Chỉ Khách Hàng': dossier?.customer_address || 'N/A',
        'Địa Chỉ Giao Hàng': dossier?.delivery_address || 'N/A',
        'Người Gửi RFQ (Attn)': dossier?.customer_contact_person || 'N/A',
        'Target Price': formatCurrencyValue(rfqItem?.target_price || 0, cur, rate),
        'Người Tạo': dossier?.created_by_email || q.created_by_email || 'N/A',
        'Ngày Gửi Báo Giá': formatDate(rfqItem?.quoted_sent_at),
        'Ngày Có Kết Luận': formatDate(rfqItem?.resolved_at),
        'Ghi Chú Hồ Sơ': dossier?.notes || 'N/A',
        'Lý Do Huỷ (nếu có)': q.cancel_reason || rfqItem?.cancel_reason || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách RFQ');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `DSC-RFQ-Export-${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const selectedQuoteObjects = quotes.filter((q) => selectedQuoteIds.includes(q.id));

  const handleGroupRequest = () => {
    setSelectionError(null);
    if (selectedQuoteObjects.length === 0) return;

    const firstSeg = selectedQuoteObjects[0].segment;
    const sameSeg = selectedQuoteObjects.every((r) => r.segment === firstSeg);

    if (!sameSeg) {
      setSelectionError('Chỉ có thể gộp các sản phẩm cùng phân hệ công nghệ (tất cả Rèn Dập hoặc tất cả Đúc Gang)!');
      return;
    }

    setShowCreateDocModal(true);
  };

  const toggleSelectQuote = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuoteIds(sortedQuotes.map((q) => q.id));
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const isAllSelected = sortedQuotes.length > 0 && selectedQuoteIds.length === sortedQuotes.length;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* MERGED SINGLE-LINE TOOLBAR & PRIMARY FILTERS BAR */}
      <div className="bg-white p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: 3 Primary Single-Line Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm khách hàng, part number, RFQ code..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            <option value="PENDING_REVIEW">Chờ Đánh Giá Kỹ Thuật</option>
            <option value="CANCELLED_NOT_FEASIBLE">Không Khả Thi (Huỷ Ngay)</option>
            <option value="IN_COSTING">Đang Tính Giá</option>
            <option value="READY_FOR_QUOTE">Sẵn Sàng Lên Báo Giá</option>
            <option value="QUOTED_SENT">Đã Gửi Báo Giá</option>
            <option value="SUCCESSFUL">Thành Công</option>
            <option value="CANCELLED_AFTER_QUOTE">Từ Chối Sau Báo Giá</option>
          </select>

          {/* Technology Segment Dropdown */}
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
          >
            <option value="ALL">Tất cả Công Nghệ</option>
            <option value="forging">Phân Hệ Rèn Dập</option>
            <option value="casting">Phân Hệ Đúc Gang</option>
          </select>

          {/* Advanced Filters Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer"
              title="Bộ lọc nâng cao (Khoảng ngày & Sắp xếp)"
            >
              <Filter className="w-4 h-4 text-[#111111]" />
            </button>

            {showAdvancedFilters && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-[10px] border border-[#EAEAEA] shadow-xl p-3 z-50 text-xs text-[#111111] space-y-3 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                  <span>Bộ Lọc Nâng Cao</span>
                  <X
                    className="w-4 h-4 cursor-pointer text-[#787774] hover:text-[#111111]"
                    onClick={() => setShowAdvancedFilters(false)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                    Khoảng Ngày Tạo (Từ - Đến)
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs text-[#111111]"
                    />
                    <span className="text-[#787774]">-</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs text-[#111111]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: ICON-ONLY ACTION BUTTONS */}
        <div className="flex items-center space-x-1.5">
          {/* 1. Xem Chi Tiết */}
          <button
            type="button"
            disabled={selectedQuoteIds.length !== 1}
            onClick={() => {
              if (selectedSingleQuote) setSelectedQuote(selectedSingleQuote);
            }}
            title="Xem chi tiết bóc tách sản phẩm"
            className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-[#EAEAEA]"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* 2. Feasibility actions for PENDING_REVIEW */}
          <button
            type="button"
            disabled={!canApproveFeasibility}
            onClick={() => {
              if (selectedSingleQuote) handleApproveFeasibility(selectedSingleQuote);
            }}
            title="✓ Có, tiếp tục tính giá (Kỹ thuật khả thi)"
            className="p-2 bg-[#111111] hover:bg-[#333333] text-white rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            disabled={!canApproveFeasibility}
            onClick={() => {
              if (selectedSingleQuote) handleOpenItemCancelModal(selectedSingleQuote, 'CANCELLED_NOT_FEASIBLE');
            }}
            title="✕ Không khả thi, huỷ ngay"
            className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* 3. Calculator navigation for IN_COSTING (Disabled if Sawed Billet) */}
          <button
            type="button"
            disabled={!canGoToCalculator}
            onClick={() => {
              if (selectedSingleQuote) handleGoToCalculator(selectedSingleQuote);
            }}
            title={
              isSawedBilletTech
                ? 'Công nghệ Phôi Cưa sẽ được hỗ trợ ở bản cập nhật sau'
                : 'Đi đến Bảng Tính Giá (Calculator)'
            }
            className="p-2 bg-[#111111] hover:bg-[#333333] text-amber-300 rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
          >
            <Calculator className="w-4 h-4" />
          </button>

          {/* 4. Sent Status Actions for QUOTED_SENT */}
          <button
            type="button"
            disabled={!canMarkSentStatus}
            onClick={() => {
              if (selectedSingleQuote) handleMarkItemSuccessful(selectedSingleQuote);
            }}
            title="Đánh dấu Thành Công (Khách nhận giá)"
            className="p-2 bg-[#EDF3EC] hover:bg-[#DDF0DC] text-[#346538] border border-[#C6E1C4] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!canMarkSentStatus}
            onClick={() => {
              if (selectedSingleQuote) handleOpenItemCancelModal(selectedSingleQuote, 'CANCELLED_AFTER_QUOTE');
            }}
            title="Đánh dấu Từ Chối / Huỷ sau báo giá"
            className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
          </button>

          {/* 5. Gộp Báo Giá */}
          <button
            type="button"
            disabled={selectedQuoteIds.length === 0}
            onClick={handleGroupRequest}
            title={`Gộp (${selectedQuoteIds.length}) mã sản phẩm thành Báo Giá`}
            className="p-2 bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4] hover:bg-[#DDF0DC] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* 5.5 Xóa Mã Sản Phẩm / RFQ */}
          <button
            type="button"
            disabled={selectedQuoteIds.length === 0}
            onClick={handleDeleteSelectedItems}
            title={`Xoá (${selectedQuoteIds.length}) mã sản phẩm đã chọn khỏi Supabase DB`}
            className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 stroke-[2]" />
          </button>

          {/* 6. + Tạo RFQ Mới Icon-only */}
          <button
            type="button"
            onClick={() => setShowNewRfqModal(true)}
            title="+ Tạo Hồ Sơ RFQ Mới (Nhập Đa Sản Phẩm)"
            className="p-2 bg-[#111111] hover:bg-[#333333] text-white rounded-[6px] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* 7. Export Excel Icon-only (Filtered Scope) */}
          <button
            type="button"
            onClick={handleExportExcel}
            title="Xuất Excel danh sách RFQ theo bộ lọc"
            className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer"
              title="Cấu hình ẩn/hiện cột bảng (Excel Column Visibility)"
            >
              <Columns className="w-4 h-4 text-[#111111]" />
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-[10px] border border-[#EAEAEA] shadow-xl p-3 z-50 text-xs text-[#111111] space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                  <span>Ẩn / Hiện Cột Bảng (20 Cột)</span>
                  <Settings className="w-3.5 h-3.5 text-[#787774]" />
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {ALL_ITEM_COLUMNS.map((col) => {
                    const isVis = !hiddenCols.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className="flex items-center space-x-2 p-1.5 rounded hover:bg-[#FBFBFA] cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={() => toggleColumnHidden(col.key)}
                          className="rounded accent-[#111111] cursor-pointer"
                        />
                        <span className="font-semibold text-xs text-[#111111]">
                          {col.header}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Error Alert */}
      {selectionError && (
        <div className="p-3 rounded-[8px] bg-[#FDEBEC] border border-[#FADBDC] text-[#9F2F2D] text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{selectionError}</span>
        </div>
      )}

      {/* SECTION A: ABSOLUTE FLAT DATA TABLE (1 ROW = 1 RFQ_ITEM) WITH FREEZE PANES */}
      <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Sticky Header Row */}
            <thead className="sticky top-0 z-20 bg-[#FBFBFA] border-b border-[#EAEAEA] text-[11px] font-bold uppercase text-[#787774] tracking-wider shadow-xs">
              <tr>
                {/* Column 0: Sticky Checkbox Header */}
                <th className="py-3 px-3.5 w-10 text-center border-b border-[#EAEAEA] sticky left-0 z-30 bg-[#FBFBFA]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded accent-[#111111] cursor-pointer"
                  />
                </th>

                {/* Visible Columns Header with Click-to-Sort */}
                {visibleCols.map((col) => {
                  const isSorted = sortCol === col.key;
                  const isStickyLeftCol = col.key === 'item_code'; // Sticky freeze panes for Item Code

                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSortColumnClick(col.key)}
                      className={`py-3 px-4 border-b border-[#EAEAEA] select-none cursor-pointer hover:bg-[#F0F0EE] transition-colors ${
                        isStickyLeftCol ? 'sticky left-[40px] z-30 bg-[#FBFBFA] border-r border-[#EAEAEA]' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.header}</span>
                        <span className="text-[#787774]">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#111111] stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#111111] stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-[#787774]/40" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#111111]">
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="py-12 text-center text-[#787774] italic">
                    Đang tải danh sách sản phẩm RFQ...
                  </td>
                </tr>
              ) : sortedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="py-12 text-center text-[#787774] italic">
                    Không tìm thấy sản phẩm RFQ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                sortedQuotes.map((q) => {
                  const rfqItem = q.rfqItem || ({} as RfqItemRecord);
                  const dossier = q.rfq;
                  const itemStatus = rfqItem.status || q.status;
                  const isSelected = selectedQuoteIds.includes(q.id);

                  return (
                    <tr
                      key={q.id}
                      className={`group hover:bg-[#F4F9F4] transition-colors ${
                        isSelected ? 'bg-[#F0F0EE]/80' : ''
                      }`}
                    >
                      {/* Column 0: Sticky Checkbox Cell */}
                      <td className="py-2.5 px-3.5 text-center sticky left-0 z-10 bg-white group-hover:bg-[#F4F9F4]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectQuote(q.id)}
                          className="w-4 h-4 rounded border-[#EAEAEA] text-[#111111] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Visible Column Cells */}
                      {visibleCols.map((col) => {
                        const isStickyLeftCol = col.key === 'item_code';
                        const cellStickyClass = isStickyLeftCol
                          ? 'sticky left-[40px] z-10 bg-white group-hover:bg-[#F4F9F4] border-r border-[#EAEAEA]'
                          : '';

                        if (col.key === 'item_code') {
                          return (
                            <td key={col.key} className={`py-2.5 px-4 font-mono font-extrabold text-[#111111] ${cellStickyClass}`}>
                              {rfqItem.item_code || `${dossier?.rfq_code || '20260803-001'}-01`}
                            </td>
                          );
                        }
                        if (col.key === 'customer_name') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-bold text-[#111111]">
                              {dossier?.customer_name || 'N/A'}
                            </td>
                          );
                        }
                        if (col.key === 'product_name') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-bold text-[#111111]">
                              {rfqItem.product_name || 'Chi tiết sản phẩm'}
                            </td>
                          );
                        }
                        if (col.key === 'part_number') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono font-semibold text-[#111111]">
                              {rfqItem.part_number || 'No PN'}
                            </td>
                          );
                        }
                        if (col.key === 'technology_requirement') {
                          const tech = rfqItem.technology_requirement || (q.segment === 'forging' ? 'Rèn+Gia công' : 'Đúc+Gia công');
                          const isSaw = tech.includes('Phôi cưa');
                          return (
                            <td key={col.key} className="py-2.5 px-4">
                              <span
                                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isSaw
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : tech.includes('Đúc')
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {tech.includes('Đúc') ? <Box className="w-2.5 h-2.5" /> : <Workflow className="w-2.5 h-2.5" />}
                                <span>{tech}</span>
                              </span>
                            </td>
                          );
                        }
                        if (col.key === 'status') {
                          return (
                            <td key={col.key} className="py-2.5 px-4">
                              <QuoteStatusBadge status={itemStatus} size="sm" />
                            </td>
                          );
                        }
                        if (col.key === 'final_quoted_price') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono font-extrabold text-[#111111]">
                              {formatCurrencyValue(q.final_quoted_price, q.currency, q.exchange_rate)}
                            </td>
                          );
                        }
                        if (col.key === 'annual_volume') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono font-bold text-[#111111]">
                              {(rfqItem.annual_volume || 0).toLocaleString('vi-VN')} {rfqItem.quantity_unit || 'pcs/năm'}
                            </td>
                          );
                        }
                        if (col.key === 'rfq_code') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono font-semibold text-[#787774]">
                              {dossier?.rfq_code || '20260803-001'}
                            </td>
                          );
                        }
                        if (col.key === 'rfq_received_date') {
                          return <td key={col.key} className="py-2.5 px-4 font-mono text-[#787774]">{formatDate(dossier?.rfq_received_date)}</td>;
                        }
                        if (col.key === 'customer_deadline') {
                          return <td key={col.key} className="py-2.5 px-4 font-mono text-[#787774]">{formatDate(dossier?.customer_deadline)}</td>;
                        }
                        if (col.key === 'trade_terms') {
                          return <td key={col.key} className="py-2.5 px-4 font-mono font-bold text-[#111111]">{dossier?.trade_terms || 'FOB'}</td>;
                        }
                        if (col.key === 'customer_address') {
                          return <td key={col.key} className="py-2.5 px-4 text-[#787774]">{dossier?.customer_address || 'N/A'}</td>;
                        }
                        if (col.key === 'delivery_address') {
                          return <td key={col.key} className="py-2.5 px-4 text-[#787774]">{dossier?.delivery_address || 'N/A'}</td>;
                        }
                        if (col.key === 'customer_contact_person') {
                          return <td key={col.key} className="py-2.5 px-4 text-[#111111] font-semibold">{dossier?.customer_contact_person || 'N/A'}</td>;
                        }
                        if (col.key === 'target_price') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono text-[#787774]">
                              {formatCurrencyValue(rfqItem.target_price || 0, q.currency, q.exchange_rate)}
                            </td>
                          );
                        }
                        if (col.key === 'created_by_email') {
                          return <td key={col.key} className="py-2.5 px-4 text-[#787774]">{dossier?.created_by_email || q.created_by_email || 'System'}</td>;
                        }
                        if (col.key === 'quoted_sent_at') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono text-[#787774]">
                              {formatDate(rfqItem.quoted_sent_at)}
                            </td>
                          );
                        }
                        if (col.key === 'resolved_at') {
                          return (
                            <td key={col.key} className="py-2.5 px-4 font-mono text-[#787774]">
                              {formatDate(rfqItem.resolved_at)}
                            </td>
                          );
                        }
                        if (col.key === 'notes') {
                          return <td key={col.key} className="py-2.5 px-4 text-[#787774] italic">{dossier?.notes || 'N/A'}</td>;
                        }
                        return null;
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        {totalCount > 0 && (
          <div className="p-3 bg-[#FBFBFA] border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#787774] flex items-center space-x-2">
              <span>
                Hiển thị trang <strong className="text-[#111111] font-mono">{currentPage}</strong> / <strong className="font-mono">{totalPages}</strong> ({totalCount} mã sản phẩm phẳng)
              </span>
              <span className="text-[#EAEAEA]">|</span>
              <div className="flex items-center space-x-1">
                <span>Số dòng / trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 border border-[#EAEAEA] bg-white rounded text-xs font-bold text-[#111111]"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={25}>25 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 justify-end">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2 py-1 bg-white border border-[#EAEAEA] hover:bg-[#F5F5F3] rounded text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                « Đầu
              </button>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1 bg-white border border-[#EAEAEA] hover:bg-[#F5F5F3] rounded text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                ‹ Trước
              </button>
              <span className="px-2 py-1 font-mono font-bold text-[#111111]">
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 bg-white border border-[#EAEAEA] hover:bg-[#F5F5F3] rounded text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                Sau ›
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 bg-white border border-[#EAEAEA] hover:bg-[#F5F5F3] rounded text-[11px] font-bold disabled:opacity-40 cursor-pointer"
              >
                Cuối »
              </button>
            </div>
          </div>
        )}
      </div>

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
      <Modal
        isOpen={showCancelReasonModal}
        onClose={() => setShowCancelReasonModal(false)}
        size="sm"
        icon={<XCircle className="w-4 h-4 text-[#9F2F2D]" />}
        title="Xác Nhận Huỷ Bỏ Sản Phẩm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowCancelReasonModal(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="cancel-reason-form"
              disabled={!cancelReasonText.trim()}
              className="px-4 py-1.5 bg-[#9F2F2D] hover:bg-[#7F2321] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Huỷ Bỏ</span>
            </button>
          </>
        }
      >
        <form id="cancel-reason-form" onSubmit={handleConfirmItemCancelSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#9F2F2D] uppercase tracking-wider mb-1">
              Nhập Lý Do Huỷ Bỏ (Bắt Nhập Text Tự Do) *
            </label>
            <textarea
              rows={3}
              required
              value={cancelReasonText}
              onChange={(e) => setCancelReasonText(e.target.value)}
              placeholder="Ví dụ: Khách hàng thông báo bản vẽ vượt giới hạn công nghệ, đối thủ cạnh tranh rẻ hơn..."
              className="w-full p-2.5 border border-[#FADBDC] bg-white rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#9F2F2D]"
            />
          </div>
        </form>
      </Modal>

      {/* Modal "+ Tạo RFQ Mới" Expanded Form */}
      <Modal
        isOpen={showNewRfqModal}
        onClose={() => setShowNewRfqModal(false)}
        size="2xl"
        icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        title="+ Tạo Hồ Sơ RFQ Mới & Nhập Đa Sản Phẩm (Multi-Row Entry)"
        subtitle="Đầy đủ thông tin hồ sơ RFQ, địa chỉ giao hàng, người gửi và yêu cầu kỹ thuật"
        headerExtra={
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-[6px] transition-colors cursor-pointer inline-flex items-center space-x-1.5 mr-2"
          >
            <Clipboard className="w-4 h-4 text-amber-700" />
            <span>Dán Dữ Liệu Đã Chuẩn Hoá</span>
          </button>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewRfqModal(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-new-dossier-form"
              disabled={!newCustomerName.trim() || newMultiItems.length === 0}
              className="px-5 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Khởi Tạo Hồ Sơ ({newMultiItems.length} Sản Phẩm)</span>
            </button>
          </>
        }
      >
        <form id="create-new-dossier-form" onSubmit={handleCreateNewDossierSubmit} className="space-y-4">
          {/* Step 1: Dossier Header */}
          <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-3">
            <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
              Bước 1: Thông Tin Hồ Sơ RFQ Header
            </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* RFQ Code (Auto-generated, Read-only) */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Số Hiệu RFQ (Tự Động) *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={newRfqCode}
                      className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-[#F0F0EE] rounded-[6px] font-mono text-xs font-bold text-[#111111] cursor-not-allowed"
                    />
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Tên Khách Hàng (Company) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Nhập tên đối tác / công ty"
                      className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-bold text-[#111111]"
                    />
                  </div>

                  {/* Customer Contact Person */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Người Gửi RFQ (Attn Person)
                    </label>
                    <input
                      type="text"
                      value={newCustomerContactPerson}
                      onChange={(e) => setNewCustomerContactPerson(e.target.value)}
                      placeholder="Tên người gửi yêu cầu phía khách"
                      className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Customer Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Địa Chỉ Khách Hàng
                    </label>
                    <input
                      type="text"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Địa chỉ trụ sở / nhà máy khách hàng"
                      className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                    />
                  </div>

                  {/* RFQ Received Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Ngày Nhận RFQ *
                    </label>
                    <input
                      type="date"
                      required
                      value={newRfqReceivedDate}
                      onChange={(e) => setNewRfqReceivedDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] font-mono text-xs text-[#111111]"
                    />
                  </div>

                  {/* Customer Deadline */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Customer Deadline *
                    </label>
                    <input
                      type="date"
                      required
                      value={newCustomerDeadline}
                      onChange={(e) => setNewCustomerDeadline(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] font-mono text-xs text-[#111111]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Trade Terms */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Trade Terms *
                    </label>
                    <select
                      value={newTradeTerms ?? ''}
                      required
                      onChange={(e) => setNewTradeTerms(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] font-bold text-xs text-[#111111]"
                    >
                      <option value="" disabled>— Chọn Trade Terms —</option>
                      <option value="EXW">EXW</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="DAP">DAP</option>
                    </select>
                  </div>

                  {/* Delivery Address (Required/Visible if Trade Terms != EXW) */}
                  {newTradeTerms !== 'EXW' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                        Địa Chỉ Giao Hàng (Bắt Nhập Cho {newTradeTerms}) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDeliveryAddress}
                        onChange={(e) => setNewDeliveryAddress(e.target.value)}
                        placeholder="Nhập cảng đích / kho giao hàng..."
                        className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Special Requirements */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Yêu Cầu Đặc Biệt (Nhiệt luyện, sơn phủ...)
                    </label>
                    <textarea
                      rows={2}
                      value={newSpecialRequirements}
                      onChange={(e) => setNewSpecialRequirements(e.target.value)}
                      placeholder="Ví dụ: Tôi cứng bề mặt HRC 55-60, sơn lót chống gỉ..."
                      className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                      Ghi Chú Chung Hồ Sơ
                    </label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Ghi chú nội bộ cho sales/estimator..."
                      className="w-full p-2 border border-[#EAEAEA] bg-white rounded-[6px] text-xs text-[#111111]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Multi-Row Product Entry Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                    Bước 2: Bảng Nhập Nhanh {newMultiItems.length} Dòng Sản Phẩm
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddRowToNewDossier}
                    className="px-3 py-1 bg-[#111111] hover:bg-[#333333] text-white text-xs font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Dòng Sản Phẩm</span>
                  </button>
                </div>

                <div className="border border-[#EAEAEA] rounded-[8px] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[10px] font-bold uppercase text-[#787774]">
                        <th className="py-2.5 px-3 w-10 text-center">STT</th>
                        <th className="py-2.5 px-3">Tên Sản Phẩm *</th>
                        <th className="py-2.5 px-3">Part Number *</th>
                        <th className="py-2.5 px-3 w-28 text-right">Sản Lượng</th>
                        <th className="py-2.5 px-3 w-28">Đơn Vị *</th>
                        <th className="py-2.5 px-3 w-32 text-right">Target Price</th>
                        <th className="py-2.5 px-3 w-40">Yêu Cầu Công Nghệ *</th>
                        <th className="py-2.5 px-3 w-12 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA] text-xs">
                      {newMultiItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-[#FBFBFA]">
                          <td className="py-2 px-3 text-center font-bold text-[#787774]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={item.product_name}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].product_name = e.target.value;
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs font-semibold text-[#111111]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              value={item.part_number}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].part_number = e.target.value;
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs font-mono text-[#111111]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.annual_volume}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].annual_volume = Number(e.target.value);
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs font-mono font-bold text-right text-[#111111]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.quantity_unit}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].quantity_unit = e.target.value as QuantityUnitType;
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-1.5 py-1 border border-[#EAEAEA] rounded text-xs font-bold text-[#111111]"
                            >
                              <option value="pcs/năm">pcs/năm</option>
                              <option value="pcs/tháng">pcs/tháng</option>
                              <option value="pcs/lô">pcs/lô</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.target_price}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].target_price = Number(e.target.value);
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-2 py-1 border border-[#EAEAEA] rounded text-xs font-mono font-bold text-right text-[#111111]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.technology_requirement}
                              onChange={(e) => {
                                const copy = [...newMultiItems];
                                copy[idx].technology_requirement = e.target.value as TechnologyRequirementType;
                                setNewMultiItems(copy);
                              }}
                              className="w-full px-1.5 py-1 border border-[#EAEAEA] rounded text-xs font-bold text-[#111111]"
                            >
                              <option value="Rèn+Gia công">Rèn+Gia công</option>
                              <option value="Phôi rèn">Phôi rèn</option>
                              <option value="Đúc+Gia công">Đúc+Gia công</option>
                              <option value="Phôi đúc">Phôi đúc</option>
                              <option value="Phôi cưa">Phôi cưa (Chờ tính giá)</option>
                              <option value="Phôi cưa+Gia công">Phôi cưa+Gia công (Chờ)</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {newMultiItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRowFromNewDossier(item.id)}
                                className="p-1 text-[#9F2F2D] hover:bg-[#FDEBEC] rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
        </form>
      </Modal>

      {/* SUB-MODAL "Dán Dữ Liệu Đã Chuẩn Hoá" */}
      <Modal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        size="lg"
        icon={<Clipboard className="w-4 h-4 text-amber-700" />}
        title="Dán Dữ Liệu Cấu Trúc Khách Hàng / Email"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowPasteModal(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!pasteRawText.trim()}
              onClick={handleApplyPasteText}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Áp Dụng Dữ Liệu Dán</span>
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-[11px] text-[#787774]">
            Dán chuỗi text thông tin khách hàng và danh sách sản phẩm theo mẫu chuẩn bên dưới (tự động chuyển ngày DD/MM/YYYY sang YYYY-MM-DD):
          </p>

          {pasteWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Cảnh báo một số dòng không nhận diện được mẫu (đã bỏ qua):</span>
              </div>
              <ul className="list-disc list-inside font-mono text-[11px] space-y-0.5 pl-2">
                {pasteWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <textarea
            rows={10}
            value={pasteRawText}
            onChange={(e) => {
              setPasteRawText(e.target.value);
              setPasteWarnings([]);
            }}
            placeholder={`KHÁCH HÀNG: Công ty Cổ Phần Cơ Khí Honda Việt Nam
ĐỊA CHỈ: KCN Phúc Thắng, Phúc Yên, Vĩnh Phúc
NGƯỜI GỬI RFQ: Anh Nguyễn Văn Nam
NGÀY NHẬN RFQ: 03/08/2026
DEADLINE BÁO GIÁ: 10/08/2026
TRADE TERM: FOB
ĐỊA CHỈ GIAO HÀNG: Cảng Hải Phòng
YÊU CẦU ĐẶC BIỆT: Nhiệt luyện tôi cao tần

SẢN PHẨM:
Tên: Bánh răng D450 | Part Number: BR-D450-01 | Sản lượng: 10000 pcs/năm | Target Price: 95000 | Công nghệ: Rèn+Gia công
Tên: Trục truyền động CNC | Part Number: TRUC-CNC-02 | Sản lượng: 5000 pcs/năm | Target Price: 150000 | Công nghệ: Đúc+Gia công`}
            className="w-full p-3 border border-[#EAEAEA] bg-[#FBFBFA] rounded-[6px] font-mono text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>
      </Modal>
    </div>
  );
};
