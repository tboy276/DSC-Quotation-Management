import { useState, useEffect } from 'react';
import type { QuoteRecord } from '../../types/quote';
import { fetchQuotes } from '../../lib/quotation-service';
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
import { BarChart3, Filter, CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

export const RfqAnalyticsReport = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Time Period Filter State
  const [periodPreset, setPeriodPreset] = useState<'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

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

  // Group statistics calculations
  const totalCount = quotes.length;

  const inProgressCount = quotes.filter(
    (q) => q.status === 'DRAFT' || q.status === 'SENT' || q.rfq?.status === 'DRAFT' || q.rfq?.status === 'SENT'
  ).length;

  const successfulCount = quotes.filter(
    (q) => q.status === 'SUCCESSFUL' || q.rfq?.status === 'SUCCESSFUL'
  ).length;

  const cancelledCount = quotes.filter(
    (q) => q.status === 'CANCELLED' || q.rfq?.status === 'CANCELLED'
  ).length;

  const inProgressPct = totalCount > 0 ? ((inProgressCount / totalCount) * 100).toFixed(1) : '0';
  const successfulPct = totalCount > 0 ? ((successfulCount / totalCount) * 100).toFixed(1) : '0';
  const cancelledPct = totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : '0';

  // Recharts Pie Data
  const pieData = [
    { name: 'Đang Xử Lý (DRAFT+SENT)', value: inProgressCount, color: '#1F6C9F' },
    { name: 'Thành Công (SUCCESSFUL)', value: successfulCount, color: '#346538' },
    { name: 'Đã Huỷ (CANCELLED)', value: cancelledCount, color: '#9F2F2D' },
  ];

  // Recharts Bar Data
  const barData = [
    { name: 'Đang xử lý', count: inProgressCount },
    { name: 'Thành công', count: successfulCount },
    { name: 'Đã huỷ bỏ', count: cancelledCount },
  ];

  // Cancelled RFQs & Reasons List
  const cancelledQuotes = quotes.filter(
    (q) => q.status === 'CANCELLED' || q.rfq?.status === 'CANCELLED'
  );

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
              Báo Cáo Thống Kê Tổng Hop RFQ & Tỷ Lệ Chuyển Đổi
            </h2>
            <p className="text-xs text-[#787774]">
              Theo dõi biến động sản lượng RFQ nhận được, tỷ lệ trúng thầu và danh sách nguyên nhân huỷ bỏ
            </p>
          </div>
        </div>
      </div>

      {/* Time Period Filter Bar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs">
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
              Tất Cả Thời Gian
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

        {/* Custom Date Inputs */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-[#787774] uppercase">Tùy chọn:</span>
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

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total RFQs */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-[#787774]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tổng RFQ Nhận Được</span>
            <FileText className="w-4 h-4 text-[#111111]" />
          </div>
          <p className="text-2xl font-extrabold text-[#111111] font-mono">{totalCount}</p>
          <p className="text-[10px] text-[#787774]">Tổng số yêu cầu báo giá</p>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-[#1F6C9F]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Đang Xử Lý (DRAFT+SENT)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#1F6C9F] font-mono">{inProgressCount}</p>
            <span className="text-xs font-bold text-[#1F6C9F] font-mono">{inProgressPct}%</span>
          </div>
          <p className="text-[10px] text-[#787774]">Đang tính toán hoặc chờ phản hồi</p>
        </div>

        {/* Successful */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-[#346538]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Thành Công (SUCCESSFUL)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#346538] font-mono">{successfulCount}</p>
            <span className="text-xs font-bold text-[#346538] font-mono">{successfulPct}%</span>
          </div>
          <p className="text-[10px] text-[#787774]">Khách hàng đã chấp nhận báo giá</p>
        </div>

        {/* Cancelled */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-[#9F2F2D]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Đã Huỷ Bỏ (CANCELLED)</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-[#9F2F2D] font-mono">{cancelledCount}</p>
            <span className="text-xs font-bold text-[#9F2F2D] font-mono">{cancelledPct}%</span>
          </div>
          <p className="text-[10px] text-[#787774]">Bị huỷ hoặc từ chối báo giá</p>
        </div>
      </div>

      {/* Visual Charts Row (Recharts Pie & Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider border-b border-[#EAEAEA] pb-2">
            Tỷ Lệ Phần Trăm Theo Trạng Thái (Pie Chart)
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Đang tải biểu đồ...
              </div>
            ) : totalCount === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Chưa có dữ liệu RFQ trong khoảng thời gian này.
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
                    formatter={(value: any) => [`${value} RFQ (${((Number(value) / totalCount) * 100).toFixed(1)}%)`, 'Số lượng']}
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
            So Sánh Số Lượng RFQ (Bar Chart)
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Đang tải biểu đồ...
              </div>
            ) : totalCount === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#787774] italic">
                Chưa có dữ liệu RFQ trong khoảng thời gian này.
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
            Danh Sách Chi Tiết Nguyên Nhân Huỷ Bỏ RFQ (Cancelled Reasons)
          </h3>
        </div>

        {cancelledQuotes.length === 0 ? (
          <p className="text-xs text-[#787774] italic text-center py-6">
            Không có RFQ nào bị huỷ bỏ trong khoảng thời gian này.
          </p>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {cancelledQuotes.map((q) => {
              const rfqObj = q.rfq;
              const reason = q.cancel_reason || rfqObj?.cancel_reason || 'Không ghi rõ lý do';
              return (
                <div key={q.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111111]">
                      {rfqObj?.customer_name || 'Khách hàng'} — {rfqObj?.product_name || 'Sản phẩm'}
                    </span>
                    <span className="font-mono text-[11px] text-[#787774]">
                      {new Date(q.created_at).toLocaleDateString('vi-VN')} | {rfqObj?.created_by_email || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#FDEBEC] border border-[#FADBDC] rounded-[6px] text-xs text-[#9F2F2D] font-medium font-mono">
                    💬 Lý do: "{reason}"
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
