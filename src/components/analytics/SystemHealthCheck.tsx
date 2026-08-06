import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, RefreshCw, CheckCircle2, XCircle, ShieldCheck, Database } from 'lucide-react';

interface TableCheckResult {
  tableName: string;
  description: string;
  exists: boolean;
  columnsOk: boolean;
  writeOk: boolean;
  status: 'OK' | 'ERROR';
  details: string;
}

export const SystemHealthCheck: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<TableCheckResult[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const tableSpecs: Array<{ name: string; desc: string; columns: string[]; sampleRecord: (id: string) => any }> = [
    {
      name: 'user_profiles',
      desc: 'Hồ sơ người dùng & Vai trò phân quyền',
      columns: ['id', 'email', 'full_name', 'role', 'created_at'],
      sampleRecord: (id) => ({ id, email: `test-${id}@disoco.vn`, full_name: 'Test Profile', role: 'sales' }),
    },
    {
      name: 'materials',
      desc: 'Master Data — Danh mục Vật tư / Mác thép',
      columns: ['id', 'name', 'unit', 'category', 'scrap_price', 'notes'],
      sampleRecord: (id) => ({ id, name: `Test Material ${id.slice(0, 5)}`, unit: 'kg', category: 'Gang thỏi' }),
    },
    {
      name: 'material_price_history',
      desc: 'Master Data — Lịch sử giá vật tư',
      columns: ['id', 'material_id', 'price', 'scrap_price', 'effective_date'],
      sampleRecord: (id) => ({ id, price: 10000, effective_date: '2026-01-01' }),
    },
    {
      name: 'casting_grades',
      desc: 'Master Data — Mác gang đúc (FCD450, FC250...)',
      columns: ['id', 'name', 'code', 'notes'],
      sampleRecord: (id) => ({ id, name: `Test Grade ${id.slice(0, 5)}`, code: 'FCDTEST' }),
    },
    {
      name: 'casting_bom_items',
      desc: 'Master Data — Công thức phối liệu mẻ gang 1000kg (BOM)',
      columns: ['id', 'casting_grade_id', 'material_id', 'weight_kg', 'is_return_scrap'],
      sampleRecord: (id) => ({ id, weight_kg: 100, is_return_scrap: false }),
    },
    {
      name: 'pressing_machine_rates',
      desc: 'Master Data — Cước giờ máy ép rèn',
      columns: ['id', 'tonnage_min', 'tonnage_max', 'rate_per_hour'],
      sampleRecord: (id) => ({ id, tonnage_min: 10, tonnage_max: 50, rate_per_hour: 100000 }),
    },
    {
      name: 'hydraulic_hammer_rates',
      desc: 'Master Data — Cước giờ búa rèn thủy lực',
      columns: ['id', 'energy_min', 'energy_max', 'rate_per_hour'],
      sampleRecord: (id) => ({ id, energy_min: 10, energy_max: 20, rate_per_hour: 200000 }),
    },
    {
      name: 'system_unit_rates',
      desc: 'Master Data — Đơn giá hệ thống (Sinto, CNC, Điện...)',
      columns: ['id', 'rate_key', 'rate_name', 'category', 'unit', 'value'],
      sampleRecord: (id) => ({ id, rate_key: `test_key_${id.slice(0, 5)}`, rate_name: 'Test Rate', category: 'Test', unit: 'VNĐ', value: 100 }),
    },
    {
      name: 'rfqs',
      desc: 'Hồ sơ RFQ tổng nhận từ khách hàng',
      columns: ['id', 'rfq_code', 'customer_name', 'customer_address', 'customer_contact_person', 'rfq_received_date', 'customer_deadline', 'trade_terms', 'delivery_address', 'special_requirements', 'notes', 'created_by_email'],
      sampleRecord: (id) => ({ id, customer_name: 'Test Customer', rfq_code: `TEST-${id.slice(0, 5)}`, rfq_received_date: '2026-08-03', customer_deadline: '2026-08-10' }),
    },
    {
      name: 'rfq_items',
      desc: 'Chi tiết từng dòng sản phẩm thuộc RFQ',
      columns: ['id', 'rfq_id', 'item_code', 'product_name', 'part_number', 'annual_volume', 'quantity_unit', 'target_price', 'technology_requirement', 'status', 'cancel_reason', 'quoted_sent_at'],
      sampleRecord: (id) => ({ id, product_name: 'Test Part', annual_volume: 1000, target_price: 50000, status: 'IN_COSTING' }),
    },
    {
      name: 'quotes',
      desc: 'Bản snapshot bóc tách tính giá (JSONB)',
      columns: ['id', 'rfq_item_id', 'segment', 'inputs_json', 'results_json', 'status', 'currency', 'exchange_rate', 'die_cost_treatment', 'final_quoted_price', 'created_by_email'],
      sampleRecord: (id) => ({ id, segment: 'forging', final_quoted_price: 50000, currency: 'VND', exchange_rate: 1 }),
    },
    {
      name: 'quotation_documents',
      desc: 'Văn bản báo giá gộp gửi khách hàng',
      columns: ['id', 'customer_name', 'contact_person', 'contact_email', 'quotation_date', 'trade_terms', 'currency', 'exchange_rate', 'payment_terms', 'delivery_notes', 'display_config'],
      sampleRecord: (id) => ({ id, customer_name: 'Test Customer Doc', quotation_date: '2026-08-03', trade_terms: 'FOB' }),
    },
    {
      name: 'quotation_document_items',
      desc: 'Danh sách dòng sản phẩm trong văn bản báo giá',
      columns: ['id', 'quotation_document_id', 'quote_id', 'display_order'],
      sampleRecord: (id) => ({ id, display_order: 1 }),
    },
  ];

  const runHealthCheck = async () => {
    setLoading(true);
    const checkResults: TableCheckResult[] = [];

    for (const spec of tableSpecs) {
      let exists = false;
      let columnsOk = true;
      let writeOk = false;
      const missingCols: string[] = [];
      let errDetail = '';

      try {
        // 1. Check Table Existence & Columns
        const { error } = await supabase.from(spec.name).select('*').limit(1);
        if (error) {
          if (error.code === 'PGRST205') {
            exists = false;
            errDetail = 'Bảng không tồn tại trên Supabase Database!';
          } else {
            errDetail = `Lỗi đọc bảng: [${error.code}] ${error.message}`;
          }
        } else {
          exists = true;

          // 2. Check Column Schema by selecting each column
          for (const col of spec.columns) {
            const cRes = await supabase.from(spec.name).select(col).limit(1);
            if (cRes.error) {
              columnsOk = false;
              missingCols.push(col);
            }
          }

          // 3. Test Insert/Update to test RLS write permissions
          if (spec.name === 'user_profiles') {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user) {
              const userId = authData.user.id;
              const { data: userProfile } = await supabase.from('user_profiles').select('full_name').eq('id', userId).single();
              const originalName = userProfile?.full_name || '';
              const testName = originalName + ' ';
              
              const updRes = await supabase.from('user_profiles').update({ full_name: testName }).eq('id', userId);
              if (updRes.error) {
                writeOk = false;
                if (!errDetail) errDetail = `Lỗi quyền GHI (RLS Policy/Constraint): [${updRes.error.code}] ${updRes.error.message}`;
              } else {
                writeOk = true;
                await supabase.from('user_profiles').update({ full_name: originalName }).eq('id', userId);
              }
            } else {
              writeOk = false;
              if (!errDetail) errDetail = 'Không tìm thấy user đăng nhập để test RLS.';
            }
          } else if (spec.name === 'quotation_document_items') {
            const docId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
            const { error: docErr } = await supabase.from('quotation_documents').insert({ id: docId, customer_name: 'Test Parent' });
            if (docErr) {
              writeOk = false;
              if (!errDetail) errDetail = `Lỗi tạo Document cha: ${docErr.message}`;
            } else {
              const itemId = `00000000-0000-0000-0000-${(Date.now() + 1).toString().slice(-12)}`;
              const { error: itemErr } = await supabase.from('quotation_document_items').insert({ id: itemId, quotation_document_id: docId, display_order: 1 });
              if (itemErr) {
                writeOk = false;
                if (!errDetail) errDetail = `Lỗi tạo Item con: [${itemErr.code}] ${itemErr.message}`;
              } else {
                writeOk = true;
                await supabase.from('quotation_document_items').delete().eq('id', itemId);
              }
              await supabase.from('quotation_documents').delete().eq('id', docId);
            }
          } else {
            const testId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12)}`;
            const payload = spec.sampleRecord(testId);

            const insRes = await supabase.from(spec.name).insert(payload);
            if (insRes.error) {
              writeOk = false;
              if (!errDetail) errDetail = `Lỗi quyền GHI (RLS Policy/Constraint): [${insRes.error.code}] ${insRes.error.message}`;
            } else {
              writeOk = true;
              // Clean up test row
              await supabase.from(spec.name).delete().eq('id', testId);
            }
          }
        }
      } catch (err: any) {
        errDetail = err.message || String(err);
      }

      if (!columnsOk && missingCols.length > 0) {
        errDetail = `Thiếu các cột: ${missingCols.join(', ')}. ${errDetail}`;
      }

      const isOverallOk = exists && columnsOk && writeOk;

      checkResults.push({
        tableName: spec.name,
        description: spec.desc,
        exists,
        columnsOk,
        writeOk,
        status: isOverallOk ? 'OK' : 'ERROR',
        details: isOverallOk ? 'Tất cả quyền đọc, ghi, xóa và cấu hình cột đều hoạt động hoàn hảo!' : errDetail,
      });
    }

    setResults(checkResults);
    setLastCheckTime(new Date().toLocaleTimeString('vi-VN'));
    setLoading(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const totalOk = results.filter((r) => r.status === 'OK').length;

  return (
    <div className="space-y-5 text-xs text-[#111111] animate-fade-in-up">
      {/* Header Panel */}
      <div className="bg-white p-5 rounded-[12px] border border-[#EAEAEA] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-[#111111] tracking-tight">
                Kiểm Tra Tình Trạng Kết Nối Supabase Database (Health Check)
              </h2>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono border border-slate-200">
                Estimator Only
              </span>
            </div>
            <p className="text-[11px] text-[#787774] mt-0.5">
              Tự động kiểm tra tính tồn tại của 13 bảng, sự đầy đủ của các cột schema và quyền GHI/XOÁ RLS Policy thực tế.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={runHealthCheck}
          className="px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white font-bold rounded-[6px] transition-all cursor-pointer inline-flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang Kiểm Tra...' : 'Kiểm Tra Lại Ngay'}</span>
        </button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 border border-[#EAEAEA] rounded-[8px] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Tổng Bảng Kiểm Tra</span>
            <p className="text-lg font-black font-mono text-[#111111]">{tableSpecs.length} Bảng</p>
          </div>
          <Database className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-[8px] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Số Bảng Hoạt Động Chuẩn (OK)</span>
            <p className="text-lg font-black font-mono text-emerald-900">{totalOk} / {tableSpecs.length}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>

        <div className={`p-3.5 border rounded-[8px] flex items-center justify-between ${
          totalOk === tableSpecs.length ? 'bg-white border-[#EAEAEA]' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Trạng Thái Toàn Hệ Thống</span>
            <p className={`text-sm font-black uppercase ${
              totalOk === tableSpecs.length ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {totalOk === tableSpecs.length ? '✅ Sẵn Sàng 100%' : `❌ Lỗi ${tableSpecs.length - totalOk} Bảng`}
            </p>
          </div>
          <ShieldCheck className={`w-5 h-5 ${totalOk === tableSpecs.length ? 'text-emerald-600' : 'text-rose-600'}`} />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#FBFBFA] border-b border-[#EAEAEA] flex items-center justify-between">
          <h3 className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">
            Danh Sách Chi Tiết 13 Bảng Nghiệp Vụ & Master Data
          </h3>
          {lastCheckTime && (
            <span className="text-[10px] font-mono text-[#787774]">
              Kiểm tra lần cuối lúc: {lastCheckTime}
            </span>
          )}
        </div>

        <div className="divide-y divide-[#EAEAEA]">
          {results.map((r, idx) => (
            <div key={r.tableName} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBFBFA] transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-mono font-bold text-[10px] text-slate-700 flex items-center justify-center border border-slate-200">
                    {idx + 1}
                  </span>
                  <span className="font-bold font-mono text-[#111111] text-xs">
                    public.{r.tableName}
                  </span>
                  <span className="text-[11px] text-[#787774] font-medium">
                    ({r.description})
                  </span>
                </div>
                <p className={`text-[11px] font-medium pt-0.5 pl-7 ${
                  r.status === 'OK' ? 'text-emerald-700 font-sans' : 'text-rose-700 font-mono font-semibold'
                }`}>
                  {r.details}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2 pl-7 sm:pl-0">
                {r.status === 'OK' ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-[6px] inline-flex items-center space-x-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>OK (Read/Write ✅)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-[6px] inline-flex items-center space-x-1 text-[11px]">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                    <span>LỖI KẾT NỐI ❌</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
