import { useState, useEffect } from 'react';
import type { MoldingRecipeItem } from '../../types/master-data';
import {
  fetchMoldingRecipe,
  saveMoldingRecipeItem,
  deleteMoldingRecipeItem,
  getMoldingRecipeTotalCost1000kg,
} from '../../lib/master-data-service';
import { Modal } from '../ui/Modal';
import { Layers, Plus, Trash2, Edit2, Check, Info } from 'lucide-react';

export const MoldingRecipeManager = () => {
  const [items, setItems] = useState<MoldingRecipeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<Partial<MoldingRecipeItem> | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const recipe = await fetchMoldingRecipe();
    setItems(recipe);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCost1000kg = getMoldingRecipeTotalCost1000kg(items);

  const handleOpenAdd = () => {
    setEditingItem({
      material_name: '',
      unit: 'kg',
      category: 'Vật tư khuôn',
      quantity_per_1000kg: 0,
      unit_price: 0,
      is_outsourced: false,
      outsourced_cost_per_1000kg: 0,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: MoldingRecipeItem) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa vật tư khuôn "${name}" khỏi Công Thức Dùng Chung?`)) return;
    await deleteMoldingRecipeItem(id);
    loadData();
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.material_name?.trim()) {
      alert('Vui lòng nhập tên vật tư khuôn!');
      return;
    }
    setSaving(true);
    try {
      await saveMoldingRecipeItem(editingItem);
      setShowModal(false);
      setEditingItem(null);
      await loadData();
    } catch (e: any) {
      alert(`Lỗi lưu vật tư khuôn: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Summary Banner */}
      <div className="bg-white p-4 rounded-[8px] border border-[#EAEAEA] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#111111]" />
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-tight">
              Công Thức Vật Tư Khuôn (Dùng Chung Cho Mọi Mác Đúc)
            </h2>
          </div>
          <p className="text-xs text-[#787774] mt-1">
            Định mức chi phí vật tư tạo khuôn & gia công phụ trợ thuê ngoài tính theo mẻ 1,000 kg kim loại lỏng.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#F7F6F3] border border-[#EAEAEA] px-3.5 py-1.5 rounded-[6px] text-right">
            <span className="text-[10px] text-[#787774] font-semibold uppercase tracking-wider block">
              Tổng Vật Tư Khuôn / 1000kg
            </span>
            <span className="text-base font-mono font-extrabold text-[#111111]">
              {totalCost1000kg.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-2 bg-[#111111] hover:bg-[#333333] text-white rounded-[6px] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Dòng Vật Tư</span>
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-[6px] text-xs text-blue-900 flex items-start space-x-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Quy tắc tính toán:</strong> Công thức vật tư khuôn này được áp dụng dùng chung cho tất cả các mác đúc gang. Khi tính giá, chi phí vật tư khuôn sẽ được quy đổi tự động theo tỷ lệ khối lượng gang lỏng mẻ đúc: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">C_molding = (Tổng Công Thức / 1000) × m_liquid</code>.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FBFBFA] border-b border-[#EAEAEA] font-semibold text-[#787774]">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4">Tên Vật Tư / Dịch Vụ</th>
              <th className="py-2.5 px-4">Phân Loại</th>
              <th className="py-2.5 px-4 text-right">Định Mức (/1000kg)</th>
              <th className="py-2.5 px-4 text-right">Đơn Giá (VNĐ)</th>
              <th className="py-2.5 px-4 text-right">Thành Tiền (/1000kg)</th>
              <th className="py-2.5 px-4">Ghi Chú</th>
              <th className="py-2.5 px-4 text-center w-24">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEAEA] font-medium text-[#111111]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#787774] italic">
                  Đang tải công thức vật tư khuôn...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#787774] italic">
                  Chưa có dòng vật tư khuôn nào. Bấm "+ Thêm Dòng Vật Tư" để tạo mới.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const itemTotal = item.is_outsourced
                  ? item.outsourced_cost_per_1000kg
                  : item.quantity_per_1000kg * item.unit_price;

                return (
                  <tr key={item.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-[#787774]">{index + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-[#111111]">
                      {item.material_name}
                      {item.is_outsourced && (
                        <span className="ml-2 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                          Thuê ngoài
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#787774]">{item.category}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      {item.is_outsourced ? '—' : `${item.quantity_per_1000kg} ${item.unit}`}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#787774]">
                      {item.is_outsourced ? '—' : `${item.unit_price.toLocaleString('vi-VN')} đ`}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#111111]">
                      {itemTotal.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-4 text-[#787774] italic">{item.notes || '—'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Sửa vật tư"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.material_name)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                          title="Xóa vật tư"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem?.id ? 'Chỉnh Sửa Vật Tư Khuôn' : 'Thêm Dòng Vật Tư Khuôn Mới'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-medium text-xs rounded-[6px]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold text-xs rounded-[6px] inline-flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Đang lưu...' : 'Lưu Dòng Vật Tư'}</span>
            </button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#111111] mb-1">Tên Vật Tư / Dịch Vụ Thuê Ngoài *</label>
              <input
                type="text"
                value={editingItem.material_name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, material_name: e.target.value })}
                placeholder="VD: Bột đất sét, Cát đúc, Sơn khuôn, Thao cát nhựa..."
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_outsourced_chk"
                checked={!!editingItem.is_outsourced}
                onChange={(e) => setEditingItem({ ...editingItem, is_outsourced: e.target.checked })}
                className="w-4 h-4 text-[#111111] rounded border-[#EAEAEA]"
              />
              <label htmlFor="is_outsourced_chk" className="font-bold text-[#111111]">
                Dòng chi phí thuê ngoài (Nhập thẳng số tiền / 1000kg)
              </label>
            </div>

            {editingItem.is_outsourced ? (
              <div>
                <label className="block font-semibold text-[#111111] mb-1">Chi Phí Thuê Ngoài Cho 1,000kg (VNĐ) *</label>
                <input
                  type="number"
                  value={editingItem.outsourced_cost_per_1000kg || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, outsourced_cost_per_1000kg: Number(e.target.value) })}
                  placeholder="3709831"
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={editingItem.unit || 'kg'}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Định Mức (kg/1000kg)</label>
                  <input
                    type="number"
                    value={editingItem.quantity_per_1000kg || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity_per_1000kg: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Đơn Giá (VNĐ/kg)</label>
                  <input
                    type="number"
                    value={editingItem.unit_price || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, unit_price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Ghi Chú</label>
              <input
                type="text"
                value={editingItem.notes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                placeholder="Ghi chú kỹ thuật hoặc nguồn vật tư..."
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px]"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
