import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getActionLabel, formatAuditDetails } from '../lib/audit-service';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Shield } from 'lucide-react';

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
  table_name: string;
  record_id?: string;
  details?: Record<string, any>;
}

export const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

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
      key: 'table_name',
      header: 'Table',
      sortable: true,
      className: 'font-mono text-[11px] text-[#787774]',
      render: (log) => log.table_name,
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
          <div className="w-9 h-9 rounded-[6px] bg-[#111111] text-white flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Nhật Ký Hoạt Động (Audit Log)
            </h1>
            <p className="text-[11px] text-[#787774]">
              Theo dõi 100 thao tác nhạy cảm gần nhất trên hệ thống
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#EAEAEA] rounded-[6px] shadow-sm">
        <DataTable
          data={logs}
          columns={columns}
          keyExtractor={(log) => log.id}
          loading={loading}
          emptyMessage="Chưa có bản ghi nhật ký hoạt động nào."
        />
      </div>
    </div>
  );
};
