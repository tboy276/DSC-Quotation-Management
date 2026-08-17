import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import type { CastingFactorySettings } from '../../types/master-data';
import {
  fetchCastingSettings,
  saveCastingSettings,
  getFurnaceLadleCostPer1000kg,
} from '../../lib/master-data-service';
import { Settings, Save, Check, Flame, Factory } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';

export const CastingSettingsManager = () => {
  const toast = useToast();
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

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchCastingSettings();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, []);

  const furnacePer1000kg = settings.furnace_lifespan_batches > 0
    ? settings.furnace_lining_cost / settings.furnace_lifespan_batches
    : 0;

  const ladlePer1000kg = settings.ladle_lifespan_batches > 0
    ? settings.ladle_lining_cost / settings.ladle_lifespan_batches
    : 0;

  const totalFurnaceLadlePer1000kg = getFurnaceLadleCostPer1000kg(settings);

  const totalPartBPerKg =
    settings.finishing_material_rate +
    settings.utility_rate +
    settings.labor_rate +
    settings.workshop_mgmt_rate +
    settings.equipment_depreciation_rate;

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveCastingSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      toast.error(`Lỗi lưu cài đặt đúc gang: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-[8px] border border-[#EAEAEA] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#111111]" />
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-tight">
              Cài Đặt Lót Lò / Gầu & Đơn Giá Xưởng Phần B
            </h2>
          </div>
          <p className="text-xs text-[#787774] mt-1">
            Cấu hình 1 bộ tham số chung toàn nhà máy cho Chi phí lót Lò, Gầu và 5 khoản đơn giá chi phí sau đúc.
          </p>
        </div>

        <ActionButton
          variant="primary"
          disabled={saving || loading}
          onClick={handleSave}
          icon={savedSuccess ? Check : Save}
          label={savedSuccess ? 'Đã Lưu Thành Công' : (saving ? 'Đang Lưu...' : 'Lưu Cài Đặt Xưởng')}
          className={savedSuccess ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : ''}
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#787774] italic">
          Đang tải cài đặt nhà máy...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Panel 1: Chi Phí Lót Lò & Gầu (Phần A) */}
          <div className="bg-white p-4 rounded-[8px] border border-[#EAEAEA] space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-tight">
                1. Chi Phí Lót Lò & Lót Gầu (Phần A — Theo 1,000kg)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Lót lò */}
              <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-2">
                <span className="font-bold text-[#111111] block">Lót Lò Nấu Gang:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#787774] mb-1">Chi phí lót lò (VNĐ/lần)</label>
                    <input
                      type="number"
                      value={settings.furnace_lining_cost}
                      onChange={(e) => setSettings({ ...settings, furnace_lining_cost: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#787774] mb-1">Tuổi thọ lò (số mẻ/lần)</label>
                    <input
                      type="number"
                      value={settings.furnace_lifespan_batches}
                      onChange={(e) => setSettings({ ...settings, furnace_lifespan_batches: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-[#787774]">
                  = <strong>{furnacePer1000kg.toLocaleString('vi-VN')} VNĐ</strong> / 1,000kg kim loại lỏng
                </div>
              </div>

              {/* Lót gầu */}
              <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-2">
                <span className="font-bold text-[#111111] block">Lót Gầu Rót Gang:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#787774] mb-1">Chi phí lót gầu (VNĐ/lần)</label>
                    <input
                      type="number"
                      value={settings.ladle_lining_cost}
                      onChange={(e) => setSettings({ ...settings, ladle_lining_cost: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#787774] mb-1">Tuổi thọ gầu (số mẻ/lần)</label>
                    <input
                      type="number"
                      value={settings.ladle_lifespan_batches}
                      onChange={(e) => setSettings({ ...settings, ladle_lifespan_batches: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-[#787774]">
                  = <strong>{ladlePer1000kg.toLocaleString('vi-VN')} VNĐ</strong> / 1,000kg kim loại lỏng
                </div>
              </div>

              {/* Đơn Giá Thao Cát Nhựa */}
              <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-1.5">
                <label className="font-bold text-[#111111] block">
                  Đơn Giá Thao / Xử Lý Cát Nhựa (Hằng số chung nhà máy):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={settings.resin_core_sand_rate_per_kg || 12500}
                    onChange={(e) => setSettings({ ...settings, resin_core_sand_rate_per_kg: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-xs"
                  />
                  <span className="text-xs font-mono font-semibold text-[#787774] whitespace-nowrap">VNĐ / kg</span>
                </div>
                <p className="text-[10px] text-[#787774] italic">
                  * Áp dụng khi tính Chi Phí Thao cho từng sản phẩm: C_thao = (Trọng lượng thao 1 SP) × (Đơn giá thao/kg).
                </p>
              </div>

              {/* Total Furnace/Ladle */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-[6px] flex items-center justify-between font-bold text-[#111111]">
                <span>Tổng Chi Phí Lò + Gầu / 1,000kg:</span>
                <span className="font-mono text-amber-900 text-sm">
                  {totalFurnaceLadlePer1000kg.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Panel 2: 5 Đơn Giá Phần B (Chi Phí Sau Đúc) */}
          <div className="bg-white p-4 rounded-[8px] border border-[#EAEAEA] space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2.5">
              <Factory className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-tight">
                2. 5 Đơn Giá Phần B (Theo kg Thành Phẩm m_cast)
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  1. Đơn giá Vật tư HTSP (Bi phun, đá mài, vật tư khác) (VNĐ/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.finishing_material_rate}
                  onChange={(e) => setSettings({ ...settings, finishing_material_rate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded font-mono font-bold text-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  2. Đơn giá Điện + Nước tiêu hao xưởng (VNĐ/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.utility_rate}
                  onChange={(e) => setSettings({ ...settings, utility_rate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded font-mono font-bold text-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  3. Đơn giá Lương trực tiếp & gián tiếp (VNĐ/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.labor_rate}
                  onChange={(e) => setSettings({ ...settings, labor_rate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded font-mono font-bold text-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  4. Đơn giá Quản lý Phân xưởng (VNĐ/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.workshop_mgmt_rate}
                  onChange={(e) => setSettings({ ...settings, workshop_mgmt_rate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded font-mono font-bold text-[#111111]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#111111] mb-1">
                  5. Đơn giá Khấu hao Thiết bị xưởng (Lò, dây chuyền) (VNĐ/kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.equipment_depreciation_rate}
                  onChange={(e) => setSettings({ ...settings, equipment_depreciation_rate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded font-mono font-bold text-[#111111]"
                />
              </div>

              {/* Total Part B Rate */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-[6px] flex items-center justify-between font-bold text-[#111111] mt-3">
                <span>Tổng Đơn Giá Phần B / kg Thành Phẩm:</span>
                <span className="font-mono text-emerald-900 text-sm">
                  {totalPartBPerKg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ / kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
