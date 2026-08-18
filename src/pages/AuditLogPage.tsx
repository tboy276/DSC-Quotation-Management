import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getActionLabel, formatAuditDetails } from '../lib/audit-service';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Shield, Search } from 'lucide-react';

const formatDateTime = (isoString: string) => {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

interface AuditLog {
  id: string;
  created_at: string;
  actor_email: string;
  action: string;
  record_id?: string;
  details?: Record<string, any>;
}

export const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultToDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const defaultFromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [fromDate, toDate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .gte('created_at', `${fromDate}T00:00:00+07:00`)
        .lte('created_at', `${toDate}T23:59:59+07:00`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Failed to fetch audit logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter((log) => {
      const actionLabel = getActionLabel(log.action).toLowerCase();
      const detailsText = formatAuditDetails(log.action, log.details || null).toLowerCase();
      return (
        log.actor_email.toLowerCase().includes(q) ||
        actionLabel.includes(q) ||
        detailsText.includes(q)
      );
    });
  }, [logs, searchTerm]);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Thời Gian',
      sortable: true,
      className: 'w-[180px] font-mono text-[11px] text-[#787774]',
      render: (log) => formatDateTime(log.created_at),
    },
    {
      key: 'actor_email',
      header: 'Actor',
      sortable: true,
      className: 'font-bold text-[#111111]',
      render: (log) => log.actor_email,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      className: 'font-mono text-[11px] text-[#111111]',
      render: (log) => (
        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-[4px] border border-slate-200">
          {getActionLabel(log.action)}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      className: 'max-w-xs truncate text-[11px] font-mono text-[#787774]',
      render: (log) => {
        return formatAuditDetails(log.action, log.details || null);
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#111111] text-white flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Nhật Ký Hoạt Động (Audit Log)
            </h1>
            <p className="text-[11px] text-[#787774]">
              Theo dõi thao tác nhạy cảm trên hệ thống (tối đa 1000 dòng)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2 shrink-0 text-xs font-medium text-[#111111]">
            <span>Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#787774] w-[130px]"
            />
            <span>Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 border border-[#EAEAEA] rounded-[6px] focus:outline-none focus:border-[#111111] text-[#787774] w-[130px]"
            />
          </div>

          <div className="relative w-full sm:w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#787774]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-8 pr-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#787774] font-bold">
        <span>Tổng số: {filteredLogs.length} thao tác</span>
      </div>

      <div className="bg-white border border-[#EAEAEA] rounded-[6px] shadow-sm">
        <DataTable
          data={filteredLogs}
          columns={columns}
          keyExtractor={(log) => log.id}
          loading={loading}
          emptyMessage="Chưa có bản ghi nhật ký hoạt động nào."
        />
      </div>
    </div>
  );
};
