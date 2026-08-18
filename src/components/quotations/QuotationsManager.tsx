import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  generateNextRfqCode,
} from '../../lib/quotation-service';

import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { QuoteStatusBadge } from '../rfq/QuoteStatusBadge';
import { QuoteDetailModal } from '../rfq/QuoteDetailModal';
import { CreateDocumentModal } from './CreateDocumentModal';
import { formatCurrencyValue } from '../rfq/RealtimeSummaryPanel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ActionButton } from '../ui/ActionButton';
import { useConfirm } from '../../context/ConfirmDialogContext';

import { parseStructuredRfqText } from '../../utils/rfq-parser';
import { getTechFamily } from '../../utils/tech-family';
import { formatDate } from '../../lib/format-date';
import {
  FileSpreadsheet, MoreHorizontal,
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
  RefreshCw,
  Filter,
  
  Clipboard,
  Clock,
  FileText,
  ArrowRight,
  Inbox,
  SlidersHorizontal,
  Send,
  Edit2,
} from 'lucide-react';
import { canManageRecord } from '../../lib/permission-utils';

interface ColumnDef {
  key: string;
  header: string;
  defaultHidden?: boolean;
}

const ALL_ITEM_COLUMNS: ColumnDef[] = [
  { key: 'item_code', header: 'Mã Dòng Sản Phẩm' },
  { key: 'customer_name', header: 'Tên Khách Hàng' },
  { key: 'product_name', header: 'Tên Sản Phẩm' },
  { key: 'part_number', header: 'Part Number' },
  { key: 'annual_volume', header: 'Sản Lượng' },
  { key: 'technology_requirement', header: 'Yêu Cầu Công Nghệ' },
  { key: 'final_quoted_price', header: 'Đơn Giá Báo Giá' },
  { key: 'rfq_received_date', header: 'Ngày Nhận RFQ' },
  { key: 'customer_deadline', header: 'Deadline' },
  { key: 'quoted_sent_at', header: 'Ngày Gửi Báo Giá' },
  { key: 'status', header: 'Trạng Thái' },
  { key: 'resolved_at', header: 'Ngày Có Kết Luận' },
  { key: 'created_by_email', header: 'Người Tạo' },
  { key: 'rfq_code', header: 'Mã Hồ Sơ RFQ' },
  { key: 'trade_terms', header: 'Trade Term' },
  { key: 'customer_address', header: 'Địa Chỉ Khách Hàng' },
  { key: 'delivery_address', header: 'Địa Chỉ Giao Hàng' },
  { key: 'customer_contact_person', header: 'Người Gửi RFQ (Attn)' },
  { key: 'target_price', header: 'Target Price' },
  { key: 'notes', header: 'Ghi Chú' },
];

