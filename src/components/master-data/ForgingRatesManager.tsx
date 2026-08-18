import { useState, useEffect } from 'react';
import type { PressingMachineRate, HydraulicHammerRate } from '../../types/master-data';
import {
  fetchPressingRates,
  fetchHammerRates,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
} from '../../lib/master-data-service';

import { useAuth } from '../../context/AuthContext';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { Workflow, Plus, Trash2, Shield, Hammer } from 'lucide-react';

export const ForgingRatesManager = () => {
  const { profile } = useAuth();
  const confirm = useConfirm();
  const isAdmin = profile?.role === 'admin';

  const [activeSubTab, setActiveSubTab] = useState<'press' | 'hammer'>('press');
  const [pressRates, setPressRates] = useState<PressingMachineRate[]>(INITIAL_PRESSING_RATES);
  const [hammerRates, setHammerRates] = useState<HydraulicHammerRate[]>(INITIAL_HAMMER_RATES);

  const [selectedPressIds, setSelectedPressIds] = useState<string[]>([]);
  const [selectedHammerIds, setSelectedHammerIds] = useState<string[]>([]);

  // Form thêm dải cước máy dập
  const [showAddPressModal, setShowAddPressModal] = useState<boolean>(false);
  const [pressMin, setPressMin] = useState<number>(2500);
  const [pressMax, setPressMax] = useState<number>(4000);
  const [pressRate, setPressRate] = useState<number>(3500000);

  // Form thêm dải cước máy búa
  const [showAddHammerModal, setShowAddHammerModal] = useState<boolean>(false);
  const [hammerMin, setHammerMin] = useState<number>(125);
  const [hammerMax, setHammerMax] = useState<number>(200);
  const [hammerRate, setHammerRate] = useState<number>(3000000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const pData = await fetchPressingRates();
    const hData = await fetchHammerRates();
    setPressRates(pData);
    setHammerRates(hData);
  };

  // Thêm dải cước máy dập
  const handleAddPressRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || pressRate <= 0) return;

    const newRate: PressingMachineRate = {
      id: `pr-${Date.now()}`,
      tonnage_min: pressMin,
      tonnage_max: pressMax,
      rate_per_hour: pressRate,
    };

    setPressRates([...pressRates, newRate].sort((a, b) => a.tonnage_min - b.tonnage_min));
    setShowAddPressModal(false);
  };

  // Xóa dải máy dập
  const handleDeleteSelectedPress = async (selectedRows: PressingMachineRate[]) => {
    if (!isAdmin || selectedRows.length === 0) return;
    const confirmed = await confirm({
      title: 'Xóa Dải Cước Máy Dập',
      message: `Bạn có chắc muốn xoá ${selectedRows.length} dải cước máy dập đã chọn?`,
      confirmLabel: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) return;
    const ids = selectedRows.map((r) => r.id);
    setPressRates(pressRates.filter((r) => !ids.includes(r.id)));

    setSelectedPressIds([]);
  };

  // Thêm dải cước máy búa
  const handleAddHammerRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || hammerRate <= 0) return;

    const newRate: HydraulicHammerRate = {
      id: `hr-${Date.now()}`,
      energy_min: hammerMin,
      energy_max: hammerMax,
      rate_per_hour: hammerRate,
    };

    setHammerRates([...hammerRates, newRate].sort((a, b) => a.energy_min - b.energy_min));
    setShowAddHammerModal(false);
  };

  // Xóa dải máy búa
  const handleDeleteSelectedHammer = async (selectedRows: HydraulicHammerRate[]) => {
    if (!isAdmin || selectedRows.length === 0) return;
    const confirmed = await confirm({
      title: 'Xóa Dải Cước Máy Búa',
      message: `Bạn có chắc muốn xoá ${selectedRows.length} dải cước máy búa đã chọn?`,
      confirmLabel: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) return;
    const ids = selectedRows.map((r) => r.id);
    setHammerRates(hammerRates.filter((r) => !ids.includes(r.id)));

    setSelectedHammerIds([]);
  };

  // Press Columns & Actions
  const pressColumns: DataTableColumn<PressingMachineRate>[] = [
    {
      key: 'tonnage_min',
      header: 'Tải Trọng Từ (Tấn)',
      sortable: true,
      className: 'font-bold font-mono text-[#111111]',
      render: (r) => `${r.tonnage_min} Tấn`,
    },
    {
      key: 'tonnage_max',
      header: 'Tải Trọng Đến (Tấn)',
      sortable: true,
      className: 'font-bold font-mono text-[#111111]',
      render: (r) => `${r.tonnage_max} Tấn`,
    },
    {
      key: 'range',
      header: 'Phạm Vi Tải Trọng Dập',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
          {r.tonnage_min} - {r.tonnage_max} Tấn
        </span>
      ),
    },
    {
      key: 'rate_per_hour',
      header: 'Đơn Giá Giờ Máy (VNĐ / Giờ)',
      sortable: true,
      className: 'text-right font-mono font-extrabold text-[#111111]',
      render: (r) => `${r.rate_per_hour.toLocaleString('vi-VN')} VNĐ / giờ`,
    },
  ];

  const pressActions: DataTableAction<PressingMachineRate>[] = [
    {
      key: 'add_press',
      label: '+ Thêm Dải Tải Trọng',
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: () => isAdmin,
      onClick: () => setShowAddPressModal(true),
    },
    {
      key: 'delete_press',
      label: 'Xoá Dải Máy Dập',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      enabled: (count) => isAdmin && count >= 1,
      onClick: (rows) => handleDeleteSelectedPress(rows),
    },
  ];

  // Hammer Columns & Actions
  const hammerColumns: DataTableColumn<HydraulicHammerRate>[] = [
    {
      key: 'energy_min',
      header: 'Năng Lượng Từ (kJ)',
      sortable: true,
      className: 'font-bold font-mono text-[#111111]',
      render: (r) => `${r.energy_min} kJ`,
    },
    {
      key: 'energy_max',
      header: 'Năng Lượng Đến (kJ)',
      sortable: true,
      className: 'font-bold font-mono text-[#111111]',
      render: (r) => `${r.energy_max} kJ`,
    },
    {
      key: 'range',
      header: 'Phạm Vi Năng Lượng Búa',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
          {r.energy_min} - {r.energy_max} kJ
        </span>
      ),
    },
    {
      key: 'rate_per_hour',
      header: 'Đơn Giá Giờ Máy (VNĐ / Giờ)',
      sortable: true,
      className: 'text-right font-mono font-extrabold text-[#111111]',
      render: (r) => `${r.rate_per_hour.toLocaleString('vi-VN')} VNĐ / giờ`,
    },
  ];

  const hammerActions: DataTableAction<HydraulicHammerRate>[] = [
    {
      key: 'add_hammer',
      label: '+ Thêm Dải Năng Lượng',
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: () => isAdmin,
      onClick: () => setShowAddHammerModal(true),
    },
    {
      key: 'delete_hammer',
      label: 'Xoá Dải Máy Búa',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      enabled: (count) => isAdmin && count >= 1,
      onClick: (rows) => handleDeleteSelectedHammer(rows),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#111111] text-white flex items-center justify-center">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Bảng Cước Giờ Máy Rèn Dập & Búa Thủy Lực
            </h2>
            <p className="text-[11px] text-[#787774]">
              Quản lý dải tải trọng/năng lượng và đơn giá giờ máy Dập & Búa Thủy Lực
            </p>
          </div>
        </div>

        {/* Sub-tab Selection */}
        <div className="flex items-center space-x-1.5 bg-[#F0F0EE] p-1 rounded-[6px] border border-[#EAEAEA]">
          <button
            onClick={() => setActiveSubTab('press')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'press'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#787774] hover:text-[#111111]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Máy Dập (Presses)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('hammer')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'hammer'
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-[#787774] hover:text-[#111111]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Máy Búa Thủy Lực</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Máy Dập */}
      {activeSubTab === 'press' && (
        <DataTable
          tableName="press_rates_table"
          data={pressRates}
          columns={pressColumns}
          keyExtractor={(r) => r.id}
          toolbarActions={pressActions}
          selectedIds={selectedPressIds}
          onSelectionChange={(ids) => setSelectedPressIds(ids)}
          emptyMessage="Chưa có dữ liệu dải cước máy dập."
        />
      )}

      {/* Tab 2: Máy Búa Khuỷu Thủy Lực */}
      {activeSubTab === 'hammer' && (
        <DataTable
          tableName="hammer_rates_table"
          data={hammerRates}
          columns={hammerColumns}
          keyExtractor={(r) => r.id}
          toolbarActions={hammerActions}
          selectedIds={selectedHammerIds}
          onSelectionChange={(ids) => setSelectedHammerIds(ids)}
          emptyMessage="Chưa có dữ liệu dải cước máy búa."
        />
      )}

      {/* Modal 1: Form Thêm dải cước Máy Dập */}
      <Modal
        isOpen={showAddPressModal}
        onClose={() => setShowAddPressModal(false)}
        size="sm"
        title="Thêm Dải Tải Trọng Máy Dập"
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setShowAddPressModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="add-press-rate-form"
              variant="primary"
              label="Lưu Dải Cước"
            />
          </>
        }
      >
        <form id="add-press-rate-form" onSubmit={handleAddPressRate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Tải Trọng Từ (Tấn)</label>
              <input
                type="number"
                required
                min="1"
                value={pressMin}
                onChange={(e) => setPressMin(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Tải Trọng Đến (Tấn)</label>
              <input
                type="number"
                required
                min="1"
                value={pressMax}
                onChange={(e) => setPressMax(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Đơn Giá Giờ Máy (VNĐ / Giờ)</label>
            <input
              type="number"
              required
              min="1"
              step="10000"
              value={pressRate}
              onChange={(e) => setPressRate(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Form Thêm dải cước Máy Búa */}
      <Modal
        isOpen={showAddHammerModal}
        onClose={() => setShowAddHammerModal(false)}
        size="sm"
        title="Thêm Dải Năng Lượng Máy Búa"
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setShowAddHammerModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="add-hammer-rate-form"
              variant="primary"
              label="Lưu Dải Cước"
            />
          </>
        }
      >
        <form id="add-hammer-rate-form" onSubmit={handleAddHammerRate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Năng Lượng Từ (kJ)</label>
              <input
                type="number"
                required
                min="1"
                value={hammerMin}
                onChange={(e) => setHammerMin(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Năng Lượng Đến (kJ)</label>
              <input
                type="number"
                required
                min="1"
                value={hammerMax}
                onChange={(e) => setHammerMax(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#787774] text-[10px] uppercase mb-1">Đơn Giá Giờ Máy (VNĐ / Giờ)</label>
            <input
              type="number"
              required
              min="1"
              step="10000"
              value={hammerRate}
              onChange={(e) => setHammerRate(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono font-bold text-sm"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
