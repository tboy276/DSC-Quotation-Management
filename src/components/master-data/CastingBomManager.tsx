import { useState, useEffect } from 'react';
import type { CastingGrade, CastingBomItem, Material } from '../../types/master-data';
import {
  fetchCastingGrades,
  fetchCastingBomItems,
  fetchMaterials,
  addBomItem,
  updateBomItem,
  deleteBomItem,
} from '../../lib/master-data-service';
import { calculateLiquidMetalPrice } from '../../lib/calculation-engine/liquid-metal-calculator';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { Modal } from '../ui/Modal';
import { Plus, Edit2, Trash2, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface CastingBomManagerProps {
  isEstimator: boolean;
}

export const CastingBomManager = ({ isEstimator }: CastingBomManagerProps) => {
  const [grades, setGrades] = useState<CastingGrade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [bomItems, setBomItems] = useState<CastingBomItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditWeightModal, setShowEditWeightModal] = useState(false);
  const [editingBomItem, setEditingBomItem] = useState<CastingBomItem | null>(null);

  // Form state
  const [addMaterialId, setAddMaterialId] = useState('');
  const [addWeightKg, setAddWeightKg] = useState<number>(100);
  const [addIsReturnScrap, setAddIsReturnScrap] = useState(false);

  const [editWeightKg, setEditWeightKg] = useState<number>(100);

  useEffect(() => {
    loadGradesAndMaterials();
  }, []);

  useEffect(() => {
    if (selectedGradeId) {
      loadBomItems(selectedGradeId);
    }
  }, [selectedGradeId]);

  const loadGradesAndMaterials = async () => {
    setLoading(true);
    const fetchedGrades = await fetchCastingGrades();
    const fetchedMaterials = await fetchMaterials();
    setGrades(fetchedGrades);
    setMaterials(fetchedMaterials);

    if (fetchedGrades.length > 0 && !selectedGradeId) {
      setSelectedGradeId(fetchedGrades[0].id);
    }
    setLoading(false);
  };

  const loadBomItems = async (gradeId: string) => {
    setLoading(true);
    const data = await fetchCastingBomItems(gradeId);
    setBomItems(data);
    setSelectedIds([]);
    setLoading(false);
  };

  // Add Item to BOM
  const handleAddBomItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradeId || !addMaterialId) return;

    await addBomItem(selectedGradeId, addMaterialId, addWeightKg, addIsReturnScrap);
    setShowAddModal(false);
    loadBomItems(selectedGradeId);
  };

  // Edit Weight Submit
  const handleEditWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBomItem) return;

    await updateBomItem(editingBomItem.id, { weight_kg: editWeightKg });
    setShowEditWeightModal(false);
    loadBomItems(selectedGradeId);
  };

  // Toggle Return Scrap Flag
  const handleToggleReturnScrap = async (item: CastingBomItem) => {
    await updateBomItem(item.id, { is_return_scrap: !item.is_return_scrap });
    loadBomItems(selectedGradeId);
  };

  // Delete BOM Items
  const handleDeleteBomItems = async (selectedRows: CastingBomItem[]) => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xoá ${selectedRows.length} thành phần khỏi mẻ nấu BOM này?`)) {
      return;
    }

    for (const item of selectedRows) {
      await deleteBomItem(item.id);
    }
    loadBomItems(selectedGradeId);
  };

  // Open Edit Weight Modal
  const handleOpenEditWeight = (item: CastingBomItem) => {
    setEditingBomItem(item);
    setEditWeightKg(item.weight_kg);
    setShowEditWeightModal(true);
  };

  // Compute BOM Summary Metrics
  const totalWeightKg = bomItems.reduce((sum, item) => sum + item.weight_kg, 0);
  const isValid1000kg = Math.abs(totalWeightKg - 1000) < 0.1;

  const currentGrade = grades.find((g) => g.id === selectedGradeId);

  // Calculation Engine Price Result for liquid metal
  const liquidPriceResult = calculateLiquidMetalPrice(
    selectedGradeId,
    bomItems,
    [],
    materials
  );

  // Column definitions for BOM Table
  const columns: DataTableColumn<CastingBomItem>[] = [
    {
      key: 'material_name',
      header: 'Thành Phần Vật Tư',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-bold text-[#111111]">{item.material?.name || 'Vật tư'}</p>
          <p className="text-[10px] text-[#787774]">{item.material?.category}</p>
        </div>
      ),
    },
    {
      key: 'weight_kg',
      header: 'Khối Lượng (kg/1000kg)',
      sortable: true,
      className: 'text-right font-mono font-extrabold text-[#111111]',
      render: (item) => (
        <div
          onDoubleClick={() => isEstimator && handleOpenEditWeight(item)}
          className="cursor-pointer hover:underline text-[#111111]"
          title="Nhấp đúp chuột để sửa khối lượng"
        >
          {item.weight_kg.toLocaleString('vi-VN')} kg
        </div>
      ),
    },
    {
      key: 'ratio_percent',
      header: 'Tỷ Lệ (%)',
      sortable: true,
      sortValue: (item) => (item.weight_kg / (totalWeightKg || 1)) * 100,
      className: 'text-right font-mono font-bold text-[#787774]',
      render: (item) => {
        const ratio = totalWeightKg > 0 ? (item.weight_kg / totalWeightKg) * 100 : 0;
        return `${ratio.toFixed(2)}%`;
      },
    },
    {
      key: 'latest_price',
      header: 'Đơn Giá Vật Tư (VNĐ/kg)',
      sortable: true,
      sortValue: (item) => item.material?.latest_price || 0,
      className: 'text-right font-mono text-[#787774]',
      render: (item) =>
        item.material?.latest_price ? item.material.latest_price.toLocaleString('vi-VN') : '-',
    },
    {
      key: 'item_total_cost',
      header: 'Thành Tiền Mẻ (VNĐ)',
      sortable: true,
      sortValue: (item) => item.weight_kg * (item.material?.latest_price || 0),
      className: 'text-right font-mono font-bold text-[#111111]',
      render: (item) => {
        const cost = item.weight_kg * (item.material?.latest_price || 0);
        return cost.toLocaleString('vi-VN');
      },
    },
    {
      key: 'is_return_scrap',
      header: 'Cờ Hồi Liệu',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
            item.is_return_scrap
              ? 'bg-[#FBF3DB] text-[#956400] border border-[#F5E5B8]'
              : 'bg-[#F0F0EE] text-[#787774]'
          }`}
        >
          {item.is_return_scrap ? 'Hồi liệu đúc' : 'Vật liệu nấu'}
        </span>
      ),
    },
  ];

  // Toolbar Actions (NO ACTION BUTTONS INSIDE ROWS!)
  const toolbarActions: DataTableAction<CastingBomItem>[] = [
    {
      key: 'add',
      label: '+ Thêm Vật Tư Vào BOM',
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: () => isEstimator,
      onClick: () => {
        if (materials.length > 0) setAddMaterialId(materials[0].id);
        setShowAddModal(true);
      },
    },
    {
      key: 'edit_weight',
      label: 'Sửa Khối Lượng',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      variant: 'secondary',
      enabled: (count) => isEstimator && count === 1,
      onClick: (selectedRows) => handleOpenEditWeight(selectedRows[0]),
    },
    {
      key: 'toggle_scrap',
      label: 'Sửa Cờ Hồi Liệu',
      icon: <RotateCcw className="w-3.5 h-3.5 text-amber-600" />,
      variant: 'secondary',
      enabled: (count) => isEstimator && count === 1,
      onClick: (selectedRows) => handleToggleReturnScrap(selectedRows[0]),
    },
    {
      key: 'delete',
      label: 'Xoá Dòng BOM',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      variant: 'danger',
      enabled: (count) => isEstimator && count >= 1,
      onClick: (selectedRows) => handleDeleteBomItems(selectedRows),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Selector: Chọn Mác Gang Nấu Đúc */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
            Quản Lý Định Mức BOM Nấu Gang Đúc (Mẻ 1000kg)
          </h2>
          <p className="text-[11px] text-[#787774]">
            Chọn mác gang đúc để xem & hiệu chỉnh tỷ lệ phối trộn các thành phần nguyên liệu
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-[#787774] uppercase">Mác Gang:</label>
          <select
            value={selectedGradeId}
            onChange={(e) => setSelectedGradeId(e.target.value)}
            className="px-3.5 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111] focus:outline-none"
          >
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Banner 1000kg Check */}
      {!isValid1000kg && (
        <div className="p-3.5 rounded-[8px] bg-[#FDEBEC] border border-[#FADBDC] text-[#9F2F2D] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              CẢNH BÁO: Tổng khối lượng các thành phần trong mẻ nấu là{' '}
              <strong className="font-mono">{totalWeightKg.toLocaleString('vi-VN')} kg</strong> (Yêu cầu phải tròn chính xác 1000kg).
            </span>
          </div>
        </div>
      )}

      {/* Calculated Unit Price Output Banner */}
      <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[10px] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[#787774] text-[10px] uppercase font-bold block">
            Mác Gang Đúc Chọn
          </span>
          <span className="font-bold text-[#111111] text-sm">
            {currentGrade?.name} ({currentGrade?.code})
          </span>
        </div>
        <div>
          <span className="text-[#787774] text-[10px] uppercase font-bold block">
            Đơn Giá Nước Gang Lỏng DG_liquid
          </span>
          <span className="font-mono font-extrabold text-[#111111] text-base">
            {Math.round(liquidPriceResult.DG_liquid).toLocaleString('vi-VN')} VNĐ/kg
          </span>
        </div>
        <div>
          <span className="text-[#787774] text-[10px] uppercase font-bold block">
            Đơn Giá Hồi Liệu Đúc DG_cast_scrap
          </span>
          <span className="font-mono font-extrabold text-[#787774] text-base">
            {Math.round(liquidPriceResult.DG_cast_scrap).toLocaleString('vi-VN')} VNĐ/kg
          </span>
        </div>
      </div>

      {/* Shared Reusable DataTable */}
      <DataTable
        tableName="casting_bom_table"
        data={bomItems}
        columns={columns}
        keyExtractor={(item) => item.id}
        toolbarActions={toolbarActions}
        selectedIds={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        loading={loading}
        emptyMessage="Mác gang này chưa có thành phần BOM nào. Bấm '+ Thêm Vật Tư Vào BOM' để bổ sung nguyên liệu."
      />

      {/* Modal 1: Add Component to BOM */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="sm"
        title={`Thêm Thành Phần Vào BOM — ${currentGrade?.name}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="add-bom-item-form"
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Thêm Vào BOM</span>
            </button>
          </>
        }
      >
        <form id="add-bom-item-form" onSubmit={handleAddBomItemSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Chọn Vật Tư Nguyên Liệu
            </label>
            <select
              value={addMaterialId}
              onChange={(e) => setAddMaterialId(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category}) — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Khối Lượng Phối Trộn (kg / 1000kg)
            </label>
            <input
              type="number"
              required
              min="0.1"
              step="0.1"
              value={addWeightKg}
              onChange={(e) => setAddWeightKg(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-sm text-[#111111]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="addReturnScrap"
              checked={addIsReturnScrap}
              onChange={(e) => setAddIsReturnScrap(e.target.checked)}
              className="rounded accent-[#111111] cursor-pointer"
            />
            <label htmlFor="addReturnScrap" className="text-xs font-semibold text-[#111111] cursor-pointer">
              Đánh dấu là Hồi liệu đúc (is_return_scrap)
            </label>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Weight of BOM Item */}
      <Modal
        isOpen={showEditWeightModal && !!editingBomItem}
        onClose={() => setShowEditWeightModal(false)}
        size="sm"
        title={`Sửa Khối Lượng BOM — ${editingBomItem?.material?.name}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowEditWeightModal(false)}
              className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-weight-form"
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Cập Nhật Khối Lượng</span>
            </button>
          </>
        }
      >
        <form id="edit-weight-form" onSubmit={handleEditWeightSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Khối Lượng Mới (kg / 1000kg mẻ nấu)
            </label>
            <input
              type="number"
              required
              min="0.1"
              step="0.1"
              value={editWeightKg}
              onChange={(e) => setEditWeightKg(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-base text-[#111111]"
            />
            <p className="text-[10px] text-[#787774] pt-1">
              * Tỷ lệ (%) và Thành tiền mẻ sẽ được tự động tính lại ngay lập tức.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