export const QuotationsManager = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { profile, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const currentUserEmail = profile?.email || user?.email || '';
  const canEdit = ['sales', 'admin'].includes(profile?.role || '');

  // 1. Stage Tab State (Synced with URL: ?stage=new|internal|sent)
  const activeStage = (searchParams.get('stage') as 'new' | 'internal' | 'sent') || 'new';

  // 2. Sub-filter Status State (Synced with URL)
  const statusFilter = (searchParams.get('status') as RfqItemStatus | 'ALL') || 'ALL';
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

  useEffect(() => {
    if (location.state?.prefillSearch) {
      setSearchQuery(location.state.prefillSearch);
    }
  }, [location.state]);

  // Advanced Filters Popover State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Default visible columns per stage
  const getDefaultVisibleCols = (stage: string) => {
    if (stage === 'new') {
      return ['item_code', 'customer_name', 'product_name', 'part_number', 'annual_volume', 'technology_requirement', 'customer_deadline', 'status', 'created_by_email'];
    }
    if (stage === 'internal') {
      return ['item_code', 'customer_name', 'product_name', 'part_number', 'annual_volume', 'technology_requirement', 'customer_deadline', 'final_quoted_price', 'status', 'created_by_email'];
    }
    return ['item_code', 'customer_name', 'product_name', 'part_number', 'annual_volume', 'technology_requirement', 'final_quoted_price', 'rfq_received_date', 'customer_deadline', 'quoted_sent_at', 'status', 'resolved_at', 'created_by_email'];
  };

  // Column Visibility State & localStorage Persistence
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`rfq_flat_table_hidden_cols_${activeStage}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    const defaultVisible = getDefaultVisibleCols(activeStage);
    return ALL_ITEM_COLUMNS.filter((c) => !defaultVisible.includes(c.key)).map((c) => c.key);
  });

  // Re-initialize hidden cols when stage changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`rfq_flat_table_hidden_cols_${activeStage}`);
      if (saved) {
        setHiddenCols(JSON.parse(saved));
        return;
      }
    } catch (e) {}
    
    const defaultVisible = getDefaultVisibleCols(activeStage);
    setHiddenCols(ALL_ITEM_COLUMNS.filter((c) => !defaultVisible.includes(c.key)).map((c) => c.key));
  }, [activeStage]);

  const [showColMenu, setShowColMenu] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(`rfq_flat_table_hidden_cols_${activeStage}`, JSON.stringify(hiddenCols));
    } catch (e) {
      // Ignore
    }
  }, [hiddenCols, activeStage]);

  const toggleColumnHidden = (key: string) => {
    setHiddenCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Helper for dynamic column visibility
  const isColVisibleInStage = (key: string) => {
    return !hiddenCols.includes(key);
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
      toast.error(`Lỗi cập nhật sản phẩm: ${err.message || err}`);
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
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  useEffect(() => {
    if (showNewRfqModal) {
      const fetchNewCode = async () => {
        setIsGeneratingCode(true);
        try {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const nextCode = await generateNextRfqCode(dateStr);
          setNewRfqCode(nextCode);
        } catch (err) {
          console.error('Lỗi khi lấy mã RFQ mới', err);
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          setNewRfqCode(`${dateStr}-XXX`);
        } finally {
          setIsGeneratingCode(false);
        }
      };
      fetchNewCode();
    }
  }, [showNewRfqModal]);

  // Handle Stage Tab Switch (URL synced)
  const handleStageChange = (newStage: 'new' | 'internal' | 'sent') => {
    setSelectedQuoteIds([]);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('stage', newStage);
    newParams.delete('status'); // Reset sub-status filter on stage change
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

  useEffect(() => {
    loadQuotes();
  }, [activeStage, statusFilter, segmentFilter, searchQuery, fromDate, toDate, currentPage, pageSize]);

  // Load specific counts for each stage
  useEffect(() => {
    const loadStageCounts = async () => {
      try {
        const counts = await fetchQuoteCounts();
        setGlobalCounts(counts);
      } catch (err) {
        console.error('Lỗi lấy số lượng thống kê', err);
      }
    };
    loadStageCounts();
  }, [activeStage, statusFilter, segmentFilter, searchQuery, fromDate, toDate, currentPage, pageSize]);

  // Refetch data when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadQuotes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeStage, statusFilter, segmentFilter, searchQuery, fromDate, toDate, currentPage, pageSize]);

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
    return canManageRecord(profile, currentUserEmail, quote);
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

  const [repricingTotalCount, setRepricingTotalCount] = useState<number | null>(null);

  useEffect(() => {
    const sourceDocId = selectedQuotes[0]?.rfq?.source_document_id;
    const rfqId = selectedQuotes[0]?.rfq?.id;
    if (sourceDocId && rfqId) {
      const fetchCount = async () => {
        const { count } = await supabase
          .from('rfq_items')
          .select('id', { count: 'exact', head: true })
          .eq('rfq_id', rfqId);
        setRepricingTotalCount(count);
      };
      fetchCount();
    } else {
      setRepricingTotalCount(null);
    }
  }, [selectedQuotes[0]?.rfq?.id, selectedQuotes[0]?.rfq?.source_document_id]);

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

    const firstRfqCode = selectedQuotes[0]?.rfq?.rfq_code || '';
    const sameRfqCode = selectedQuotes.every((q) => (q.rfq?.rfq_code || '') === firstRfqCode);
    if (!firstRfqCode || !sameRfqCode) {
      return 'Chỉ có thể gộp các sản phẩm thuộc CÙNG MỘT Mã RFQ Cha (bao gồm cùng khách hàng và cùng người tạo RFQ).';
    }

    // Technology Segment Family Check
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

    // Condition 5: Repricing constraint
    const sourceDocId = selectedQuotes[0]?.rfq?.source_document_id;
    if (sourceDocId) {
      if (repricingTotalCount === null) {
        return 'Đang kiểm tra dữ liệu tái báo giá...';
      }
      if (selectedQuotes.length !== repricingTotalCount) {
        return `RFQ này là bản tái báo giá — bắt buộc phải gộp ĐỦ toàn bộ ${repricingTotalCount} dòng sản phẩm cùng lúc, không được gộp thiếu.`;
      }
    }

    return null;
  }, [selectedQuoteIds, selectedQuotes, profile, currentUserEmail, repricingTotalCount]);

  const handleGroupRequest = () => {
    if (groupDisabledReason) return;
    setShowCreateDocModal(true);
  };

  const handleDeleteSelectedItems = async () => {
    if (!canDeleteSelected) {
      toast.error('🚫 Không thể thực hiện: Bạn chỉ có quyền xóa các RFQ do chính mình tạo.');
      return;
    }
    const selectedList = quotes.filter((q) => selectedQuoteIds.includes(q.id));
    const count = selectedList.length;

    const confirmed = await confirm({
      title: 'Xóa Vĩnh Viễn Khỏi Database',
      message: `Bạn có chắc chắn muốn xóa (${count}) mã sản phẩm RFQ đã chọn khỏi cơ sở dữ liệu Supabase không?`,
      confirmLabel: 'Xóa Vĩnh Viễn',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }

    try {
      const itemIds = selectedList.map((q) => q.rfq_item_id);
      await deleteRfqItems(itemIds);

      setSelectedQuoteIds([]);
      toast.success('Xóa dữ liệu thành công!');
      loadQuotes();
    } catch (err: any) {
      toast.error(`❌ LỖI XOÁ DỮ LIỆU THẤT BẠI TRÊN SUPABASE:\n${err.message || err}`);
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
        text: `Đã duyệt khả thi cho (${selectedQuotes.length}) sản phẩm. Đã chuyển sang "Bước 2: Đánh giá khả thi & Tính giá".`,
        targetStage: 'internal',
      });
      setSelectedQuoteIds([]);
      loadQuotes();
    } catch (err: any) {
      toast.error(`❌ Lỗi chuyển tính giá: ${err.message || err}`);
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
      const targetStatus: RfqItemStatus = activeStage === 'new' || activeStage === 'internal' ? 'CANCELLED_NOT_FEASIBLE' : 'CANCELLED_AFTER_QUOTE';
      for (const quote of selectedQuotes) {
        const targetId = quote.rfq_item_id || quote.id;
        await updateQuoteStatus(targetId, targetStatus, cancelReasonText.trim());
      }
      setShowCancelReasonModal(false);
      setSelectedQuoteIds([]);
      toast.success('Đã cập nhật trạng thái Không phù hợp.');
      loadQuotes();
    } catch (err: any) {
      toast.error(`❌ Lỗi cập nhật không phù hợp: ${err.message || err}`);
    }
  };

  const handleGoToCalculator = (quote: QuoteRecord) => {
    const tech = quote.rfqItem?.technology_requirement;
    const family = getTechFamily(tech);
    const targetSegment = family === 'unspecified' ? 'forging' : family;
    navigate(`/pricing-tools/${targetSegment}/${quote.rfq_item_id}`);
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
      toast.error('Vui lòng chọn Trade Terms trước khi lưu.');
      return;
    }
    const hasEmptyName = newMultiItems.some((it) => !it.product_name.trim());
    if (hasEmptyName) {
      toast.error('Vui lòng nhập tên sản phẩm cho tất cả các dòng.');
      return;
    }

    try {
      const dossierData = {
        customer_name: newCustomerName.trim(),
        customer_address: newCustomerAddress.trim() || undefined,
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

      const newDossier = await createRfqDossierWithItems(dossierData, itemsData, currentUserEmail);

      setMsg({ text: `Đã tạo Hồ sơ RFQ ${newDossier.rfq_code || ''} thành công với ${itemsData.length} sản phẩm!` });

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
      toast.error(`❌ LỖI TẠO RFQ TRÊN SUPABASE DB:\n${err.message || err}`);
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

  const handleExportExcel = async () => {
    if (quotes.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel.');
      return;
    }

    const XLSX = await import('xlsx');

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
      'Ngày Nhận RFQ': item.rfq?.rfq_received_date ? formatDate(item.rfq.rfq_received_date) : 'N/A',
      'Deadline KH': item.rfq?.customer_deadline ? formatDate(item.rfq.customer_deadline) : 'N/A',
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
        <div className="bg-[#FDEBEC] border border-[#FADBDC] text-[#9F2F2D] px-4 py-3 rounded-[8px] text-sm font-medium flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[#9F2F2D] hover:text-[#7A2422]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUCCESS / ACTION BANNER WITH STAGE LINK (B2) */}
      {msg && (
        <div className="bg-[#EDF3EC] border border-[#C6E1C4] text-[#346538] p-3 rounded-[8px] flex items-center justify-between text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.03)] animate-fade-in-up">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#346538] flex-shrink-0" />
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
                className="px-2.5 py-1 bg-[#346538] hover:bg-[#2b5230] text-white font-bold rounded text-[11px] transition-colors cursor-pointer inline-flex items-center space-x-1"
              >
                <span>Đi đến Bước 2</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="text-[#346538] hover:text-[#2b5230] font-bold text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4 TOP CLICKABLE METRIC CARDS WITH GLOBAL DATA (A1, A2, B3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TỔNG SỐ RFQ ĐÃ NHẬN */}
        <div
          onClick={() => handleStageChange('new')}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-slate-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TỔNG SỐ RFQ ĐÃ NHẬN
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

        {/* Card 4: ĐÃ GỬI KHÁCH HÀNG */}
        <div
          onClick={() => {
            handleStageChange('sent');
            handleStatusFilterChange('ALL');
          }}
          className="bg-white p-4 rounded-[8px] border border-[#E2E8F0] shadow-2xs relative flex flex-col justify-between h-[105px] cursor-pointer hover:border-emerald-400 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ĐÃ GỬI KHÁCH HÀNG
            </span>
            <Send className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-emerald-900">
              {globalCounts.sentStage.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-emerald-600">Báo giá</span>
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
          <span>Bước 1: Tiếp nhận RFQ</span>
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
          <span>Bước 2: Đánh giá khả thi & Tính giá</span>
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
          <span>Bước 3: Theo dõi kết quả báo giá</span>
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
                    Bộ lọc cơ bản
                  </label>
                  <div className="flex flex-col space-y-2 mb-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
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

                    <select
                      value={segmentFilter}
                      onChange={(e) => setSegmentFilter(e.target.value as any)}
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
                    >
                      <option value="ALL">Tất cả Công Nghệ</option>
                      <option value="forging">Phân Hệ Rèn Dập</option>
                      <option value="casting">Phân Hệ Đúc Gang</option>
                      <option value="sawing">Phôi Cưa & GC</option>
                      <option value="machining">Chỉ Gia Công CNC</option>
                    </select>
                  </div>
                  
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
        {activeStage === 'new' && canEdit && (
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px]">
            <ActionButton
              variant="primary"
              label="Chuyển tính giá"
              disabled={!canApproveFeasibility}
              onClick={handleApproveFeasibility}
              title={
                selectedQuotes.length === 0
                  ? 'Vui lòng chọn sản phẩm để chuyển tính giá'
                  : !canApproveFeasibility
                  ? 'Bạn chỉ có quyền chuyển tính giá các RFQ do chính mình tạo'
                  : `Chuyển (${selectedQuotes.length}) sản phẩm đã chọn sang giai đoạn tính giá`
              }
            />

            <ActionButton
                variant="danger"
                label="Không phù hợp"
                disabled={!canRejectFeasibility}
              onClick={() => handleOpenItemCancelModal('CANCELLED_NOT_FEASIBLE')}
              title={
                selectedQuotes.length === 0
                  ? 'Vui lòng chọn sản phẩm để hủy'
                  : !canRejectFeasibility
                  ? 'Bạn chỉ có quyền hủy các RFQ do chính mình tạo'
                  : `Đánh dấu (${selectedQuotes.length}) sản phẩm đã chọn là không phù hợp`
              }
            />
          </div>
        )}

        {/* Right Side: CONTEXTUAL STAGE ACTION BUTTONS */}
          <div className="flex items-center space-x-1.5">

          {/* CỤM NÚT ĐỘNG: CHỈ HIỆN KHI CÓ ÍT NHẤT 1 DÒNG ĐƯỢC CHỌN */}
          {selectedQuoteIds.length > 0 && (
            <>
              {/* Global View Detail (Hiện ở Tab 2 & Tab 3) */}
              {activeStage !== 'new' && (
                <ActionButton
                  variant="neutral"
                  icon={Eye}
                  disabled={selectedQuoteIds.length !== 1}
                  onClick={() => {
                    if (selectedSingleQuote) setSelectedQuote(selectedSingleQuote);
                  }}
                  title={selectedQuoteIds.length !== 1 ? 'Vui lòng chọn đúng 1 sản phẩm để xem chi tiết' : 'Xem chi tiết bóc tách sản phẩm'}
                />
              )}

              {/* Tab 1 Actions */}
              {activeStage === 'new' && canEdit && (
                <>
                  <ActionButton
                    variant="neutral"
                    icon={Edit2}
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
                  />

                  <ActionButton
                    variant="danger"
                    icon={Trash2}
                    disabled={!canDeleteSelected}
                    onClick={handleDeleteSelectedItems}
                    title={
                      !canDeleteSelected
                        ? 'Bạn chỉ có quyền xóa các RFQ do chính mình tạo'
                        : `Xoá (${selectedQuoteIds.length}) mã sản phẩm đã chọn khỏi Supabase DB`
                    }
                  />
                </>
              )}

              {/* Tab 2 Actions */}
              {activeStage === 'internal' && canEdit && (
                <>
                  <ActionButton
                    variant="neutral"
                    icon={Calculator}
                    disabled={selectedQuoteIds.length !== 1 || !canGoToCalculator}
                    onClick={() => {
                      if (selectedSingleQuote) handleGoToCalculator(selectedSingleQuote);
                    }}
                    title={
                      selectedQuoteIds.length !== 1
                        ? 'Vui lòng chọn đúng 1 sản phẩm để đi đến Bảng Tính Giá'
                        : !canGoToCalculator
                        ? 'Vui lòng chọn đúng 1 sản phẩm ở trạng thái Đang tính giá'
                        : 'Đi đến Bảng Tính Giá (Calculator)'
                    }
                  />

                  <ActionButton
                    variant="positive"
                    icon={Layers}
                    disabled={Boolean(groupDisabledReason)}
                    onClick={handleGroupRequest}
                    title={groupDisabledReason || `Gộp (${selectedQuoteIds.length}) mã sản phẩm thành Báo Giá`}
                  />

                  <div className="h-4 w-px bg-[#EAEAEA] mx-1" />
                    <ActionButton
                      variant="danger"
                      label="Không phù hợp"
                      disabled={!canDeleteSelected}
                    onClick={() => handleOpenItemCancelModal('CANCELLED_NOT_FEASIBLE')}
                    title={
                      selectedQuotes.length === 0
                        ? 'Vui lòng chọn sản phẩm để đánh dấu không phù hợp'
                        : !canDeleteSelected
                        ? 'Bạn chỉ có quyền đánh dấu không phù hợp cho các RFQ do chính mình tạo'
                        : `Đánh dấu (${selectedQuoteIds.length}) mã sản phẩm đã chọn là Không phù hợp`
                    }
                  />
                </>
              )}

              {/* Tab 3 Actions */}
              {activeStage === 'sent' && canEdit && (
                <>
                  <ActionButton
                    variant="positive"
                    icon={CheckCircle}
                    disabled={!canMarkSentStatus}
                    onClick={() => {
                      if (selectedSingleQuote) handleMarkItemSuccessful(selectedSingleQuote);
                    }}
                    title={!canMarkSentStatus ? 'Vui lòng chọn đúng 1 sản phẩm đã gửi báo giá' : 'Đánh dấu Thành Công (Khách nhận giá & chốt đơn)'}
                  />

                  <ActionButton
                    variant="danger"
                    icon={XCircle}
                    disabled={!canMarkSentStatus}
                    onClick={() => handleOpenItemCancelModal('CANCELLED_AFTER_QUOTE')}
                    title={!canMarkSentStatus ? 'Vui lòng chọn đúng 1 sản phẩm đã gửi báo giá' : 'Đánh dấu Từ Chối / Huỷ sau báo giá'}
                  />
                </>
              )}
            </>
          )}

          {/* CỤM NÚT TOÀN CỤC: LUÔN HIỂN THỊ KHÔNG PHỤ THUỘC VÀO SELECTION */}
          {activeStage === 'new' && canEdit && (
            <ActionButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowNewRfqModal(true)}
              title="+ Tạo Hồ Sơ RFQ Mới (Nhập Đa Sản Phẩm)"
            />
          )}


          {/* More Actions Menu */}
            <div className="relative">
              <ActionButton
                variant="neutral"
                icon={MoreHorizontal}
                onClick={() => setShowColMenu(!showColMenu)}
                title="Khác (Export, Cấu hình cột)"
              />

            {showColMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-[10px] border border-[#EAEAEA] shadow-xl p-3 z-50 text-xs text-[#111111] space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2 font-bold">
                    <span>Thao tác bảng</span>
                    <X
                      className="w-4 h-4 cursor-pointer text-[#787774] hover:text-[#111111]"
                      onClick={() => setShowColMenu(false)}
                    />
                  </div>
                  <div className="border-b border-[#EAEAEA] pb-2 mb-2">
                    <ActionButton
                      variant="neutral"
                      icon={FileSpreadsheet}
                      onClick={handleExportExcel}
                      label="Xuất Excel danh sách RFQ"
                      className="w-full justify-start text-emerald-600 border-none hover:bg-[#F5F5F5]"
                    />
                  </div>
                  <div className="text-[10px] font-bold text-[#787774] uppercase mb-2">Ẩn/Hiện Cột</div>
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
                            return (
                              <td key={col.key} className="py-3 px-3 font-mono">
                                <div className="flex items-center space-x-2">
                                  <span>{quote.rfq?.rfq_code || '-'}</span>
                                  {quote.rfq?.source_document_id && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                                      <RefreshCw className="w-3 h-3" />
                                      Tái báo giá
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          case 'rfq_received_date':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfq?.rfq_received_date ? formatDate(quote.rfq.rfq_received_date) : '-'}</td>;
                          case 'customer_deadline':
                            return <td key={col.key} className="py-3 px-3 font-mono">{quote.rfq?.customer_deadline ? formatDate(quote.rfq.customer_deadline) : '-'}</td>;
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
              <ActionButton
                variant="neutral"
                onClick={() => setShowEditItemModal(false)}
                label="Hủy"
              />
              <ActionButton
                type="submit"
                variant="primary"
                label="Lưu Thay Đổi"
              />
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
              <ActionButton
                variant="neutral"
                onClick={() => setShowCancelReasonModal(false)}
                label="Hủy"
              />
              <ActionButton
                type="submit"
                variant="danger"
                label="Xác Nhận Hủy"
              />
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
                <span className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Mã Hồ Sơ RFQ (Dự Kiến):</span>
                {isGeneratingCode ? (
                  <span className="font-mono font-bold text-[#787774] bg-white px-2 py-0.5 rounded border border-[#EAEAEA] text-xs">Đang lấy mã...</span>
                ) : (
                  <span className="font-mono font-bold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#EAEAEA] text-xs">{newRfqCode}</span>
                )}
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
              <ActionButton
                variant="neutral"
                onClick={() => setShowNewRfqModal(false)}
                label="Hủy"
              />
              <ActionButton
                type="submit"
                variant="primary"
                label="Lưu Hồ Sơ RFQ"
              />
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
              <ActionButton
                variant="neutral"
                onClick={() => setShowPasteModal(false)}
                label="Hủy"
              />
              <ActionButton
                variant="primary"
                onClick={handleParsePasteText}
                label="Trích Xuất & Điền Vào Form"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
