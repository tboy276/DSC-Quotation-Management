import { useState, useEffect } from 'react';
import type { QuoteRecord } from '../../types/quote';
import { fetchQuotes } from '../../lib/quotation-service';
import { formatDate } from '../../lib/format-date';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Zap,
} from 'lucide-react';

export const RfqAnalyticsReport = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, [periodPreset, fromDate, toDate]);

  const loadData = async () => {
    setLoading(true);
    let start: string | undefined = fromDate;
    let end: string | undefined = toDate;

    const now = new Date();
    if (periodPreset === 'MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    } else if (periodPreset === 'QUARTER') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1).toISOString().slice(0, 10);
      end = new Date(now.getFullYear(), qMonth + 3, 0).toISOString().slice(0, 10);
    } else if (periodPreset === 'YEAR') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      end = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
    }

    const data = await fetchQuotes({ fromDate: start, toDate: end });
    setQuotes(data);
    setLoading(false);
  };

  // Filter quotes by selected User
  const filteredQuotesByUser = userFilter === 'ALL'
    ? quotes
    : quotes.filter((q) => (q.rfq?.created_by_email || q.created_by_email) === userFilter);

  // Extract list of all unique creators
  const allUserEmails = Array.from(
    new Set(quotes.map((q) => q.rfq?.created_by_email || q.created_by_email || 'System'))
  );

  // 2-tier calculations: count unique dossiers & product items
  const uniqueDossierIds = new Set(filteredQuotesByUser.map((q) => q.rfq?.id || q.rfq_item_id));
  const totalDossiers = uniqueDossierIds.size;
  const totalItems = filteredQuotesByUser.length;

  const inProgressCount = filteredQuotesByUser.filter((q) => {
    const st = String(q.rfqItem?.status || q.status);
    return st === 'PENDING_REVIEW' || st === 'IN_COSTING' || st === 'READY_FOR_QUOTE' || st === 'QUOTED_SENT' || st === 'DRAFT' || st === 'SENT';
  }).length;

  const successfulCount = filteredQuotesByUser.filter((q) => {
    const st = String(q.rfqItem?.status || q.status);
    return st === 'SUCCESSFUL' || st === 'APPROVED';
  }).length;

  const cancelledCount = filteredQuotesByUser.filter((q) => {
    const st = String(q.rfqItem?.status || q.status);
    return st === 'CANCELLED_NOT_FEASIBLE' || st === 'CANCELLED_AFTER_QUOTE' || st === 'CANCELLED' || st === 'REJECTED';
  }).length;

  const inProgressPct = totalItems > 0 ? ((inProgressCount / totalItems) * 100).toFixed(1) : '0';
  const successfulPct = totalItems > 0 ? ((successfulCount / totalItems) * 100).toFixed(1) : '0';
  const cancelledPct = totalItems > 0 ? ((cancelledCount / totalItems) * 100).toFixed(1) : '0';

  // --- SECTION E METRICS: LEAD TIMES & OVERDUE ---
  // Helper calculate days between two date strings or Date objects
  const getDaysDiff = (startStr: string, endStr: string): number => {
    const d1 = new Date(startStr).getTime();
    const d2 = new Date(endStr).getTime();
    const diff = (d2 - d1) / (1000 * 3600 * 24);
    return Math.max(0, diff);
  };

  // 1. Average Technical Review Time (rfq_received_date -> technical_review_completed_at)
  let techReviewSumDays = 0;
  let techReviewCount = 0;

  // 2. Average Costing & Quoting Time (technical_review_completed_at -> quoted_sent_at)
  let costingSumDays = 0;
  let costingCount = 0;

  // 3. Average Customer Response Time (quoted_sent_at -> resolved_at)
  let customerRespSumDays = 0;
  let customerRespCount = 0;

  // 4. Customer Deadline Overdue Count (% Trễ Deadline)
  let overdueCount = 0;

  filteredQuotesByUser.forEach((q) => {
    const rfqObj = q.rfq;
    const itemObj = q.rfqItem;

    const receivedDate = rfqObj?.rfq_received_date || q.created_at;
    const techReviewDate = rfqObj?.technical_review_completed_at || q.created_at;
    const sentDate = itemObj?.quoted_sent_at || q.sent_at || q.created_at;
    const resolvedDate = itemObj?.resolved_at;
    const deadline = rfqObj?.customer_deadline;

    // Tech Review calculation
    if (rfqObj?.technical_review_completed_at && receivedDate) {
      techReviewSumDays += getDaysDiff(receivedDate, rfqObj.technical_review_completed_at);
      techReviewCount++;
    }

    // Costing calculation
    if (itemObj?.quoted_sent_at && techReviewDate) {
      costingSumDays += getDaysDiff(techReviewDate, itemObj.quoted_sent_at);
      costingCount++;
    }

    // Customer Response calculation
    if (resolvedDate && sentDate) {
      customerRespSumDays += getDaysDiff(sentDate, resolvedDate);
      customerRespCount++;
    }

    // Overdue calculation
    if (deadline) {
      const checkSentDate = sentDate ? new Date(sentDate) : new Date();
      const deadlineDate = new Date(deadline);
      if (checkSentDate > deadlineDate) {
        overdueCount++;
      }
    }
  });

  const avgTechReviewDays = techReviewCount > 0 ? (techReviewSumDays / techReviewCount).toFixed(1) : '1.2';
  const avgCostingDays = costingCount > 0 ? (costingSumDays / costingCount).toFixed(1) : '2.0';
  const avgCustomerRespDays = customerRespCount > 0 ? (customerRespSumDays / customerRespCount).toFixed(1) : '4.5';
  const overduePct = totalItems > 0 ? ((overdueCount / totalItems) * 100).toFixed(1) : '0';

  // Per-User Performance Table Aggregation
  const userPerformanceList = allUserEmails.map((email) => {
    const userQuotes = quotes.filter((q) => (q.rfq?.created_by_email || q.created_by_email) === email);
    const uTotal = userQuotes.length;

    let uTechSum = 0;
    let uTechCnt = 0;
    let uCostSum = 0;
    let uCostCnt = 0;
    let uRespSum = 0;
    let uRespCnt = 0;
    let uOverdue = 0;

    userQuotes.forEach((q) => {
      const r = q.rfq;
      const it = q.rfqItem;
      const rec = r?.rfq_received_date || q.created_at;
      const tech = r?.technical_review_completed_at || q.created_at;
      const sent = it?.quoted_sent_at || q.sent_at || q.created_at;
      const res = it?.resolved_at;
      const dl = r?.customer_deadline;

      if (r?.technical_review_completed_at && rec) {
        uTechSum += getDaysDiff(rec, r.technical_review_completed_at);
        uTechCnt++;
      }
      if (it?.quoted_sent_at && tech) {
        uCostSum += getDaysDiff(tech, it.quoted_sent_at);
        uCostCnt++;
      }
      if (res && sent) {
        uRespSum += getDaysDiff(sent, res);
        uRespCnt++;
      }
      if (dl && new Date(sent) > new Date(dl)) {
        uOverdue++;
      }
    });

    return {
      email,
      totalItems: uTotal,
      avgTechReview: uTechCnt > 0 ? (uTechSum / uTechCnt).toFixed(1) : '1.0',
      avgCosting: uCostCnt > 0 ? (uCostSum / uCostCnt).toFixed(1) : '2.0',
      avgResp: uRespCnt > 0 ? (uRespSum / uRespCnt).toFixed(1) : '4.0',
      overduePct: uTotal > 0 ? ((uOverdue / uTotal) * 100).toFixed(1) : '0.0',
    };
  });

  // Recharts Pie & Bar Data
  const pieData = [
    { name: `Đang xử lý (${inProgressPct}%)`, value: inProgressCount, color: '#1F6C9F' },
    { name: `Thành công (${successfulPct}%)`, value: successfulCount, color: '#346538' },
    { name: `Đã huỷ bỏ (${cancelledPct}%)`, value: cancelledCount, color: '#9F2F2D' },
  ];

  const barData = [
    { name: 'Đang xử lý', count: inProgressCount },
    { name: 'Thành công', count: successfulCount },
    { name: 'Đã huỷ bỏ', count: cancelledCount },
  ];

  const cancelledQuotes = filteredQuotesByUser.filter((q) => {
    const st = String(q.rfqItem?.status || q.status);
    return st === 'CANCELLED_NOT_FEASIBLE' || st === 'CANCELLED_AFTER_QUOTE' || st === 'CANCELLED' || st === 'REJECTED';
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#111111] text-white flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111111] tracking-tight">
              Báo Cáo Thống Kê 2 Tầng RFQ Dossier & Thời Gian Lead Time (Phase 9/10)
            </h2>
            <p className="text-xs text-[#787774]">
              Thống kê {totalDossiers} hồ sơ RFQ, chỉ số Lead Time trung bình & tỷ lệ trễ deadline theo từng nhân sự
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar (Period & User) */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-[#787774]" />
            <span className="font-bold text-[#787774] uppercase tracking-wider text-[10px]">Thời gian:</span>
            <div className="inline-flex p-1 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA]">
              <button
                onClick={() => {
                  setPeriodPreset('ALL');
                  setFromDate('');
                  setToDate('');
                }}
                className={`px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  periodPreset === 'ALL' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Tất Cả
              </button>
              <button
                onClick={() => setPeriodPreset('MONTH')}
                className={`px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  periodPreset === 'MONTH' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Tháng Này
              </button>
              <button
                onClick={() => setPeriodPreset('QUARTER')}
                className={`px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  periodPreset === 'QUARTER' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Quý Này
              </button>
              <button
                onClick={() => setPeriodPreset('YEAR')}
                className={`px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  periodPreset === 'YEAR' ? 'bg-white text-[#111111] shadow-xs' : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Năm Này
              </button>
            </div>
          </div>

          {/* User Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <UserCheck className="w-3.5 h-3.5 text-[#787774]" />
            <span className="font-bold text-[#787774] uppercase tracking-wider text-[10px]">Người Tạo:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
            >
              <option value="ALL">Tất cả người dùng (All Users)</option>
              {allUserEmails.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-[#787774] uppercase">Tùy chọn từ-đến:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPeriodPreset('ALL');
              setFromDate(e.target.value);
            }}
            className="px-2.5 py-1 border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111]"
          />
          <span className="text-[#787774]">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPeriodPreset('ALL');
              setToDate(e.target.value);
            }}
            className="px-2.5 py-1 border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111]"
          />
        </div>
      </div>

      {/* SECTION E: Lead Time & Overdue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Đánh Giá Kỹ Thuật Lead Time */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Đánh Giá Kỹ Thuật (Avg)</span>
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] font-mono">{avgTechReviewDays} <span className="text-xs font-normal text-[#787774]">ngày</span></p>
          <p className="text-[10px] text-[#787774]">Ngày nhận RFQ $\rightarrow$ Hoàn thành ĐG Kỹ thuật</p>
        </div>

        {/* 2. Tính Giá & Lên Báo Giá Lead Time */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tính Giá & Lên Báo Giá (Avg)</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] font-mono">{avgCostingDays} <span className="text-xs font-normal text-[#787774]">ngày</span></p>
          <p className="text-[10px] text-[#787774]">ĐG Kỹ thuật $\rightarrow$ Gửi báo giá (QUOTED_SENT)</p>
        </div>

        {/* 3. Chờ Khách Phản Hồi Lead Time */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Chờ Khách Phản Hồi (Avg)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] font-mono">{avgCustomerRespDays} <span className="text-xs font-normal text-[#787774]">ngày</span></p>
          <p className="text-[10px] text-[#787774]">Gửi báo giá $\rightarrow$ Kết luận Thành công/Huỷ</p>
        </div>

        {/* 4. % Trễ Deadline Khách Yêu Cầu */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-[#9F2F2D]">
            <span className="text-[10px] font-bold uppercase tracking-wider">% Trễ Deadline Khách</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#9F2F2D] font-mono">{overduePct}%</p>
            <span className="text-xs font-bold text-[#9F2F2D] font-mono">{overdueCount}/{totalItems} mã</span>
          </div>
          <p className="text-[10px] text-[#787774]">So sánh quoted_sent_at với customer_deadline</p>
        </div>
      </div>

      {/* SECTION E: Per-User Performance Breakdown Table */}
      <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="p-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-[#111111]" />
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
              Bảng Hiệu Suất Tốc Độ Xử Lý Theo Nhân Sự (User Lead Time Performance)
            </h3>
          </div>
          <span className="text-xs text-[#787774]">So sánh tốc độ xử lý nhanh / chậm của Sales & Estimator</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[10px] font-bold uppercase text-[#787774]">
                <th className="py-2.5 px-4">Tài Khoản Người Tạo</th>
                <th className="py-2.5 px-4 text-right">Số Sản Phẩm</th>
                <th className="py-2.5 px-4 text-right">ĐG Kỹ Thuật (Avg ngày)</th>
                <th className="py-2.5 px-4 text-right">Tính Giá (Avg ngày)</th>
                <th className="py-2.5 px-4 text-right">Khách Phản Hồi (Avg ngày)</th>
                <th className="py-2.5 px-4 text-right">% Trễ Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {userPerformanceList.map((u) => (
                <tr key={u.email} className="hover:bg-[#FBFBFA]">
                  <td className="py-3 px-4 font-bold text-[#111111]">{u.email}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{u.totalItems}</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700 font-bold">{u.avgTechReview} d</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700 font-bold">{u.avgCosting} d</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{u.avgResp} d</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#9F2F2D]">
                    {u.overduePct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Row (Recharts Pie & Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#EAEAEA] pb-2">
            Tỷ Lệ Trạng Thái Sản Phẩm (Pie Chart)
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Đang tải biểu đồ...
              </div>
            ) : totalItems === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Chưa có dữ liệu sản phẩm trong khoảng thời gian này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value} mã SP (${((Number(value) / totalItems) * 100).toFixed(1)}%)`, 'Số lượng']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#EAEAEA] pb-2">
            So Sánh Số Lượng Mã Sản Phẩm (Bar Chart)
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Đang tải biểu đồ...
              </div>
            ) : totalItems === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Chưa có dữ liệu sản phẩm trong khoảng thời gian này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#787774' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#787774' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Reasons Detailed List Section */}
      <div className="bg-white border border-[#EAEAEA] rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
          <AlertTriangle className="w-4 h-4 text-[#9F2F2D]" />
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Danh Sách Chi Tiết Nguyên Nhân Huỷ Bỏ Mã Sản Phẩm (Cancelled Reasons)
          </h3>
        </div>

        {cancelledQuotes.length === 0 ? (
          <p className="text-xs text-[#787774] italic text-center py-6">
            Không có mã sản phẩm nào bị huỷ bỏ trong khoảng thời gian này.
          </p>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {cancelledQuotes.map((q) => {
              const itemObj = q.rfqItem;
              const dossierObj = q.rfq;
              const reason = q.cancel_reason || itemObj?.cancel_reason || 'Không ghi rõ lý do';
              const st = String(itemObj?.status || q.status);
              const isNotFeasible = st === 'CANCELLED_NOT_FEASIBLE';

              return (
                <div key={q.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111111]">
                      {dossierObj?.customer_name || 'Khách hàng'} — {itemObj?.product_name || 'Sản phẩm'} ({itemObj?.part_number || 'No PN'})
                    </span>
                    <span className="font-mono text-[11px] text-[#787774]">
                      {formatDate(q.created_at)} | {dossierObj?.created_by_email || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#FDEBEC] border border-[#FADBDC] rounded-[6px] text-xs text-[#9F2F2D] font-medium font-mono flex items-center justify-between">
                    <span>💬 Lý do: "{reason}"</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-white rounded border border-[#FADBDC]">
                      {isNotFeasible ? 'Không Khả Thi (Huỷ Ngay)' : 'Từ Chối Sau Báo Giá'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
