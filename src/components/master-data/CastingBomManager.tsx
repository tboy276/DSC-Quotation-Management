import { NEW_MATERIAL_CATEGORIES } from '../../utils/material-categories';
import { useState, useEffect } from 'react';
import type { CastingGrade, CastingBomItem, Material } from '../../types/master-data';
import {
  fetchCastingGrades,
  fetchCastingBomItems,
  saveCastingGrade,
  deleteCastingGrade,
  fetchMaterials,
  fetchPriceHistory,
  addBomItem,
  updateBomItem,
  deleteBomItems,
} from '../../lib/master-data-service';
import { calculateLiquidMetalPrice } from '../../lib/calculation-engine/liquid-metal-calculator';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { NumberTextInput } from '../../components/ui/NumberTextInput';


interface CastingBomManagerProps {
  isAdmin: boolean;
}

export const CastingBomManager = ({ isAdmin }: CastingBomManagerProps) => {
  const confirm = useConfirm();
  const [grades, setGrades] = useState<CastingGrade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [bomItems, setBomItems] = useState<CastingBomItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategoryFilter, setAddCategoryFilter] = useState('ALL');
  const [showEditWeightModal, setShowEditWeightModal] = useState(false);

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<CastingGrade | null>(null);
  const [gradeName, setGradeName] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [gradeNotes, setGradeNotes] = useState('');

  const [editingBomItem, setEditingBomItem] = useState<CastingBomItem | null>(null);

  // Form state
  const [addMaterialId, setAddMaterialId] = useState('');
  const [addWeightKg, setAddWeightKg] = useState<number>(100);
  

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
    const fetchedPriceHistory = await fetchPriceHistory();
    setGrades(fetchedGrades);
    setMaterials(fetchedMaterials);
    setPriceHistory(fetchedPriceHistory);

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
  
  const handleOpenAddGrade = () => {
    setEditingGrade(null);
    setGradeName('');
    setGradeCode('');
    setGradeNotes('');
    setShowGradeModal(true);
  };

  const handleOpenEditGrade = () => {
    const g = grades.find(x => x.id === selectedGradeId);
    if (!g) return;
    setEditingGrade(g);
    setGradeName(g.name);
    setGradeCode(g.code || '');
    setGradeNotes(g.notes || '');
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCastingGrade({
      id: editingGrade?.id,
      name: gradeName,
      code: gradeCode,
      notes: gradeNotes
    });
    setShowGradeModal(false);
    loadGradesAndMaterials(); // Refresh grades
  };

  const handleDeleteGrade = async () => {
    const g = grades.find(x => x.id === selectedGradeId);
    if (!g) return;
    
    const confirmed = await confirm({
      title: 'Xoá Mác Gang',
      message: `Bạn có chắc chắn muốn xoá mác gang "${g.name}"? Chỉ có thể xoá khi mác gang này không có thành phần BOM nào.`,
      confirmLabel: 'Xoá',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteCastingGrade(g.id, g.name);
      // Wait a bit to ensure it completes, then select the first one if possible
      const fetchedGrades = await fetchCastingGrades();
      setGrades(fetchedGrades);
      if (fetchedGrades.length > 0) {
        setSelectedGradeId(fetchedGrades[0].id);
      } else {
        setSelectedGradeId('');
        setBomItems([]);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddBomItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradeId || !addMaterialId) return;

    await addBomItem(selectedGradeId, addMaterialId, addWeightKg, false);
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
  

  // Delete BOM Items
  const handleDeleteBomItems = async (selectedRows: CastingBomItem[]) => {
    if (selectedRows.length === 0) return;
    const confirmed = await confirm({
      title: 'Xóa Thành Phần BOM',
      message: `Bạn có chắc muốn xoá ${selectedRows.length} thành phần khối mẻ nấu BOM này?`,
      confirmLabel: 'Xóa',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }

    const gradeName = grades.find((g) => g.id === selectedGradeId)?.name || '';
    await deleteBomItems(selectedRows.map(r => r.id), gradeName);
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
    currentGrade,
    bomItems,
    priceHistory,
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
          <p className="text-[10px] text-[#787774]">{item.material?.notes || item.material?.category}</p>
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
          onDoubleClick={() => isAdmin && handleOpenEditWeight(item)}
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
    
  ];

  // Toolbar Actions (NO ACTION BUTTONS INSIDE ROWS!)
  const toolbarActions: DataTableAction<CastingBomItem>[] = [
    {
      key: 'add',
      label: '+ Thêm Vật Tư Vào BOM',
      icon: <Plus className="w-3.5 h-3.5" />,
      variant: 'primary',
      enabled: () => isAdmin,
      onClick: () => {
          setAddCategoryFilter('ALL');
          if (materials.length > 0) setAddMaterialId(materials[0].id);
          else setAddMaterialId('');
          setShowAddModal(true);
        },
    },
    {
      key: 'edit',
      tooltip: 'Sửa Khối Lượng',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      variant: 'neutral',
      enabled: (count) => isAdmin && count === 1,
      onClick: (selectedRows) => handleOpenEditWeight(selectedRows[0]),
    },
    
    {
      key: 'delete',
        tooltip: 'Xoá Dòng BOM',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        variant: 'danger',
      enabled: (count) => isAdmin && count >= 1,
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
            <label className="text-xs font-bold text-[#787774] uppercase whitespace-nowrap">Mác Gang:</label>
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
            <div className="flex items-center space-x-1 pl-1">
              <ActionButton
                variant="neutral"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                title="Sửa mác gang này"
                onClick={handleOpenEditGrade}
                disabled={!selectedGradeId}
              />
              <ActionButton
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                title="Xoá mác gang này"
                onClick={handleDeleteGrade}
                disabled={!selectedGradeId}
              />
              <div className="w-px h-4 bg-[#EAEAEA] mx-1" />
              <ActionButton
                variant="primary"
                icon={<Plus className="w-3.5 h-3.5" />}
                label="Thêm Mác Gang"
                onClick={handleOpenAddGrade}
              />
            </div>
          </div>
      </div>

      
      {/* Return Scrap Material Selector */}
      {currentGrade && (
        <div className="p-4 bg-white border border-[#EAEAEA] rounded-[10px] shadow-sm mb-4">
          <label className="block text-[11px] font-bold text-[#111111] uppercase mb-2">
            Vật tư hồi liệu áp dụng cho mác gang này
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1 max-w-sm">
              <select
                value={currentGrade.return_scrap_material_id || ''}
                disabled={!isAdmin}
                onChange={async (e) => {
                  const newId = e.target.value;
                  await saveCastingGrade({ id: currentGrade.id, return_scrap_material_id: newId || null });
                  loadGradesAndMaterials();
                  loadBomItems(currentGrade.id);
                }}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                <option value="">-- Chọn vật tư hồi liệu --</option>
                {materials
                  .filter((m) => m.category === 'Hồi liệu')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.latest_price?.toLocaleString('vi-VN')} đ/kg
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-[#787774] mt-1.5 italic">
                * Để điều chỉnh đơn giá này, vào Master Data → Vật Tư → sửa giá vật tư hồi liệu tương ứng.
              </p>
            </div>
            
            {/* Cảnh báo nếu chưa gán */}
            {liquidPriceResult?.DG_cast_scrap_warning && (
              <div className="flex-1 p-3 rounded-[8px] bg-[#FFF8E6] border border-[#FDEBC8] text-[#956400] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-semibold">{liquidPriceResult.DG_cast_scrap_warning}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
            <ActionButton
              variant="neutral"
              onClick={() => setShowAddModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="add-bom-item-form"
              variant="primary"
              icon={Check}
              label="Thêm Vào BOM"
            />
          </>
        }
      >
        
          <form id="add-bom-item-form" onSubmit={handleAddBomItemSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                Lọc Theo Nhóm Vật Tư
              </label>
              <select
                value={addCategoryFilter}
                onChange={(e) => {
                  setAddCategoryFilter(e.target.value);
                  setAddMaterialId('');
                }}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
              >
                <option value="ALL">Tất cả Nhóm</option>
                {NEW_MATERIAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
                Chọn Vật Tư Nguyên Liệu
              </label>
              <select
                value={addMaterialId}
                onChange={(e) => setAddMaterialId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
                required
              >
                <option value="" disabled>-- Chọn Vật Tư --</option>
                {materials
                  .filter(m => addCategoryFilter === 'ALL' || m.category === addCategoryFilter)
                  .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.notes ? ` — ${m.notes}` : ''} — {m.latest_price?.toLocaleString('vi-VN')} đ/{m.unit}
                  </option>
                ))}
              </select>
            </div>


          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Khối Lượng Phối Trộn (kg / 1000kg)
            </label>
            <NumberTextInput
              required
              min="0.1"
              step="0.1"
              value={addWeightKg}
              onChange={(e) => setAddWeightKg(e)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-sm text-[#111111]"
            />
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
            <ActionButton
              variant="neutral"
              onClick={() => setShowEditWeightModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="edit-weight-form"
              variant="primary"
              icon={Check}
              label="Cập Nhật Khối Lượng"
            />
          </>
        }
      >
        <form id="edit-weight-form" onSubmit={handleEditWeightSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Khối Lượng Mới (kg / 1000kg mẻ nấu)
            </label>
            <NumberTextInput
              required
              min="0.1"
              step="0.1"
              value={editWeightKg}
              onChange={(e) => setEditWeightKg(e)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-base text-[#111111]"
            />
            <p className="text-[10px] text-[#787774] pt-1">
              * Tỷ lệ (%) và Thành tiền mẻ sẽ được tự động tính lại ngay lập tức.
            </p>
          </div>
        </form>
      </Modal>
    
        {/* Modal: Add/Edit Casting Grade */}
        <Modal
          isOpen={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          size="sm"
          title={editingGrade ? 'Sửa Mác Gang' : 'Thêm Mác Gang Mới'}
          footer={
            <>
              <ActionButton variant="neutral" onClick={() => setShowGradeModal(false)} label="Hủy" />
              <ActionButton variant="primary" type="submit" form="grade-form" label="Lưu Mác Gang" />
            </>
          }
        >
          <form id="grade-form" onSubmit={handleGradeSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Tên Mác Gang *</label>
              <input type="text" required value={gradeName} onChange={e => setGradeName(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-bold" placeholder="VD: FCD500-7" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Mã (Tùy chọn)</label>
              <input type="text" value={gradeCode} onChange={e => setGradeCode(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs" placeholder="Mã ngắn gọn" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">Ghi Chú</label>
              <textarea value={gradeNotes} onChange={e => setGradeNotes(e.target.value)} className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs" rows={3} placeholder="Ghi chú thêm..." />
            </div>
          </form>
        </Modal>

    </div>
  );
};
