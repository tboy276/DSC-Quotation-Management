import { useState, useEffect } from 'react';
import type { CastingFactorySettings, MoldingRecipeItem } from '../../types/master-data';
import {
  fetchCastingSettings,
  saveCastingSettings,
  fetchMoldingRecipe,
  saveMoldingRecipeItem,
  deleteMoldingRecipeItem,
  getMoldingRecipeTotalCost1000kg,
  getFurnaceLadleCostPer1000kg,
} from '../../lib/master-data-service';
import { Modal } from '../ui/Modal';
import {
  Flame,
  Factory,
  Save,
  Check,
  Plus,
  Trash2,
  Edit2,
  Scale,
  Sparkles,
} from 'lucide-react';

export const CastingOperationsRatesManager = () => {
  // State 1: Casting factory settings (Furnace, Ladle, Part B 5 rates, Resin Core rate)
  const [settings, setSettings] = useState<CastingFactorySettings>({
    furnace_lining_cost: 50000000,
    furnace_lifespan_batches: 500,
    ladle_lining_cost: 3000000,
    ladle_lifespan_batches: 150,
    resin_core_sand_rate_per_kg: 12500,
    finishing_material_rate: 771.82,
    utility_rate: 3687.6,
    labor_rate: 2461,
    workshop_mgmt_rate: 0,
    equipment_depreciation_rate: 4000,
  });

  // State 2: Molding recipe items (1000kg liquid metal)
  const [recipeItems, setRecipeItems] = useState<MoldingRecipeItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Modal State for Molding Recipe
  const [editingRecipeItem, setEditingRecipeItem] = useState<Partial<MoldingRecipeItem> | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [savingRecipe, setSavingRecipe] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const [fetchedSettings, fetchedRecipe] = await Promise.all([
      fetchCastingSettings(),
      fetchMoldingRecipe(),
    ]);
    setSettings(fetchedSettings);
    setRecipeItems(fetchedRecipe);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculated values for Table 1 (1,000kg Liquid Metal)
  const furnacePer1000kg =
    settings.furnace_lifespan_batches > 0
      ? settings.furnace_lining_cost / settings.furnace_lifespan_batches
      : 0;

  const ladlePer1000kg =
    settings.ladle_lifespan_batches > 0
      ? settings.ladle_lining_cost / settings.ladle_lifespan_batches
      : 0;

  const totalFurnaceLadle1000kg = getFurnaceLadleCostPer1000kg(settings);
  const totalMolding1000kg = getMoldingRecipeTotalCost1000kg(recipeItems);
  const grandTotal1000kg = totalFurnaceLadle1000kg + totalMolding1000kg;

  // Calculated values for Table 2 (per 1kg Cast Product)
  const totalPartBPerKg =
    settings.finishing_material_rate +
    settings.utility_rate +
    settings.labor_rate +
    settings.workshop_mgmt_rate +
    settings.equipment_depreciation_rate;

  // Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSavedSuccess(false);
    try {
      await saveCastingSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`Lỗi lưu cài đặt đúc gang: ${e.message || e}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Molding Recipe Handlers
  const handleOpenAddRecipe = () => {
    setEditingRecipeItem({
      material_name: '',
      unit: 'kg',
      category: 'Vật tư khuôn',
      quantity_per_1000kg: 0,
      unit_price: 0,
      is_outsourced: false,
      outsourced_cost_per_1000kg: 0,
      notes: '',
    });
    setShowRecipeModal(true);
  };

  const handleOpenEditRecipe = (item: MoldingRecipeItem) => {
    setEditingRecipeItem({ ...item });
    setShowRecipeModal(true);
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa vật tư khuôn "${name}" khỏi Công Thức Dùng Chung?`)) return;
    await deleteMoldingRecipeItem(id);
    const updated = await fetchMoldingRecipe();
    setRecipeItems(updated);
  };

  const handleSaveRecipe = async () => {
    if (!editingRecipeItem || !editingRecipeItem.material_name?.trim()) {
      alert('Vui lòng nhập tên vật tư khuôn!');
      return;
    }
    setSavingRecipe(true);
    try {
      await saveMoldingRecipeItem(editingRecipeItem);
      setShowRecipeModal(false);
      setEditingRecipeItem(null);
      const updated = await fetchMoldingRecipe();
      setRecipeItems(updated);
    } catch (e: any) {
      alert(`Lỗi lưu vật tư khuôn: ${e.message || e}`);
    } finally {
      setSavingRecipe(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#111111] text-white rounded-[6px]">
              <Factory className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#111111] uppercase tracking-tight">
                Chi Phí Công Đoạn Đúc Gang
              </h2>
              <p className="text-xs text-[#787774] mt-0.5">
                Quản lý tập trung toàn bộ định mức vật tư, chi phí nấu luyện (mẻ 1,000kg) và 5 đơn giá phân xưởng sau đúc (theo kg thành phẩm).
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={savingSettings || loading}
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white rounded-[6px] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs disabled:opacity-50 transition-all self-start md:self-auto"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span className="text-emerald-400">Đã Lưu Thành Công</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{savingSettings ? 'Đang Lưu...' : 'Lưu Thay Đổi Đơn Giá'}</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-[10px] border border-[#EAEAEA] text-center text-xs text-[#787774] italic">
          Đang tải dữ liệu công đoạn đúc gang...
        </div>
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* BẢNG 1: CÁC VẬT TƯ & CHI PHÍ TÍNH THEO 1,000 KG KIM LOẠI LỎNG */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-[10px] border border-[#EAEAEA] shadow-2xs overflow-hidden">
            <div className="bg-[#FBFBFA] px-4 py-3.5 border-b border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-tight">
                  Bảng 1: Các Vật Tư & Chi Phí Tính Theo 1,000 kg Kim Loại Lỏng
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold rounded-full self-start sm:self-auto font-mono">
                Quy Chuẩn Mẻ 1,000 kg
              </span>
            </div>

            <div className="p-4 space-y-5">
              {/* Mục A: Lót Lò & Lót Gầu */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-[#111111] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                    <span>1. Chi Phí Lót Lò Nấu & Lót Gầu Rót</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Tiểu kế: {totalFurnaceLadle1000kg.toLocaleString('vi-VN')} VNĐ / 1,000kg
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Lót lò */}
                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111] text-xs">Lót Lò Nấu Gang</span>
                      <span className="font-mono text-xs font-bold text-[#111111]">
                        = {furnacePer1000kg.toLocaleString('vi-VN')} đ / 1000kg
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] text-[#787774] font-semibold uppercase mb-1">
                          Chi phí lót lò (VNĐ/lần)
                        </label>
                        <input
                          type="number"
                          value={settings.furnace_lining_cost}
                          onChange={(e) =>
                            setSettings({ ...settings, furnace_lining_cost: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#787774] font-semibold uppercase mb-1">
                          Tuổi thọ lò (mẻ/lần)
                        </label>
                        <input
                          type="number"
                          value={settings.furnace_lifespan_batches}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              furnace_lifespan_batches: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lót gầu */}
                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111111] text-xs">Lót Gầu Rót Gang</span>
                      <span className="font-mono text-xs font-bold text-[#111111]">
                        = {ladlePer1000kg.toLocaleString('vi-VN')} đ / 1000kg
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] text-[#787774] font-semibold uppercase mb-1">
                          Chi phí lót gầu (VNĐ/lần)
                        </label>
                        <input
                          type="number"
                          value={settings.ladle_lining_cost}
                          onChange={(e) =>
                            setSettings({ ...settings, ladle_lining_cost: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#787774] font-semibold uppercase mb-1">
                          Tuổi thọ gầu (mẻ/lần)
                        </label>
                        <input
                          type="number"
                          value={settings.ladle_lifespan_batches}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              ladle_lifespan_batches: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mục B: Định Mức Vật Tư Tạo Khuôn Cát (Dùng Chung) */}
              <div className="space-y-2.5 pt-2 border-t border-[#EAEAEA]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <h4 className="text-[11px] font-extrabold text-[#111111] uppercase tracking-wider">
                      2. Định Mức Vật Tư Tạo Khuôn Cát (Dùng Chung)
                    </h4>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Tiểu kế: {totalMolding1000kg.toLocaleString('vi-VN')} VNĐ / 1,000kg
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddRecipe}
                      className="px-2.5 py-1 bg-[#111111] hover:bg-[#333333] text-white rounded-[5px] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Thêm Vật Tư Khuôn</span>
                    </button>
                  </div>
                </div>

                <div className="border border-[#EAEAEA] rounded-[8px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FBFBFA] border-b border-[#EAEAEA] font-semibold text-[#787774]">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">STT</th>
                        <th className="py-2 px-3">Tên Vật Tư / Dịch Vụ</th>
                        <th className="py-2 px-3 text-right">Định Mức (/1,000kg)</th>
                        <th className="py-2 px-3 text-right">Đơn Giá</th>
                        <th className="py-2 px-3 text-right">Thành Tiền (/1,000kg)</th>
                        <th className="py-2 px-3">Ghi Chú</th>
                        <th className="py-2 px-3 text-center w-20">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA] font-medium text-[#111111]">
                      {recipeItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[#787774] italic">
                            Chưa có dòng vật tư khuôn nào. Bấm "+ Thêm Vật Tư Khuôn" để tạo mới.
                          </td>
                        </tr>
                      ) : (
                        recipeItems.map((item, index) => {
                          const itemTotal = item.is_outsourced
                            ? item.outsourced_cost_per_1000kg
                            : item.quantity_per_1000kg * item.unit_price;

                          return (
                            <tr key={item.id} className="hover:bg-[#F9F9F8] transition-colors">
                              <td className="py-2 px-3 text-center font-mono text-[#787774]">
                                {index + 1}
                              </td>
                              <td className="py-2 px-3 font-bold text-[#111111]">
                                {item.material_name}
                                {item.is_outsourced && (
                                  <span className="ml-2 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                                    Thuê ngoài
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold">
                                {item.is_outsourced ? '—' : `${item.quantity_per_1000kg} ${item.unit}`}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-[#787774]">
                                {item.is_outsourced
                                  ? '—'
                                  : `${item.unit_price.toLocaleString('vi-VN')} đ`}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-[#111111]">
                                {itemTotal.toLocaleString('vi-VN')} đ
                              </td>
                              <td className="py-2 px-3 text-[#787774] italic text-[11px]">
                                {item.notes || '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditRecipe(item)}
                                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                    title="Sửa vật tư"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecipe(item.id, item.material_name)}
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
              </div>

              {/* Total Table 1 Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-700 stroke-[2.5]" />
                  <span className="text-xs font-extrabold text-[#111111] uppercase tracking-tight">
                    Tổng Chi Phí Phần A / 1,000 kg Kim Loại Lỏng (Lò + Gầu + Khuôn):
                  </span>
                </div>
                <div className="font-mono text-sm font-extrabold text-amber-950">
                  {grandTotal1000kg.toLocaleString('vi-VN')} VNĐ / 1,000kg
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BẢNG 2: CÁC CHI PHÍ TÍNH THEO 1 KG THÀNH PHẨM (M_CAST) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-[10px] border border-[#EAEAEA] shadow-2xs overflow-hidden">
            <div className="bg-[#FBFBFA] px-4 py-3.5 border-b border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-tight">
                  Bảng 2: Các Chi Phí Tính Theo 1 kg Thành Phẩm (m_cast)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold rounded-full self-start sm:self-auto font-mono">
                Quy Chuẩn Theo 1 kg SP
              </span>
            </div>

            <div className="p-4 space-y-5">
              {/* Mục A: 5 Đơn Giá Phân Xưởng Sau Đúc (Phần B) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold text-[#111111] uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>1. 5 Đơn Giá Chi Phí Phân Xưởng Sau Đúc (Phần B)</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Tổng 5 Khoản: {totalPartBPerKg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ / kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#111111] leading-tight min-h-[28px]">
                      1. Vật Tư HTSP (Bi, đá mài...)
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.finishing_material_rate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            finishing_material_rate: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono whitespace-nowrap">đ/kg</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#111111] leading-tight min-h-[28px]">
                      2. Điện + Nước Tiêu Hao Xưởng
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.utility_rate}
                        onChange={(e) =>
                          setSettings({ ...settings, utility_rate: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono whitespace-nowrap">đ/kg</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#111111] leading-tight min-h-[28px]">
                      3. Lương Trực Tiếp & Gián Tiếp
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.labor_rate}
                        onChange={(e) =>
                          setSettings({ ...settings, labor_rate: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono whitespace-nowrap">đ/kg</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#111111] leading-tight min-h-[28px]">
                      4. Quản Lý Phân Xưởng
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.workshop_mgmt_rate}
                        onChange={(e) =>
                          setSettings({ ...settings, workshop_mgmt_rate: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono whitespace-nowrap">đ/kg</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#111111] leading-tight min-h-[28px]">
                      5. Khấu Hao Thiết Bị Xưởng
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.equipment_depreciation_rate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            equipment_depreciation_rate: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono whitespace-nowrap">đ/kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mục B: Đơn Giá Thao Cát Nhựa (Áp Dụng Theo Kg Thao Của Từng SP) */}
              <div className="p-3.5 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-[#111111] uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                      <span>2. Đơn Giá Thao / Xử Lý Cát Nhựa (Áp Dụng Riêng Theo Sản Phẩm)</span>
                    </h4>
                    <p className="text-[11px] text-[#787774] mt-0.5">
                      Áp dụng khi sản phẩm có sử dụng thao cát: <code>C_thao = Trọng lượng thao 1 SP (kg) × Đơn giá (đ/kg)</code>.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <label className="text-xs font-bold text-[#111111] whitespace-nowrap">
                      Đơn giá:
                    </label>
                    <input
                      type="number"
                      value={settings.resin_core_sand_rate_per_kg || 12500}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          resin_core_sand_rate_per_kg: Number(e.target.value),
                        })
                      }
                      className="w-32 px-2.5 py-1 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                    />
                    <span className="text-xs font-mono font-semibold text-[#787774]">VNĐ/kg</span>
                  </div>
                </div>
              </div>

              {/* Total Table 2 Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                  <span className="text-xs font-extrabold text-[#111111] uppercase tracking-tight">
                    Tổng Đơn Giá Chi Phí Xưởng Phần B / 1 kg Thành Phẩm:
                  </span>
                </div>
                <div className="font-mono text-sm font-extrabold text-emerald-950">
                  {totalPartBPerKg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ / kg
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={editingRecipeItem?.id ? 'Chỉnh Sửa Vật Tư Khuôn' : 'Thêm Dòng Vật Tư Khuôn Mới'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowRecipeModal(false)}
              className="px-3 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-medium text-xs rounded-[6px]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={savingRecipe}
              onClick={handleSaveRecipe}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#333333] text-white font-bold text-xs rounded-[6px] inline-flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{savingRecipe ? 'Đang lưu...' : 'Lưu Dòng Vật Tư'}</span>
            </button>
          </>
        }
      >
        {editingRecipeItem && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#111111] mb-1">
                Tên Vật Tư / Dịch Vụ Thuê Ngoài *
              </label>
              <input
                type="text"
                value={editingRecipeItem.material_name || ''}
                onChange={(e) =>
                  setEditingRecipeItem({ ...editingRecipeItem, material_name: e.target.value })
                }
                placeholder="VD: Bột đất sét, Cát đúc, Sơn khuôn, Xỉ tạo xỉ..."
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_outsourced_chk"
                checked={!!editingRecipeItem.is_outsourced}
                onChange={(e) =>
                  setEditingRecipeItem({ ...editingRecipeItem, is_outsourced: e.target.checked })
                }
                className="w-4 h-4 text-[#111111] rounded border-[#EAEAEA]"
              />
              <label htmlFor="is_outsourced_chk" className="font-bold text-[#111111]">
                Dòng chi phí thuê ngoài (Nhập thẳng số tiền / 1000kg)
              </label>
            </div>

            {editingRecipeItem.is_outsourced ? (
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  Chi Phí Thuê Ngoài Cho 1,000kg (VNĐ) *
                </label>
                <input
                  type="number"
                  value={editingRecipeItem.outsourced_cost_per_1000kg || ''}
                  onChange={(e) =>
                    setEditingRecipeItem({
                      ...editingRecipeItem,
                      outsourced_cost_per_1000kg: Number(e.target.value),
                    })
                  }
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
                    value={editingRecipeItem.unit || 'kg'}
                    onChange={(e) =>
                      setEditingRecipeItem({ ...editingRecipeItem, unit: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">
                    Định Mức (kg/1000kg)
                  </label>
                  <input
                    type="number"
                    value={editingRecipeItem.quantity_per_1000kg || ''}
                    onChange={(e) =>
                      setEditingRecipeItem({
                        ...editingRecipeItem,
                        quantity_per_1000kg: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111111] mb-1">Đơn Giá (VNĐ/kg)</label>
                  <input
                    type="number"
                    value={editingRecipeItem.unit_price || ''}
                    onChange={(e) =>
                      setEditingRecipeItem({
                        ...editingRecipeItem,
                        unit_price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#111111] mb-1">Ghi Chú</label>
              <input
                type="text"
                value={editingRecipeItem.notes || ''}
                onChange={(e) =>
                  setEditingRecipeItem({ ...editingRecipeItem, notes: e.target.value })
                }
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
