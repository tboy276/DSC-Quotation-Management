import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  QuoteRecord,
  RfqItemStatus,
  QuotationFilterOptions,
  QuantityUnitType,
  TechnologyRequirementType,
  RfqStageCounts,
} from '../../types/quote';
import {
  fetchPaginatedQuotes,
  fetchQuoteCounts,
  updateQuoteStatus,
  createRfqDossierWithItems,
  deleteRfqItems,
  updateRfqItemDetails,
} from '../../lib/quotation-service';
import { Modal } from '../ui/Modal';
import { QuoteStatusBadge } from '../rfq/QuoteStatusBadge';
import { QuoteDetailModal } from '../rfq/QuoteDetailModal';
import { CreateDocumentModal } from './CreateDocumentModal';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { useAuth } from '../../context/AuthContext';

import { parseStructuredRfqText } from '../../utils/rfq-parser';
import { formatDate } from '../../lib/format-date';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Search,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  X,
  Calculator,
  Layers,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Columns,
  Clipboard,
  Clock,
  FileText,
  ArrowRight,
  Inbox,
  SlidersHorizontal,
  Send,
  Pencil,
} from 'lucide-react';

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

export const QuotationsManager = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const currentUserEmail = profile?.email || user?.email || '';

  // 1. Stage Tab State (Synced with URL: ?stage=new|internal|sent)
  const activeStage = (searchParams.get('stage') as 'new' | 'internal' | 'sent') || 'new';

  // 2. Sub-filter Status State (Synced with URL)
  const statusFilter = (searchParams.get('status') as RfqItemStatus | 'ALL') || 'ALL';

  // 3. Only Cancelled Toggle State (Synced with URL)
  const onlyCancelled = searchParams.get('onlyCancelled') === 'true';

  // Global counts for Summary Cards & Stage Tab Badges
  const [globalCounts, setGlobalCounts] = useState<RfqStageCounts>({
    total: 0,
    pendingReview: 0,
    inCosting: 0,
    successful: 0,
    newStage: 0,
    internalStage: 0,
    sentStage: 0,
  });

  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection & Action state
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [showCreateDocModal, setShowCreateDocModal] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; targetStage?: 'new' | 'internal' | 'sent' } | null>(null);

  // Sorting State for Flat Table Columns
  const [sortCol, setSortCol] = useState<string>('rfq_received_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Additional Primary Filters State
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

  // Helper for dynamic column visibility by active stage
  const isColVisibleInStage = (key: string) => {
    if (hiddenCols.includes(key)) return false;
    if (activeStage === 'new') {
      if (key === 'final_quoted_price' || key === 'quoted_sent_at') return false;
    }
    return true;
  };

  const visibleCols = ALL_ITEM_COLUMNS.filter((c) => isColVisibleInStage(c.key));

  // Server-side Pagination State (50 items/page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals State
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);
  const [showNewRfqModal, setShowNewRfqModal] = useState<boolean>(false);

  // Edit Item Modal State
  const [showEditItemModal, setShowEditItemModal] = useState<boolean>(false);
  const [editProductName, setEditProductName] = useState<string>('');
  const [editPartNumber, setEditPartNumber] = useState<string>('');
  const [editTechRequirement, setEditTechRequirement] = useState<TechnologyRequirementType>('Rèn+Gia công');
  const [editAnnualVolume, setEditAnnualVolume] = useState<number>(0);
  const [editTargetPrice, setEditTargetPrice] = useState<number>(0);

  const handleOpenEditModal = (quote: QuoteRecord) => {
    setEditProductName(quote.rfqItem?.product_name || '');
    setEditPartNumber(quote.rfqItem?.part_number || '');
    setEditTechRequirement(quote.rfqItem?.technology_requirement || 'Rèn+Gia công');
    setEditAnnualVolume(quote.rfqItem?.annual_volume || 0);
    setEditTargetPrice(quote.rfqItem?.target_price || 0);
    setShowEditItemModal(true);
  };

  const handleSaveEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSingleQuote || !editProductName.trim()) return;
    try {
      await updateRfqItemDetails(selectedSingleQuote.rfq_item_id, {
        product_name: editProductName.trim(),
        part_number: editPartNumber.trim(),
        technology_requirement: editTechRequirement,
        annual_volume: Number(editAnnualVolume) || 0,
        target_price: Number(editTargetPrice) || 0,
      });
      setShowEditItemModal(false);
      loadQuotes();
      setMsg({ text: `Đã cập nhật thông tin sản phẩm "${editProductName.trim()}" thành công!` });
    } catch (err: any) {
      alert(`Lỗi cập nhật sản phẩm: ${err.message || err}`);
    }
  };

  // Paste Structured Text Sub-Modal State
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteRawText, setPasteRawText] = useState<string>('');
  const [pasteWarnings, setPasteWarnings] = useState<string[]>([]);

  // Cancel Reason Modal State
  const [showCancelReasonModal, setShowCancelReasonModal] = useState<boolean>(false);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');

  // Expanded New RFQ Dossier Quick Entry Modal Form State
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>('');
  const [newRfqCode, setNewRfqCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      const generatedCode = `${dateStr}-${String(totalCount + 1).padStart(3, '0')}`;
      setNewRfqCode(generatedCode);
    }
  }, [showNewRfqModal, totalCount]);

  // Handle Stage Tab Switch (URL synced)
  const handleStageChange = (newStage: 'new' | 'internal' | 'sent') => {
    setSelectedQuoteIds([]);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('stage', newStage);
    newParams.delete('status'); // Reset sub-status filter on stage change
    newParams.delete('onlyCancelled');
    setSearchParams(newParams);
  };

  // Handle Status Sub-filter Change (URL synced)
  const handleStatusFilterChange = (newStatus: string) => {
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'ALL') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus);
    }
    setSearchParams(newParams);
  };

  // Handle Only Cancelled Toggle (URL synced)
  const handleToggleOnlyCancelled = () => {
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (onlyCancelled) {
      newParams.delete('onlyCancelled');
    } else {
      newParams.set('onlyCancelled', 'true');
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    loadQuotes();
  }, [activeStage, statusFilter, onlyCancelled, segmentFilter, searchQuery, fromDate, toDate, currentPage, pageSize]);

  const loadQuotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch lightweight global counts for Summary Cards & Stage Badges
      fetchQuoteCounts()
        .then((counts) => setGlobalCounts(counts))
        .catch((err) => setErrorMsg(`Lỗi tải số liệu thống kê: ${err.message || err}`));

      // 2. Fetch paginated quotes for active stage & filters
      const filterOptions: QuotationFilterOptions = {
        stage: activeStage,
        status: statusFilter,
        onlyCancelled,
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu báo giá.');
    } finally {
      setLoading(false);
    }
  };

  // Single Ownership-based Authorization Rule (Replaces role-based functions)
  const canManageQuote = (quote?: QuoteRecord | null): boolean => {
    if (!quote) return false;
    if (profile?.role === 'admin') return true;
    const creatorEmail = quote.rfq?.created_by_email || quote.created_by_email;
    return Boolean(currentUserEmail && creatorEmail === currentUserEmail);
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

  // Selected quotes list for validation
  const selectedQuotes = useMemo(() => {
    return quotes.filter((q) => selectedQuoteIds.includes(q.id));
  }, [quotes, selectedQuoteIds]);

  const canApproveFeasibility = useMemo(() => {
    if (selectedQuotes.length === 0) return false;
    return selectedQuotes.every((q) => {
      const st = q.rfqItem?.status || q.status;
      return st === 'PENDING_REVIEW' && canManageQuote(q);
    });
  }, [selectedQuotes, profile, currentUserEmail]);

  const canRejectFeasibility = useMemo(() => {
    if (selectedQuotes.length === 0) return false;
    return selectedQuotes.every((q) => {
      const st = q.rfqItem?.status || q.status;
      return st === 'PENDING_REVIEW' && canManageQuote(q);
    });
  }, [selectedQuotes, profile, currentUserEmail]);

  const canGoToCalculator = selectedSingleQuote && (selectedItemStatus === 'IN_COSTING' || selectedItemStatus === 'READY_FOR_QUOTE');
  const canMarkSentStatus = selectedSingleQuote && selectedItemStatus === 'QUOTED_SENT' && canManageQuote(selectedSingleQuote);

  // Check if ALL selected items can be deleted by current user (Ownership rule)
  const canDeleteSelected = useMemo(() => {
    if (selectedQuoteIds.length === 0) return false;
    return selectedQuotes.every((q) => canManageQuote(q));
  }, [selectedQuoteIds, selectedQuotes, profile, currentUserEmail]);

  // Validation logic for "Gộp Báo Giá" in Tab 2 (Strict 4 Conditions + Option B)
  const groupDisabledReason = useMemo((): string | null => {
    if (selectedQuoteIds.length === 0) {
      return 'Vui lòng chọn ít nhất 1 sản phẩm để gộp báo giá.';
    }
    const allReady = selectedQuotes.every(
      (q) => (q.rfqItem?.status || q.status) === 'READY_FOR_QUOTE'
    );
    if (!allReady) {
      return 'Chỉ có thể gộp các sản phẩm đã hoàn tất tính giá (READY_FOR_QUOTE).';
    }

    const firstCustomer = selectedQuotes[0]?.rfq?.customer_name || '';
    const sameCustomer = selectedQuotes.every(
      (q) => (q.rfq?.customer_name || '') === firstCustomer
    );
    if (!sameCustomer) {
      return 'Chỉ có thể gộp các sản phẩm của CÙNG MỘT khách hàng.';
    }

    // Technology Segment Family Check
    const getTechFamily = (tech?: string) => {
      if (!tech) return 'forging';
      if (tech.includes('Cưa')) return 'sawing';
      if (tech.includes('Đúc')) return 'casting';
      if (tech.includes('CNC')) return 'machining';
      return 'forging';
    };
    const firstTech = getTechFamily(selectedQuotes[0]?.rfqItem?.technology_requirement);
    const sameTech = selectedQuotes.every(
      (q) => getTechFamily(q.rfqItem?.technology_requirement) === firstTech
    );
    if (!sameTech) {
      return 'Chỉ có thể gộp các sản phẩm của CÙNG MỘT phân hệ công nghệ (Rèn, Đúc, Cưa, CNC).';
    }

    // Option B: Must be created by SAME person (or Admin)
    const allManageable = selectedQuotes.every((q) => canManageQuote(q));
    if (!allManageable) {
      return 'Chỉ có thể gộp các sản phẩm do chính bạn tạo.';
    }

    return null;
  }, [selectedQuoteIds, selectedQuotes, profile, currentUserEmail]);

  const handleGroupRequest = () => {
    if (groupDisabledReason) return;
    setShowCreateDocModal(true);
  };

  const handleDeleteSelectedItems = async () => {
    if (!canDeleteSelected) {
      alert('⚠️ Không thể thực hiện: Bạn chỉ có quyền xóa các RFQ do chính mình tạo.');
      return;
    }
    const selectedList = quotes.filter((q) => selectedQuoteIds.includes(q.id));
    const count = selectedList.length;

    if (!window.confirm(`XÁC NHẬN XOÁ:\nBạn có chắc chắn muốn xóa (${count}) mã sản phẩm RFQ đã chọn khỏi cơ sở dữ liệu Supabase không?`)) {
      return;
    }

    try {
      const itemIds = selectedList.map((q) => q.rfq_item_id);
      await deleteRfqItems(itemIds);
      setSelectedQuoteIds([]);
      loadQuotes();
    } catch (err: any) {
      alert(`❌ LỖI XOÁ DỮ LIỆU THẤT BẠI TRÊN SUPABASE:\n${err.message || err}`);
    }
  };

  const handleApproveFeasibility = async () => {
    if (!canApproveFeasibility || selectedQuotes.length === 0) return;
    try {
      for (const quote of selectedQuotes) {
        const targetId = quote.rfq_item_id || quote.id;
        await updateQuoteStatus(targetId, 'IN_COSTING');
        if (quote.rfq && !quote.rfq.technical_review_completed_at) {
          quote.rfq.technical_review_completed_at = new Date().toISOString();
        }
      }
      setMsg({
        text: `Đã duyệt khả thi cho (${selectedQuotes.length}) sản phẩm. Đã chuyển sang Tab "Đang Xử Lý Nội Bộ".`,
        targetStage: 'internal',
      });
      setSelectedQuoteIds([]);
      loadQuotes();
    } catch (err: any) {
      alert(`❌ Lỗi chuyển tính giá: ${err.message || err}`);
    }
  };

  const handleOpenItemCancelModal = (_targetStatus?: RfqItemStatus) => {
    if (selectedQuotes.length === 0) return;
    setCancelReasonText('');
    setShowCancelReasonModal(true);
  };

  const handleConfirmItemCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReasonText.trim() || selectedQuotes.length === 0) return;

    try {
      const targetStatus: RfqItemStatus = activeStage === 'new' ? 'CANCELLED_NOT_FEASIBLE' : 'CANCELLED_AFTER_QUOTE';
      for (const quote of selectedQuotes) {
        const targetId = quote.rfq_item_id || quote.id;
        await updateQuoteStatus(targetId, targetStatus, cancelReasonText.trim());
      }
      setShowCancelReasonModal(false);
      setSelectedQuoteIds([]);
      loadQuotes();
    } catch (err: any) {
      alert(`❌ Lỗi cập nhật không phù hợp: ${err.message || err}`);
    }
  };

  const handleGoToCalculator = (quote: QuoteRecord) => {
    const tech = quote.rfqItem?.technology_requirement || 'Rèn+Gia công';

    let targetSegment = 'forging';
    if (tech.includes('Phôi cưa') || tech.includes('Cưa')) {
      targetSegment = 'sawing';
    } else if (tech.includes('Chỉ gia công CNC') || tech.includes('Gia công CNC')) {
      targetSegment = 'machining';
    } else if (tech.includes('Đúc')) {
      targetSegment = 'casting';
    }

    navigate(`/${targetSegment}/${quote.rfq_item_id}`);
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
        annual_volume: 0,
        quantity_unit: 'pcs/năm',
        target_price: 0,
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

    try {
      const dossierData = {
        customer_name: newCustomerName.trim(),
        customer_address: newCustomerAddress.trim() || undefined,
        rfq_code: newRfqCode.trim() || undefined,
        customer_contact_person: newCustomerContactPerson.trim() || undefined,
        rfq_received_date: newRfqReceivedDate,
        customer_deadline: newCustomerDeadline,
        trade_terms: newTradeTerms,
        delivery_address: newDeliveryAddress.trim() || undefined,
        special_requirements: newSpecialRequirements.trim() || undefined,
        notes: newNotes.trim() || undefined,
      };

      const itemsData = newMultiItems.map((it) => ({
        product_name: it.product_name.trim(),
        part_number: it.part_number.trim(),
        annual_volume: Number(it.annual_volume) || 0,
        quantity_unit: it.quantity_unit,
        target_price: Number(it.target_price) || 0,
        technology_requirement: it.technology_requirement,
        is_feasible: true,
      }));

      await createRfqDossierWithItems(dossierData, itemsData, currentUserEmail);

      setShowNewRfqModal(false);
      setNewCustomerName('');
      setNewCustomerAddress('');
      setNewCustomerContactPerson('');
      setNewDeliveryAddress('');
      setNewSpecialRequirements('');
      setNewNotes('');
      setNewMultiItems([{
        id: String(Date.now()),
        product_name: '',
        part_number: '',
        annual_volume: 0,
        quantity_unit: 'pcs/năm',
        target_price: 0,
        technology_requirement: 'Rèn+Gia công',
      }]);

      setMsg({ text: 'Tạo hồ sơ RFQ mới thành công!' });
      loadQuotes();
    } catch (err: any) {
      alert(`❌ LỖI TẠO RFQ TRÊN SUPABASE DB:\n${err.message || err}`);
    }
  };

  const handleParsePasteText = () => {
    if (!pasteRawText.trim()) return;
    const { dossier, items, warnings } = parseStructuredRfqText(pasteRawText);
    setPasteWarnings(warnings);

    if (dossier.customer_name) setNewCustomerName(dossier.customer_name);
    if (dossier.customer_address) setNewCustomerAddress(dossier.customer_address);
    if (dossier.customer_contact_person) setNewCustomerContactPerson(dossier.customer_contact_person);
    if (dossier.rfq_received_date) setNewRfqReceivedDate(dossier.rfq_received_date);
    if (dossier.customer_deadline) setNewCustomerDeadline(dossier.customer_deadline);
    if (dossier.trade_terms) setNewTradeTerms(dossier.trade_terms as any);
    if (dossier.delivery_address) setNewDeliveryAddress(dossier.delivery_address);

    if (items.length > 0) {
      setNewMultiItems(
        items.map((it, idx) => ({
          id: String(Date.now() + idx),
          product_name: it.product_name,
          part_number: it.part_number,
          annual_volume: it.annual_volume,
          quantity_unit: (it.quantity_unit as QuantityUnitType) || 'pcs/năm',
          target_price: it.target_price,
          technology_requirement: (it.technology_requirement as TechnologyRequirementType) || 'Rèn+Gia công',
        }))
      );
    }

    setShowPasteModal(false);
    setPasteRawText('');
  };

  const handleSelectAllQuotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuoteIds(quotes.map((q) => q.id));
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const handleToggleSelectQuote = (id: string) => {
    setSelectedQuoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportExcel = () => {
    if (quotes.length === 0) {
      alert('Không có dữ liệu để xuất Excel.');
      return;
    }

    const dataToExport = quotes.map((item, idx) => ({
      STT: idx + 1,
      'Mã RFQ': item.rfq?.rfq_code || 'N/A',
      'Mã Sản Phẩm': item.rfqItem?.item_code || 'N/A',
      'Tên Khách Hàng': item.rfq?.customer_name || 'N/A',
      'Tên Sản Phẩm': item.rfqItem?.product_name || 'N/A',
      'Part Number': item.rfqItem?.part_number || 'N/A',
      'Yêu Cầu Công Nghệ': item.rfqItem?.technology_requirement || 'N/A',
      'Sản Lượng (hàng năm)': item.rfqItem?.annual_volume || 0,
      'Đơn Vị': item.rfqItem?.quantity_unit || 'pcs/năm',
      'Giá Target (VNĐ)': item.rfqItem?.target_price || 0,
      'Đơn Giá Báo Giá (VNĐ)': item.final_quoted_price || 0,
      'Trạng Thái': item.rfqItem?.status || item.status,
      'Ngày Nhận RFQ': item.rfq?.rfq_received_date || 'N/A',
      'Deadline KH': item.rfq?.customer_deadline || 'N/A',
      'Trade Terms': item.rfq?.trade_terms || 'N/A',
      'Người Tạo': item.rfq?.created_by_email || item.created_by_email || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RFQ_Export');
    XLSX.writeFile(workbook, `DISOCO_RFQ_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[8px] text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUCCESS / ACTION BANNER WITH STAGE LINK (B2) */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-[8px] flex items-center justify-between text-xs font-medium shadow-2xs animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
          <div className="flex items-center space-x-3">
            {msg.targetStage && (
              <button
                type="button"
                onClick={() => {
                  handleStageChange(msg.targetStage!);
                  setMsg(null);
                }}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] transition-colors cursor-pointer inline-flex items-center space-x-1"
              >
                <span>Đi đến Tab Đang Xử Lý</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4 TOP CLICKABLE METRIC CARDS WITH GLOBAL DATA (A1, A2, B3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TỔNG YÊU CẦU */}
        <div
          onClick={() => handleStageChange('new')}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-slate-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TỔNG YÊU CẦU
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-[#0F172A]">
              {globalCounts.total.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-slate-500">RFQs</span>
          </div>
        </div>

        {/* Card 2: CHỜ DUYỆT KỸ THUẬT */}
        <div
          onClick={() => {
            handleStageChange('new');
            handleStatusFilterChange('PENDING_REVIEW');
          }}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-red-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              CHỜ DUYỆT KỸ THUẬT
            </span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-[#0F172A]">
              {globalCounts.pendingReview.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-slate-500">Yêu cầu</span>
          </div>
        </div>

        {/* Card 3: ĐANG TÍNH GIÁ */}
        <div
          onClick={() => {
            handleStageChange('internal');
            handleStatusFilterChange('IN_COSTING');
          }}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-amber-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ĐANG TÍNH GIÁ
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black font-mono text-[#0F172A]">
                {globalCounts.inCosting.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-slate-500">Yêu cầu</span>
            </div>
            <div className="w-10 h-0.5 bg-[#0F172A] rounded-full"></div>
          </div>
        </div>

        {/* Card 4: HOÀN THÀNH (CHỐT ĐƠN) */}
        <div
          onClick={() => {
            handleStageChange('sent');
            handleStatusFilterChange('SUCCESSFUL');
          }}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-emerald-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              HOÀN THÀNH (CHỐT ĐƠN)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-emerald-900">
              {globalCounts.successful.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-emerald-600">Thành công</span>
          </div>
        </div>
      </div>

      {/* 3 STAGE TABS (RFQ LIFECYCLE) */}
      <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-0">
        <button
          type="button"
          onClick={() => handleStageChange('new')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeStage === 'new'
              ? 'border-[#111111] text-[#111111] bg-white'
              : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 stroke-[2]" />
          <span>1. RFQ Mới / Đánh Giá</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#F5F5F5] text-[#2F3437] font-bold border border-[#EAEAEA]">
            {globalCounts.newStage}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleStageChange('internal')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeStage === 'internal'
              ? 'border-[#111111] text-[#111111] bg-white'
              : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
          <span>2. Đang Xử Lý Nội Bộ</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FBF3DB] text-[#956400] font-bold border border-[#F5E5B8]">
            {globalCounts.internalStage}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleStageChange('sent')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeStage === 'sent'
              ? 'border-[#111111] text-[#111111] bg-white'
              : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]'
          }`}
        >
          <Send className="w-3.5 h-3.5 stroke-[2]" />
          <span>3. Đã Gửi Khách Hàng</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#EDF3EC] text-[#346538] font-bold border border-[#C6E1C4]">
            {globalCounts.sentStage}
          </span>
        </button>
      </div>

      {/* MERGED STAGE TOOLBAR & PRIMARY FILTERS BAR */}
      <div className="bg-white p-3 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Search & Primary Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm khách hàng, part number..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Dynamic Status Filter per Stage */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
          >
            <option value="ALL">Tất cả Trạng Thái</option>
            {activeStage === 'new' && (
              <>
                <option value="PENDING_REVIEW">Chờ Đánh Giá Kỹ Thuật</option>
                <option value="CANCELLED_NOT_FEASIBLE">Không Khả Thi (Huỷ Ngay)</option>
              </>
            )}
            {activeStage === 'internal' && (
              <>
                <option value="IN_COSTING">Đang Tính Giá</option>
                <option value="READY_FOR_QUOTE">Sẵn Sàng Lên Báo Giá</option>
              </>
            )}
            {activeStage === 'sent' && (
              <>
                <option value="QUOTED_SENT">Đã Gửi Báo Giá</option>
                <option value="SUCCESSFUL">Thành Công (Chốt Đơn)</option>
                <option value="CANCELLED_AFTER_QUOTE">Từ Chối Sau Báo Giá</option>
              </>
            )}
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
            <option value="sawing">Phôi Cưa & GC</option>
            <option value="machining">Chỉ Gia Công CNC</option>
          </select>

          {/* Toggle: Chỉ Xem Đã Hủy */}
          <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium text-[#111111] bg-slate-50 px-2.5 py-1.5 rounded-[6px] border border-[#EAEAEA] hover:bg-slate-100 select-none">
            <input
              type="checkbox"
              checked={onlyCancelled}
              onChange={handleToggleOnlyCancelled}
              className="rounded text-[#0F172A] focus:ring-0 cursor-pointer"
            />
            <span className="font-bold text-[11px] text-slate-700">Chỉ xem Đã hủy</span>
          </label>

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

        {/* Middle Group: TAB 1 FEASIBILITY ACTION BUTTONS (Chuyển tính giá & Không phù hợp) */}
        {activeStage === 'new' && (
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px]">
            <button
              type="button"
              disabled={!canApproveFeasibility}
              onClick={handleApproveFeasibility}
              title={
                selectedQuotes.length === 0
                  ? 'Vui lòng chọn sản phẩm để chuyển tính giá'
                  : !canApproveFeasibility
                  ? 'Bạn chỉ có quyền chuyển tính giá các RFQ do chính mình tạo'
                  : `Chuyển (${selectedQuotes.length}) sản phẩm đã chọn sang giai đoạn tính giá`
              }
              className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Chuyển tính giá
            </button>

            <button
              type="button"
              disabled={!canRejectFeasibility}
              onClick={() => handleOpenItemCancelModal('CANCELLED_NOT_FEASIBLE')}
              title={
                selectedQuotes.length === 0
                  ? 'Vui lòng chọn sản phẩm để hủy'
                  : !canRejectFeasibility
                  ? 'Bạn chỉ có quyền hủy các RFQ do chính mình tạo'
                  : `Đánh dấu (${selectedQuotes.length}) sản phẩm đã chọn là không phù hợp`
              }
              className="px-3.5 py-1.5 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] font-bold rounded-[6px] text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Không phù hợp
            </button>
          </div>
        )}

        {/* Right Side: CONTEXTUAL STAGE ACTION BUTTONS */}
        <div className="flex items-center space-x-1.5">
          {/* Global Action 1: Xem Chi Tiết (Ẩn ở Tab 1) */}
          {activeStage !== 'new' && (
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
          )}

          {/* TAB 1 ACTIONS: Sửa, Xóa & + Tạo RFQ Mới */}
          {activeStage === 'new' && (
            <>
              {/* Nút Sửa Sản Phẩm */}
              <button
                type="button"
                disabled={selectedQuoteIds.length !== 1 || !canManageQuote(selectedSingleQuote)}
                onClick={() => {
                  if (selectedSingleQuote) handleOpenEditModal(selectedSingleQuote);
                }}
                title={
                  selectedQuoteIds.length !== 1
                    ? 'Vui lòng chọn đúng 1 sản phẩm để sửa'
                    : !canManageQuote(selectedSingleQuote)
                    ? 'Bạn chỉ có quyền sửa các RFQ do chính mình tạo'
                    : 'Chỉnh sửa thông tin dòng sản phẩm RFQ đã chọn'
                }
                className="p-2 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Pencil className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Nút Xóa Sản Phẩm */}
              <button
                type="button"
                disabled={selectedQuoteIds.length === 0 || !canDeleteSelected}
                onClick={handleDeleteSelectedItems}
                title={
                  selectedQuoteIds.length === 0
                    ? 'Vui lòng chọn sản phẩm để xoá'
                    : !canDeleteSelected
                    ? 'Bạn chỉ có quyền xóa các RFQ do chính mình tạo'
                    : `Xoá (${selectedQuoteIds.length}) mã sản phẩm đã chọn khỏi Supabase DB`
                }
                className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 stroke-[2]" />
              </button>

              {/* + Tạo RFQ Mới */}
              <button
                type="button"
                onClick={() => setShowNewRfqModal(true)}
                title="+ Tạo Hồ Sơ RFQ Mới (Nhập Đa Sản Phẩm)"
                className="p-2 bg-[#111111] hover:bg-[#333333] text-white rounded-[6px] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {/* TAB 2 ACTIONS: Calculator navigation & Gộp Báo Giá & Xóa */}
          {activeStage === 'internal' && (
            <>
              <button
                type="button"
                disabled={!canGoToCalculator}
                onClick={() => {
                  if (selectedSingleQuote) handleGoToCalculator(selectedSingleQuote);
                }}
                title="Đi đến Bảng Tính Giá (Calculator)"
                className="p-2 bg-[#111111] hover:bg-[#333333] text-amber-300 rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                <Calculator className="w-4 h-4" />
              </button>

              {/* Gộp Báo Giá (Strictly Validated 4 Conditions + Option B) */}
              <button
                type="button"
                disabled={Boolean(groupDisabledReason)}
                onClick={handleGroupRequest}
                title={groupDisabledReason || `Gộp (${selectedQuoteIds.length}) mã sản phẩm thành Báo Giá`}
                className="p-2 bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4] hover:bg-[#DDF0DC] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Xóa Mã Sản Phẩm (Strict Ownership Check) */}
              <button
                type="button"
                disabled={selectedQuoteIds.length === 0 || !canDeleteSelected}
                onClick={handleDeleteSelectedItems}
                title={
                  selectedQuoteIds.length === 0
                    ? 'Vui lòng chọn sản phẩm để xoá'
                    : !canDeleteSelected
                    ? 'Bạn chỉ có quyền xóa các RFQ do chính mình tạo'
                    : `Xoá (${selectedQuoteIds.length}) mã sản phẩm đã chọn khỏi Supabase DB`
                }
                className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 stroke-[2]" />
              </button>
            </>
          )}

          {/* TAB 3 ACTIONS: Commercial Status Marking */}
          {activeStage === 'sent' && (
            <>
              <button
                type="button"
                disabled={!canMarkSentStatus}
                onClick={() => {
                  if (selectedSingleQuote) handleMarkItemSuccessful(selectedSingleQuote);
                }}
                title="Đánh dấu Thành Công (Khách nhận giá & chốt đơn)"
                className="p-2 bg-[#EDF3EC] hover:bg-[#DDF0DC] text-[#346538] border border-[#C6E1C4] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!canMarkSentStatus}
                onClick={() => handleOpenItemCancelModal('CANCELLED_AFTER_QUOTE')}
                title="Đánh dấu Từ Chối / Huỷ sau báo giá"
                className="p-2 bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC] rounded-[6px] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}


          {/* Global Action 3: Export Excel */}
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
              title="Cấu hình ẩn/hiện cột bảng"
            >
              <Columns className="w-4 h-4 text-[#111111]" />
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-[10px] border border-[#EAEAEA] shadow-xl p-3 z-50 text-xs text-[#111111] space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                  <span>Ẩn/Hiện Cột Bảng</span>
                  <X
                    className="w-4 h-4 cursor-pointer text-[#787774] hover:text-[#111111]"
                    onClick={() => setShowColMenu(false)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {ALL_ITEM_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center space-x-2 p-1 hover:bg-[#F5F5F5] rounded cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenCols.includes(col.key)}
                        onChange={() => toggleColumnHidden(col.key)}
                        className="rounded text-[#111111] focus:ring-0"
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED DATA TABLE (PHYSICAL TABLE REUSE) */}
      <div className="w-full min-w-0 bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-xs">
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[#787774] font-bold uppercase tracking-wider text-[10px] select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={quotes.length > 0 && selectedQuoteIds.length === quotes.length}
                    onChange={handleSelectAllQuotes}
                    className="rounded border-slate-300 text-[#0F172A] focus:ring-0 cursor-pointer"
                  />
                </th>
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSortColumnClick(col.key)}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.header}</span>
                      {sortCol === col.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-[#0F172A]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-[#0F172A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="py-12 text-center text-[#787774]">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải danh sách báo giá...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="py-12 text-center text-[#787774]">
                    Không tìm thấy mã sản phẩm nào trong giai đoạn này.
                  </td>
                </tr>
              ) : (
                sortedQuotes.map((quote) => {
                  const isSelected = selectedQuoteIds.includes(quote.id);
                  const status = quote.rfqItem?.status || quote.status;

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => handleToggleSelectQuote(quote.id)}
                      className={`hover:bg-[#FBFBFA] transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectQuote(quote.id)}
                          className="rounded border-slate-300 text-[#0F172A] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      {visibleCols.map((col) => {
                        switch (col.key) {
                          case 'item_code':
                            return (
                              <td key={col.key} className="py-3 px-3 font-mono font-bold text-[#0F172A]">
                                {quote.rfqItem?.item_code || quote.id}
                              </td>
                            );
                          case 'customer_name':
                            return (
                              <td key={col.key} className="py-3 px-3 font-bold text-[#111111]">
                                {quote.rfq?.customer_name || 'N/A'}
                              </td>
                            );
                          case 'product_name':
                            return (
                              <td key={col.key} className="py-3 px-3 text-[#111111] font-semibold">
                                {quote.rfqItem?.product_name || 'N/A'}
                              </td>
                            );
                          case 'part_number':
                            return (
                              <td key={col.key} className="py-3 px-3 font-mono text-[#787774]">
                                {quote.rfqItem?.part_number || 'N/A'}
                              </td>
                            );
                          case 'technology_requirement':
                            return (
                              <td key={col.key} className="py-3 px-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
                                  {quote.rfqItem?.technology_requirement || 'Rèn+Gia công'}
                                </span>
                              </td>
                            );
                          case 'status':
                            return (
                              <td key={col.key} className="py-3 px-3">
                                <QuoteStatusBadge status={status} />
                              </td>
                            );
                          case 'final_quoted_price':
                            return (
                              <td key={col.key} className="py-3 px-3 font-mono font-bold text-[#0F172A]">
                                {quote.final_quoted_price
                                  ? formatCurrencyValue(quote.final_quoted_price, quote.currency || 'VND', quote.exchange_rate || 1)
                                  : '-'}
                              </td>
                            );
                          case 'annual_volume':
                            return (
                              <td key={col.key} className="py-3 px-3 font-mono text-slate-700">
                                {quote.rfqItem?.annual_volume
                                  ? `${quote.rfqItem.annual_volume.toLocaleString('vi-VN')} ${quote.rfqItem.quantity_unit || ''}`
                                  : '-'}
                              </td>
                            );
                          case 'rfq_code':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfq?.rfq_code || '-'}</td>;
                          case 'rfq_received_date':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfq?.rfq_received_date || '-'}</td>;
                          case 'customer_deadline':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfq?.customer_deadline || '-'}</td>;
                          case 'trade_terms':
                            return <td key={col.key} className="py-3 px-3 font-bold">{quote.rfq?.trade_terms || '-'}</td>;
                          case 'customer_address':
                            return <td key={col.key} className="py-3 px-3">{quote.rfq?.customer_address || '-'}</td>;
                          case 'delivery_address':
                            return <td key={col.key} className="py-3 px-3">{quote.rfq?.delivery_address || '-'}</td>;
                          case 'customer_contact_person':
                            return <td key={col.key} className="py-3 px-3">{quote.rfq?.customer_contact_person || '-'}</td>;
                          case 'target_price':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfqItem?.target_price ? formatCurrencyValue(quote.rfqItem.target_price, 'VND', 1) : '-'}</td>;
                          case 'created_by_email':
                            return <td key={col.key} className="py-3 px-3 text-slate-500">{quote.rfq?.created_by_email || quote.created_by_email || '-'}</td>;
                          case 'quoted_sent_at':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfqItem?.quoted_sent_at ? formatDate(quote.rfqItem.quoted_sent_at) : '-'}</td>;
                          case 'resolved_at':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfqItem?.resolved_at ? formatDate(quote.rfqItem.resolved_at) : '-'}</td>;
                          case 'notes':
                            return <td key={col.key} className="py-3 px-3 truncate max-w-xs">{quote.rfq?.notes || '-'}</td>;
                          default:
                            return <td key={col.key} className="py-3 px-3">-</td>;
                        }
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Controls */}
        <div className="p-3 bg-[#FBFBFA] border-t border-[#EAEAEA] flex items-center justify-between text-xs">
          <div className="text-[#787774]">
            Hiển thị <span className="font-bold text-[#111111]">{sortedQuotes.length}</span> / <span className="font-bold text-[#111111]">{totalCount}</span> dòng
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-[#EAEAEA] bg-white rounded-[4px] hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              Trang Trước
            </button>
            <span className="font-mono font-bold">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-[#EAEAEA] bg-white rounded-[4px] hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              Trang Sau
            </button>
          </div>
        </div>
      </div>

      {/* EDIT ITEM MODAL */}
      {showEditItemModal && selectedSingleQuote && (
        <Modal
          isOpen={true}
          onClose={() => setShowEditItemModal(false)}
          title="Sửa Thông Tin Sản Phẩm RFQ"
          size="md"
        >
          <form onSubmit={handleSaveEditItemSubmit} className="space-y-4 text-xs">
            <div className="bg-[#FBFBFA] p-3 rounded-[8px] border border-[#EAEAEA] space-y-1">
              <div className="text-[11px] font-bold text-[#787774]">
                Khách hàng: <span className="text-[#111111] font-semibold">{selectedSingleQuote.rfq?.customer_name}</span>
              </div>
              <div className="text-[11px] font-bold text-[#787774]">
                Mã dòng sản phẩm: <span className="font-mono text-[#111111]">{selectedSingleQuote.id}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">
                Tên Sản Phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] font-semibold text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">
                Part Number
              </label>
              <input
                type="text"
                value={editPartNumber}
                onChange={(e) => setEditPartNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">
                Yêu Cầu Công Nghệ
              </label>
              <select
                value={editTechRequirement}
                onChange={(e) => setEditTechRequirement(e.target.value as TechnologyRequirementType)}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] font-bold bg-white text-[#111111] focus:outline-none focus:border-[#111111]"
              >
                <option value="Rèn+Gia công">Phân Hệ Rèn + GC</option>
                <option value="Phôi rèn">Chỉ Phôi Rèn</option>
                <option value="Đúc+Gia công">Phân Hệ Đúc + GC</option>
                <option value="Phôi đúc">Chỉ Phôi Đúc</option>
                <option value="Phôi cưa+Gia công">Phôi Cưa + GC</option>
                <option value="Phôi cưa">Chỉ Phôi Cưa</option>
                <option value="Chỉ gia công CNC">Chỉ Gia Công CNC</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">
                  Sản Lượng Nhu Cầu
                </label>
                <input
                  type="number"
                  value={editAnnualVolume || ''}
                  onChange={(e) => setEditAnnualVolume(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">
                  Giá Target KH (VNĐ)
                </label>
                <input
                  type="number"
                  value={editTargetPrice || ''}
                  onChange={(e) => setEditTargetPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#EAEAEA]">
              <button
                type="button"
                onClick={() => setShowEditItemModal(false)}
                className="px-4 py-2 border border-[#EAEAEA] rounded-[6px] font-bold text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] cursor-pointer transition-colors shadow-xs"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAIL MODAL */}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}

      {/* CREATE DOCUMENT MODAL */}
      {showCreateDocModal && (
        <CreateDocumentModal
          selectedQuotes={selectedQuotes}
          onClose={() => setShowCreateDocModal(false)}
          onSuccess={() => {
            setShowCreateDocModal(false);
            setSelectedQuoteIds([]);
            loadQuotes();
            setMsg({ text: 'Tạo văn bản báo giá gộp thành công!' });
          }}
        />
      )}

      {/* CANCEL REASON MODAL */}
      {showCancelReasonModal && (
        <Modal isOpen={true} onClose={() => setShowCancelReasonModal(false)} title="Xác Nhận Hủy / Từ Chối RFQ">
          <form onSubmit={handleConfirmItemCancelSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#111111] mb-1">
                Lý do không khả thi / từ chối: <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="Nhập lý do kỹ thuật không rèn/đúc được hoặc lý do khách hàng hủy..."
                className="w-full p-2.5 border border-[#EAEAEA] rounded-[6px] focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelReasonModal(false)}
                className="px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#9F2F2D] hover:bg-[#7F2321] text-white font-bold rounded-[6px] cursor-pointer"
              >
                Xác Nhận Hủy
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* NEW DOSSIER QUICK ENTRY MODAL */}
      {showNewRfqModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowNewRfqModal(false)}
          title="+ Tạo Hồ Sơ RFQ Mới (Nhập Đa Sản Phẩm)"
          subtitle="Nhập thông tin chung của hồ sơ và thêm nhanh nhiều dòng sản phẩm cần báo giá."
          icon={<Plus className="w-4 h-4 stroke-[2]" />}
          headerExtra={
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[6px] text-xs shadow-sm transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Clipboard className="w-3.5 h-3.5 stroke-[2]" />
              <span>Dán Văn Bản Tự Động Extract</span>
            </button>
          }
          maxWidthClass="max-w-[1240px]"
        >
          <form onSubmit={handleCreateNewDossierSubmit} className="space-y-4 text-xs max-h-[82vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between bg-[#FBFBFA] p-3 rounded-[8px] border border-[#EAEAEA]">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Mã Hồ Sơ RFQ:</span>
                <span className="font-mono font-bold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#EAEAEA] text-xs">{newRfqCode}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">Tên Khách Hàng *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Công ty Honda Việt Nam"
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] font-semibold text-[#111111] focus:outline-none focus:border-[#111111] text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">Người Gửi RFQ (Attn)</label>
                <input
                  type="text"
                  value={newCustomerContactPerson}
                  onChange={(e) => setNewCustomerContactPerson(e.target.value)}
                  placeholder="Mr. Tanaka / Phòng Mua Hàng"
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] focus:outline-none focus:border-[#111111] text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">Trade Terms *</label>
                <select
                  required
                  value={newTradeTerms || ''}
                  onChange={(e) => setNewTradeTerms(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] font-bold text-[#111111] focus:outline-none focus:border-[#111111] bg-white text-xs"
                >
                  <option value="">-- Chọn Điều Khoản --</option>
                  <option value="EXW">EXW - Giao tại xưởng DISOCO</option>
                  <option value="FOB">FOB - Giao lên tàu cảng Hải Phòng</option>
                  <option value="CIF">CIF - Bao gồm cước biển & bảo hiểm</option>
                  <option value="DAP">DAP - Giao tại kho khách hàng</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#787774] mb-1 uppercase text-[10px] tracking-wider">Deadline Khách Hàng</label>
                <input
                  type="date"
                  value={newCustomerDeadline}
                  onChange={(e) => setNewCustomerDeadline(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] focus:outline-none focus:border-[#111111] text-xs font-mono"
                />
              </div>
            </div>

            {/* Product Items Table Layout - Single Row per Item */}
            <div className="border-t border-[#EAEAEA] pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">Danh Sách Sản Phẩm Yêu Cầu</span>
                  <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#2F3437] rounded-full text-[10px] font-mono font-bold border border-[#EAEAEA]">
                    {newMultiItems.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRowToNewDossier}
                  className="px-2.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-bold rounded-[6px] text-xs inline-flex items-center space-x-1 cursor-pointer transition-colors border border-[#EAEAEA]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Thêm Dòng Sản Phẩm</span>
                </button>
              </div>

              <div className="border border-[#EAEAEA] rounded-[8px] overflow-hidden bg-white">
                {/* Single Row Column Headers */}
                <div className="bg-[#FBFBFA] border-b border-[#EAEAEA] px-3 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold text-[#787774] uppercase tracking-wider select-none items-center">
                  <div className="col-span-1 text-center">STT</div>
                  <div className="col-span-3">Tên Sản Phẩm *</div>
                  <div className="col-span-2">Part Number</div>
                  <div className="col-span-3">Yêu Cầu Công Nghệ</div>
                  <div className="col-span-1 text-right">Sản Lượng</div>
                  <div className="col-span-1 text-right">Giá Target</div>
                  <div className="col-span-1 text-center">Xóa</div>
                </div>

                {/* Single Row per Item */}
                <div className="divide-y divide-[#EAEAEA] max-h-[380px] overflow-y-auto">
                  {newMultiItems.map((item, idx) => (
                    <div key={item.id} className="px-3 py-2 grid grid-cols-12 gap-2 items-center hover:bg-[#FBFBFA] transition-colors text-xs">
                      <div className="col-span-1 text-center font-mono font-bold text-[#787774]">
                        #{idx + 1}
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          value={item.product_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewMultiItems((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, product_name: val } : r))
                            );
                          }}
                          placeholder="VD: Trục khuỷu 4 cylinder"
                          className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.part_number}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewMultiItems((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, part_number: val } : r))
                            );
                          }}
                          placeholder="PN-13405-TK"
                          className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
                        />
                      </div>

                      <div className="col-span-3">
                        <select
                          value={item.technology_requirement}
                          onChange={(e) => {
                            const val = e.target.value as TechnologyRequirementType;
                            setNewMultiItems((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, technology_requirement: val } : r))
                            );
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs font-bold text-[#111111] focus:outline-none focus:border-[#111111]"
                        >
                          <option value="Rèn+Gia công">Phân Hệ Rèn + GC</option>
                          <option value="Phôi rèn">Chỉ Phôi Rèn</option>
                          <option value="Đúc+Gia công">Phân Hệ Đúc + GC</option>
                          <option value="Phôi đúc">Chỉ Phôi Đúc</option>
                          <option value="Phôi cưa+Gia công">Phôi Cưa + GC</option>
                          <option value="Phôi cưa">Chỉ Phôi Cưa</option>
                          <option value="Chỉ gia công CNC">Chỉ Gia Công CNC</option>
                        </select>
                      </div>

                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.annual_volume || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setNewMultiItems((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, annual_volume: val } : r))
                            );
                          }}
                          placeholder="10000"
                          className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs font-mono text-[#111111] text-right focus:outline-none focus:border-[#111111]"
                        />
                      </div>

                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.target_price || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setNewMultiItems((rows) =>
                              rows.map((r) => (r.id === item.id ? { ...r, target_price: val } : r))
                            );
                          }}
                          placeholder="45000"
                          className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs font-mono text-[#111111] text-right focus:outline-none focus:border-[#111111]"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {newMultiItems.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveRowFromNewDossier(item.id)}
                            className="p-1 text-slate-400 hover:text-[#9F2F2D] hover:bg-[#FDEBEC] rounded transition-colors cursor-pointer"
                            title="Xóa dòng"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#EAEAEA]">
              <button
                type="button"
                onClick={() => setShowNewRfqModal(false)}
                className="px-4 py-2 border border-[#EAEAEA] rounded-[6px] font-bold text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] cursor-pointer transition-colors shadow-xs"
              >
                Lưu Hồ Sơ RFQ
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PASTE TEXT SUB-MODAL */}
      {showPasteModal && (
        <Modal isOpen={true} onClose={() => setShowPasteModal(false)} title="Dán Văn Bản RFQ Tự Động Extract">
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Dán đoạn văn bản thông tin RFQ từ Email / Chat / Word vào đây. Hệ thống tự động phân tích Tên Khách Hàng, Part Number, Sản Lượng, Trade Terms:
            </p>
            <textarea
              rows={8}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder="VD: Khách hàng: Honda Vietnam, Trade term: FOB, Part number: PN-9901, Sản lượng: 20000 pcs..."
              className="w-full p-2.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs focus:outline-none focus:border-[#111111]"
            />
            {pasteWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded text-[11px] space-y-1">
                {pasteWarnings.map((w, i) => (
                  <p key={i}>⚠️ {w}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleParsePasteText}
                className="px-3 py-1.5 bg-[#111111] text-white font-bold rounded-[6px] cursor-pointer"
              >
                Trích Xuất & Điền Vào Form
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
