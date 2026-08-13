import { useState, useEffect } from 'react';
import type { Material, MaterialPriceHistory } from '../../types/master-data';
import {
  fetchMaterials,
  fetchMaterialPriceHistory,
  saveMaterial,
  deleteMaterials,
  addMaterialPrice,
  deletePriceHistoryItem,
  INITIAL_BOM_ITEMS,
} from '../../lib/master-data-service';
import { INITIAL_QUOTES } from '../../lib/quotation-service';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/DataTable';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import { Plus, Edit2, Trash2, TrendingUp, History, Check, AlertTriangle } from 'lucide-react';

interface MaterialsManagerProps {
  isAdmin: boolean;
  isSales?: boolean;
}

export const MaterialsManager = ({ isAdmin, isSales = false }: MaterialsManagerProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedMaterialForPrice, setSelectedMaterialForPrice] = useState<Material | null>(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);
  const [historyList, setHistoryList] = useState<MaterialPriceHistory[]>([]);

  // Form Fields State
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState('Thép cán - Rèn');
  const [matUnit, setMatUnit] = useState('kg');
  const [matNotes, setMatNotes] = useState('');

  // Price Form Fields State
  const [newPrice, setNewPrice] = useState<number>(22000);
  const [newScrapPrice, setNewScrapPrice] = useState<number>(8000);
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Error Alert State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchMaterials();
    setMaterials(data);
    setLoading(false);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Open Create/Edit Material Modal
  const handleOpenMaterialModal = (materialToEdit?: Material) => {
    setErrorMessage(null);
    if (materialToEdit) {
      setEditingMaterial(materialToEdit);
      setMatName(materialToEdit.name);
      setMatCategory(materialToEdit.category);
      setMatUnit(materialToEdit.unit);
      setMatNotes(materialToEdit.notes || '');
    } else {
      setEditingMaterial(null);
      setMatName('');
      setMatCategory('Thép cán - Rèn');
      setMatUnit('kg');
      setMatNotes('');
    }
    setShowMaterialModal(true);
  };

  // Save Material
  const handleSaveMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    await saveMaterial({
      id: editingMaterial?.id,
      name: matName,
      category: matCategory,
      unit: matUnit,
      notes: matNotes,
    });

    setShowMaterialModal(false);
    loadData();
  };

  // Delete Material Validation (Check if in use in BOM or Quotes)
  const handleDeleteSelectedMaterials = async (selectedRows: Material[]) => {
    setErrorMessage(null);
    if (selectedRows.length === 0) return;

    // Validation: Check usage in BOM or Quotes
    const inUseDetails: string[] = [];

    for (const mat of selectedRows) {
      // 1. Check BOM items
      const bomUsage = INITIAL_BOM_ITEMS.filter((b) => b.material_id === mat.id);
      if (bomUsage.length > 0) {
        inUseDetails.push(`Vật tư "${mat.name}" đang thuộc BOM mẻ nấu đúc gang (${bomUsage.length} thành phần).`);
      }

      // 2. Check Quotes
      const quoteUsage = INITIAL_QUOTES.filter(
        (q: any) =>
          q.inputs_json?.selected_material_id === mat.id ||
          q.inputs_json?.selected_material === mat.name
      );
      if (quoteUsage.length > 0) {
        inUseDetails.push(`Vật tư "${mat.name}" đang được sử dụng trong ${quoteUsage.length} báo giá.`);
      }
    }

    if (inUseDetails.length > 0) {
      setErrorMessage(`Không thể xoá vật tư vì dữ liệu đang được liên kết:\n- ${inUseDetails.join('\n- ')}`);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedRows.length} vật tư đã chọn?`)) {
      return;
    }

    await deleteMaterials(selectedRows.map((m) => m.id));
    setSelectedIds([]);
    loadData();
  };

  // Open Add Price Modal
  const handleOpenPriceModal = (material: Material) => {
    setSelectedMaterialForPrice(material);
    setNewPrice(material.latest_price || 22000);
    setNewScrapPrice(material.scrap_price || 8000);
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setShowPriceModal(true);
  };

  // Save New Price History
  const handleSavePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForPrice) return;

    const isForgingSteel = selectedMaterialForPrice.category === 'Thép cán - Rèn';

    await addMaterialPrice(
      selectedMaterialForPrice.id,
      newPrice,
      effectiveDate,
      isForgingSteel ? newScrapPrice : undefined
    );

    setShowPriceModal(false);
    loadData();
  };

  // Open View History Modal
  const handleOpenHistoryModal = async (material: Material) => {
    setHistoryMaterial(material);
    const history = await fetchMaterialPriceHistory(material.id);
    setHistoryList(history);
    setShowHistoryModal(true);
  };

  // Delete Price History Row
  const handleDeleteHistoryRow = async (historyId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá dòng lịch sử giá này?')) return;
    await deletePriceHistoryItem(historyId);
    if (historyMaterial) {
      const updated = await fetchMaterialPriceHistory(historyMaterial.id);
      setHistoryList(updated);
      loadData();
    }
  };

  // DataTable Column Definitions
  const columns: DataTableColumn<Material>[] = [
    {
      key: 'name',
      header: 'Tên Vật Tư / Quy Cách',
      sortable: true,
      render: (m) => (
        <div>
          <p className="font-bold text-[#111111]">{m.name}</p>
          {m.notes && <p className="text-[10px] text-[#787774] italic">{m.notes}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Nhóm Vật Tư',
      sortable: true,
      render: (m) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F0EE] text-[#111111] border border-[#EAEAEA]">
          {m.category}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'ĐVT',
      sortable: true,
      className: 'font-mono text-center',
      render: (m) => m.unit,
    },
    {
      key: 'latest_price',
      header: 'Đơn Giá Hiện Tại (VNĐ)',
      sortable: true,
      sortValue: (m) => m.latest_price || 0,
      className: 'text-right font-mono font-extrabold text-[#111111]',
      render: (m) => (m.latest_price ? m.latest_price.toLocaleString('vi-VN') : '-'),
    },
    {
      key: 'scrap_price',
      header: 'Giá Phế Kèm Theo (VNĐ)',
      sortable: true,
      sortValue: (m) => m.scrap_price || 0,
      className: 'text-right font-mono text-[#787774]',
      render: (m) =>
        m.category === 'Thép cán - Rèn' ? (
          m.scrap_price ? (
            m.scrap_price.toLocaleString('vi-VN')
          ) : (
            '-'
          )
        ) : (
          <span className="text-[10px] italic text-[#787774]">Không áp dụng</span>
        ),
    },
  ];

  // DataTable Top Toolbar Actions (NO ACTION BUTTONS INSIDE ROWS!)
  const toolbarActions: DataTableAction<Material>[] = [
    {
      key: 'create',
      label: 'Thêm Mới',
      icon: <Plus className="w-3.5 h-3.5" />,
      tooltip: 'Thêm vật tư mới',
      variant: 'primary',
      enabled: () => isAdmin,
      onClick: () => handleOpenMaterialModal(),
    },
    {
      key: 'edit',
      label: 'Sửa',
      icon: <Edit2 className="w-3.5 h-3.5" />,
      tooltip: 'Sửa thông tin vật tư đã chọn',
      variant: 'secondary',
      enabled: (count) => isAdmin && count === 1,
      onClick: (selectedRows) => handleOpenMaterialModal(selectedRows[0]),
    },
    {
      key: 'new_price',
      label: 'Cập Nhật Giá',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
      tooltip: 'Cập nhật giá vật tư mới',
      variant: 'primary',
      enabled: (count) => (isAdmin || isSales) && count === 1,
      onClick: (selectedRows) => handleOpenPriceModal(selectedRows[0]),
    },
    {
      key: 'view_history',
      label: 'Lịch Sử Giá',
      icon: <History className="w-3.5 h-3.5" />,
      tooltip: 'Xem biến động lịch sử giá',
      variant: 'secondary',
      enabled: (count) => count === 1,
      onClick: (selectedRows) => handleOpenHistoryModal(selectedRows[0]),
    },
    {
      key: 'delete',
      label: 'Xoá',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      tooltip: 'Xoá vật tư đã chọn (bắt buộc xác nhận)',
      variant: 'danger',
      enabled: (count) => isAdmin && count >= 1,
      onClick: (selectedRows) => handleDeleteSelectedMaterials(selectedRows),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-[#FDEBEC] border border-[#FADBDC] rounded-[8px] text-[#9F2F2D] text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Không thể thực hiện thao tác xoá:</span>
          </div>
          <p className="whitespace-pre-line pl-6 font-mono text-[11px]">{errorMessage}</p>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center space-x-2 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm vật tư, mác thép, mã..."
            className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-medium text-[#111111] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-bold text-[#787774] uppercase">Lọc nhóm:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
          >
            <option value="ALL">Tất cả Nhóm</option>
            <option value="Thép cán - Rèn">Thép cán - Rèn</option>
            <option value="Gang thỏi">Gang thỏi</option>
            <option value="Thép phế đúc">Thép phế đúc</option>
            <option value="Hồi liệu">Hồi liệu</option>
            <option value="Fe-Si">Fe-Si</option>
          </select>
        </div>
      </div>

      {/* Shared Reusable DataTable */}
      <DataTable
        tableName="materials_table"
        data={filteredMaterials}
        columns={columns}
        keyExtractor={(m) => m.id}
        toolbarActions={toolbarActions}
        selectedIds={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        loading={loading}
        emptyMessage="Không tìm thấy vật tư nào."
      />

      {/* Modal 1: Create / Edit Material */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        size="sm"
        title={editingMaterial ? 'Sửa Thông Tin Vật Tư' : 'Thêm Vật Tư Mới'}
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setShowMaterialModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="save-material-form"
              variant="primary"
              icon={Check}
              label="Lưu Thông Tin"
            />
          </>
        }
      >
        <form id="save-material-form" onSubmit={handleSaveMaterialSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Tên Vật Tư / Mác Thép
            </label>
            <input
              type="text"
              required
              value={matName}
              onChange={(e) => setMatName(e.target.value)}
              placeholder="Ví dụ: S45C - JFE (Nhật Bản)"
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-bold text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Nhóm Vật Tư
            </label>
            <select
              value={matCategory}
              onChange={(e) => setMatCategory(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] bg-white text-xs font-bold text-[#111111]"
            >
              <option value="Thép cán - Rèn">Thép cán - Rèn</option>
              <option value="Gang thỏi">Gang thỏi</option>
              <option value="Thép phế đúc">Thép phế đúc</option>
              <option value="Hồi liệu">Hồi liệu</option>
              <option value="Fe-Si">Fe-Si</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Đơn Vị Tính (ĐVT)
            </label>
            <input
              type="text"
              required
              value={matUnit}
              onChange={(e) => setMatUnit(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Ghi Chú
            </label>
            <textarea
              rows={2}
              value={matNotes}
              onChange={(e) => setMatNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111]"
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add New Price Entry (+ Giá Mới) */}
      <Modal
        isOpen={showPriceModal && !!selectedMaterialForPrice}
        onClose={() => setShowPriceModal(false)}
        size="sm"
        title={`Cập Nhật Giá Mới — ${selectedMaterialForPrice?.name}`}
        subtitle="Thêm dòng mới vào lịch sử giá"
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setShowPriceModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="submit"
              form="save-price-form"
              variant="primary"
              icon={Check}
              label="Lưu Giá Mới"
            />
          </>
        }
      >
        <form id="save-price-form" onSubmit={handleSavePriceSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Đơn Giá Mới (VNĐ / {selectedMaterialForPrice?.unit})
            </label>
            <input
              type="number"
              required
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-sm text-[#111111]"
            />
          </div>

          {/* Special Field for Forging Steel Category: Scrap Price */}
          {selectedMaterialForPrice?.category === 'Thép cán - Rèn' && (
            <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-1">
              <label className="block text-[10px] font-bold text-[#956400] uppercase">
                Giá Phế Liệu Kèm Theo (VNĐ / {selectedMaterialForPrice.unit}) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={newScrapPrice}
                onChange={(e) => setNewScrapPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] bg-white rounded-[6px] font-mono font-bold text-xs text-[#111111]"
              />
              <p className="text-[9px] text-[#787774]">
                * Áp dụng riêng cho vật tư nhóm "Thép cán - Rèn" để tính trừ thu hồi bavia rèn.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase mb-1">
              Ngày Hiệu Lực
            </label>
            <input
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111]"
            />
          </div>
        </form>
      </Modal>

      {/* Modal 3: View & Edit Price History */}
      <Modal
        isOpen={showHistoryModal && !!historyMaterial}
        onClose={() => setShowHistoryModal(false)}
        size="lg"
        title={`Lịch Sử Đơn Giá — ${historyMaterial?.name}`}
        subtitle={`Nhóm: ${historyMaterial?.category} | ĐVT: ${historyMaterial?.unit}`}
        footer={
          <ActionButton
            variant="primary"
            onClick={() => setShowHistoryModal(false)}
            label="Đóng"
          />
        }
      >
        <div className="space-y-2">
          <table className="w-full border-collapse text-left border border-[#EAEAEA]">
            <thead>
              <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[10px] font-bold uppercase text-[#787774]">
                <th className="p-2">Ngày Hiệu Lực</th>
                <th className="p-2 text-right">Đơn Giá (VNĐ)</th>
                {historyMaterial?.category === 'Thép cán - Rèn' && (
                  <th className="p-2 text-right">Giá Phế Kèm Theo (VNĐ)</th>
                )}
                <th className="p-2">Người Cập Nhật</th>
                <th className="p-2 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[#787774] italic">
                    Chưa có lịch sử đơn giá.
                  </td>
                </tr>
              ) : (
                historyList.map((h) => (
                  <tr key={h.id} className="hover:bg-[#FBFBFA]">
                    <td className="p-2 font-mono font-bold">{h.effective_date}</td>
                    <td className="p-2 text-right font-mono font-extrabold text-[#111111]">
                      {h.price.toLocaleString('vi-VN')}
                    </td>
                    {historyMaterial?.category === 'Thép cán - Rèn' && (
                      <td className="p-2 text-right font-mono text-[#787774]">
                        {h.scrap_price ? h.scrap_price.toLocaleString('vi-VN') : '-'}
                      </td>
                    )}
                    <td className="p-2 text-[#787774]">{h.updated_by || 'Admin'}</td>
                    <td className="p-2 text-right">
                      {isAdmin && (
                        <ActionButton
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDeleteHistoryRow(h.id)}
                          title="Xoá dòng lịch sử này"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
