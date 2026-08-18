import { useState, useEffect } from 'react';
import type { SystemUnitRate } from '../../types/master-data';
import { fetchSystemUnitRates, INITIAL_SYSTEM_RATES } from '../../lib/master-data-service';
import { useAuth } from '../../context/AuthContext';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { Cpu, Edit2, Zap, Truck, Layers, Check } from 'lucide-react';

export const SystemRatesManager = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [rates, setRates] = useState<SystemUnitRate[]>(INITIAL_SYSTEM_RATES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Edit Modal State
  const [editingRate, setEditingRate] = useState<SystemUnitRate | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchSystemUnitRates();
    setRates(data);
  };

  const categories = ['all', 'Sinto', 'CNC', 'Hệ thống'];

  const filteredRates = selectedCategoryFilter === 'all'
    ? rates
    : rates.filter((r) => r.category === selectedCategoryFilter);

  // Submit đơn giá chỉnh sửa
  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingRate || editValue < 0) return;

    setRates(
      rates.map((r) =>
        r.id === editingRate.id ? { ...r, value: editValue, updated_at: new Date().toISOString() } : r
      )
    );

    setEditingRate(null);
  };

  // DataTable Column Definitions
  const columns: DataTableColumn<SystemUnitRate>[] = [
    {
      key: 'rate_name',
      header: 'Tên Đơn Giá / Tham Số',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-bold text-[#111111]">{r.rate_name}</p>
          <p className="text-[10px] text-[#787774] font-mono">{r.rate_key}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân Loại',
      sortable: true,
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F0EE] text-[#111111] border border-[#EAEAEA]">
          {r.category}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Đơn Vị Tính',
      sortable: true,
      className: 'font-mono text-[#787774]',
      render: (r) => r.unit,
    },
    {
      key: 'value',
      header: 'Đơn Giá Áp Dụng (VNĐ)',
      sortable: true,
      className: 'text-right font-mono font-extrabold text-[#111111]',
      render: (r) => `${r.value.toLocaleString('vi-VN')} ${r.unit}`,
    },
  ];

  // DataTable Actions (NO ACTION BUTTONS INSIDE ROWS!)
  const toolbarActions: DataTableAction<SystemUnitRate>[] = [
    {
      key: 'edit',
      tooltip: 'Sửa Đơn Giá Mới',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      variant: 'neutral',
      enabled: (count) => isAdmin && count === 1,
      onClick: (selectedRows) => {
        setEditingRate(selectedRows[0]);
        setEditValue(selectedRows[0].value);
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#111111] text-white flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Bảng Đơn Giá Hệ Thống & Máy CNC
            </h2>
            <p className="text-[11px] text-[#787774]">
              Quản lý cước dây chuyền Sinto, gia công CNC, điện năng (DG_elec) và vận chuyển (DG_trans_kg)
            </p>
          </div>
        </div>

        {/* Filter Category */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-[#787774] uppercase">Phân loại:</label>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] text-xs font-bold text-[#111111]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tất cả Phân Loại' : `Phân loại ${cat}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sinto Rate Quick View */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Dây Chuyền Sinto</span>
            <div className="p-1 rounded bg-amber-50 text-amber-800">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#111111] font-mono">
            {(rates.find((r) => r.rate_key === 'sinto_molding')?.value || 10000).toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-[#787774] ml-1 font-sans">VNĐ/khuôn</span>
          </p>
        </div>

        {/* CNC Turning Quick View */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Máy Tiện CNC</span>
            <div className="p-1 rounded bg-blue-50 text-blue-700">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#111111] font-mono">
            {(rates.find((r) => r.rate_key === 'cnc_turning')?.value || 3500).toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-[#787774] ml-1 font-sans">VNĐ/phút</span>
          </p>
        </div>

        {/* Electricity Rate Quick View */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Đơn Giá Điện (DG_elec)</span>
            <div className="p-1 rounded bg-yellow-50 text-yellow-800">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#111111] font-mono">
            {(rates.find((r) => r.rate_key === 'elec_kwh')?.value || 2200).toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-[#787774] ml-1 font-sans">VNĐ/kWh</span>
          </p>
        </div>

        {/* Transport Rate Quick View */}
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#787774] uppercase">Vận Chuyển (DG_trans)</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-800">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[#111111] font-mono">
            {(rates.find((r) => r.rate_key === 'trans_kg')?.value || 1500).toLocaleString('vi-VN')}
            <span className="text-xs font-normal text-[#787774] ml-1 font-sans">VNĐ/kg</span>
          </p>
        </div>
      </div>

      {/* Shared Reusable DataTable */}
      <DataTable
        tableName="system_rates_table"
        data={filteredRates}
        columns={columns}
        keyExtractor={(r) => r.id}
        toolbarActions={toolbarActions}
        selectedIds={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        emptyMessage="Không tìm thấy đơn giá hệ thống phù hợp."
      />

      {/* Edit Rate Modal */}
      <Modal
        isOpen={!!editingRate}
        onClose={() => setEditingRate(null)}
        size="sm"
        title="Chỉnh Sửa Đơn Giá Hệ Thống"
        subtitle={editingRate?.rate_name}
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setEditingRate(null)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="edit-system-rate-form"
              variant="primary"
              icon={Check}
              label="Lưu Đơn Giá Mới"
            />
          </>
        }
      >
        <form id="edit-system-rate-form" onSubmit={handleSaveRate} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Đơn Giá Áp Dụng Mới ({editingRate?.unit})
            </label>
            <input
              type="number"
              required
              min="0"
              step="10"
              value={editValue}
              onChange={(e) => setEditValue(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-base text-[#111111]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
