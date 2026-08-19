import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import type { PressingMachineRate, HydraulicHammerRate, SystemUnitRate } from '../../types/master-data';
import {
  fetchPressingRates,
  fetchHammerRates,
  fetchSystemUnitRates,
  updatePressingRate,
  updateHammerRate,
  updateSystemUnitRate,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
  INITIAL_SYSTEM_RATES,
} from '../../lib/master-data-service';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { ActionButton } from '../ui/ActionButton';
import {
  Cpu,
  Edit2,
  Hammer,
  Check,
  Factory,
  Settings2,
  Sparkles,
} from 'lucide-react';

interface EquipmentItem {
  id: string;
  sourceType: 'system' | 'press' | 'hammer';
  group: 'forging' | 'cnc' | 'casting';
  groupName: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  ratePerHour: number;
  ratePerMinute?: number;
  badge: string;
  badgeColor: string;
}

interface EquipmentRatesManagerProps {
  isAdmin?: boolean;
}

export const EquipmentRatesManager = ({ isAdmin: propIsAdmin }: EquipmentRatesManagerProps = {}) => {
  const { profile } = useAuth();
  const toast = useToast();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : (profile?.role === 'admin' || !profile?.role);

  const [activeTab, setActiveTab] = useState<'all' | 'forging' | 'cnc' | 'casting'>('all');
  const [pressRates, setPressRates] = useState<PressingMachineRate[]>(INITIAL_PRESSING_RATES);
  const [hammerRates, setHammerRates] = useState<HydraulicHammerRate[]>(INITIAL_HAMMER_RATES);
  const [systemRates, setSystemRates] = useState<SystemUnitRate[]>(INITIAL_SYSTEM_RATES);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editRatePerHour, setEditRatePerHour] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const pData = await fetchPressingRates();
    const hData = await fetchHammerRates();
    const sData = await fetchSystemUnitRates();
    setPressRates(pData);
    setHammerRates(hData);
    setSystemRates(sData);
  };

  // Build unified items list
  const equipmentList: EquipmentItem[] = [
    // 1. RÈN: Cắt phôi đầu vào (từ systemRates)
    ...systemRates
      .filter((s) => s.category === 'Rèn')
      .map((s) => ({
        id: s.id,
        sourceType: 'system' as const,
        group: 'forging' as const,
        groupName: 'Rèn & Cắt Phôi',
        code: s.rate_key,
        name: s.rate_name,
        description: s.description || (s.rate_key === 'sawing_machine' ? 'Cắt phôi thép cây đầu vào' : 'Cắt phôi thép đầu vào'),
        unit: s.unit || 'VNĐ/giờ',
        ratePerHour: s.value,
        ratePerMinute: Math.round(s.value / 60),
        badge: 'Cắt phôi',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      })),

    // 2. RÈN: Máy Dập (từ pressRates)
    ...pressRates.map((p) => ({
      id: p.id,
      sourceType: 'press' as const,
      group: 'forging' as const,
      groupName: 'Rèn & Cắt Phôi',
      code: `PRESS_${p.tonnage_min}T`,
      name: p.name || `Máy Dập ${p.tonnage_min} Tấn (${p.tonnage_min}T)`,
      description: `Máy dập rèn nóng công suất ${p.tonnage_min} Tấn`,
      unit: 'VNĐ/giờ',
      ratePerHour: p.rate_per_hour,
      ratePerMinute: Math.round(p.rate_per_hour / 60),
      badge: 'Máy Dập',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    })),

    // 3. RÈN: Máy Búa (từ hammerRates)
    ...hammerRates.map((h) => ({
      id: h.id,
      sourceType: 'hammer' as const,
      group: 'forging' as const,
      groupName: 'Rèn & Cắt Phôi',
      code: `HAMMER_${h.energy_min}kJ`,
      name: h.name || `Máy Búa ${h.energy_min} kJ`,
      description: `Máy búa khuỷu thủy lực năng lượng ${h.energy_min} kJ`,
      unit: 'VNĐ/giờ',
      ratePerHour: h.rate_per_hour,
      ratePerMinute: Math.round(h.rate_per_hour / 60),
      badge: 'Máy Búa',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    })),

    // 4. CNC: 4 Nhóm thiết bị gia công
    ...systemRates
      .filter((s) => s.category === 'CNC')
      .map((s) => ({
        id: s.id,
        sourceType: 'system' as const,
        group: 'cnc' as const,
        groupName: 'Gia Công Cơ Khí CNC',
        code: s.rate_key,
        name: s.rate_name,
        description: s.description || '',
        unit: s.unit || 'VNĐ/giờ',
        ratePerHour: s.value,
        ratePerMinute: Math.round(s.value / 60),
        badge: 'Gia công CNC',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      })),
  ];

  const filteredEquipment = activeTab === 'all'
    ? equipmentList
    : equipmentList.filter((item) => item.group === activeTab);

  const handleOpenEdit = (item: EquipmentItem) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setEditRatePerHour(item.ratePerHour);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingItem || editRatePerHour < 0) return;

    setIsSaving(true);
    try {
      if (editingItem.sourceType === 'press') {
        await updatePressingRate(editingItem.id, editRatePerHour, editingItem.name);
        setPressRates((prev) =>
          prev.map((p) => (p.id === editingItem.id ? { ...p, rate_per_hour: editRatePerHour } : p))
        );
      } else if (editingItem.sourceType === 'hammer') {
        await updateHammerRate(editingItem.id, editRatePerHour, editingItem.name);
        setHammerRates((prev) =>
          prev.map((h) => (h.id === editingItem.id ? { ...h, rate_per_hour: editRatePerHour } : h))
        );
      } else if (editingItem.sourceType === 'system') {
        await updateSystemUnitRate(editingItem.id, editRatePerHour, editingItem.name);
        setSystemRates((prev) =>
          prev.map((s) => (s.id === editingItem.id ? { ...s, value: editRatePerHour } : s))
        );
      }

      setSaveSuccess(true);
      toast.success(`Đã cập nhật đơn giá ${editingItem.name}: ${editRatePerHour.toLocaleString('vi-VN')} VNĐ/giờ`);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingItem(null);
      }, 350);
    } catch (err: any) {
      console.error('Lỗi lưu đơn giá thiết bị:', err);
      toast.error(`Lỗi cập nhật: ${err?.message || 'Không thể lưu thay đổi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#111111] text-white flex items-center justify-center font-bold shadow-sm">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111] tracking-tight flex items-center gap-2">
                Quản Lý Chi Phí Thiết Bị & Giờ Máy
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  <Sparkles className="w-3 h-3" /> Đúc • Rèn • CNC
                </span>
              </h2>
              <p className="text-xs text-[#787774] mt-0.5">
                Bảng giá giờ máy chuẩn cho máy cưa vòng, cắt đột, máy dập, máy búa và 4 nhóm thiết bị gia công CNC
              </p>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-[#F0F0EE] p-1 rounded-[6px] border border-[#EAEAEA] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors ${
                activeTab === 'all' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Tất Cả ({equipmentList.length})
            </button>
            <button
              onClick={() => setActiveTab('forging')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'forging' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-amber-600" />
              Rèn & Cắt Phôi (6)
            </button>
            <button
              onClick={() => setActiveTab('cnc')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'cnc' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Gia Công CNC (4)
            </button>
            <button
              onClick={() => setActiveTab('casting')}
              className={`px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'casting' ? 'bg-white text-[#111111] shadow-sm font-bold' : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Factory className="w-3.5 h-3.5 text-blue-600" />
              Thiết Bị Đúc (0)
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Table / Cards */}
      {activeTab === 'casting' ? (
        <div className="bg-white border border-[#EAEAEA] rounded-[6px] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Factory className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#111111]">Thiết Bị Phân Xưởng Đúc Gang</h3>
          <p className="text-xs text-[#787774] max-w-md mx-auto">
            Hiện tại, chi phí đúc gang được tính tự động dựa trên Định mức vật tư khuôn (Tab 3), Chi phí lót lò/gầu và Đơn giá hoàn thiện theo kg sản phẩm (Tab 4). Tab thiết bị sẵn sàng mở rộng khi có danh mục máy đúc chuyên dụng bổ sung.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAEAEA] rounded-[6px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[11px] font-bold text-[#787774] uppercase tracking-wider">
                  <th className="py-3 px-4">Tên Thiết Bị / Phân Loại</th>
                  <th className="py-3 px-4">Nhóm Thiết Bị</th>
                  <th className="py-3 px-4">Mô Tả Chức Năng</th>
                  <th className="py-3 px-4 text-right">Đơn Giá (VNĐ/giờ)</th>
                  <th className="py-3 px-4 text-right">Quy Đổi (VNĐ/phút)</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredEquipment.map((item) => (
                  <tr key={`${item.sourceType}-${item.id}`} className="group hover:bg-[#F9F9F8] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111111] flex items-center gap-2">
                        {item.group === 'forging' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                        {item.group === 'cnc' && <Cpu className="w-3.5 h-3.5 text-emerald-600" />}
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#787774] font-mono mt-0.5">{item.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#787774] max-w-xs">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#111111]">
                      {item.ratePerHour.toLocaleString('vi-VN')} <span className="text-[10px] text-[#787774] font-normal">đ/h</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#787774]">
                      {item.ratePerMinute ? (
                        <>
                          <span className="font-semibold text-[#111111]">{item.ratePerMinute.toLocaleString('vi-VN')}</span> <span className="text-[10px]">đ/phút</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center opacity-90 group-hover:opacity-100 transition-opacity">
                      {isAdmin ? (
                        <ActionButton
                          variant="neutral"
                          onClick={() => handleOpenEdit(item)}
                          icon={Edit2}
                          title="Sửa giá"
                          className="px-2.5 py-1"
                        />
                      ) : (
                        <span className="text-[11px] text-[#A0A09E] italic">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Rate Modal */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title={`Chỉnh Sửa Đơn Giá Giờ Máy: ${editingItem.name}`}
        >
          <form onSubmit={handleSaveRate} className="space-y-4 pt-2">
            <div className="p-3 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#787774]">Mã tham số:</span>
                <span className="font-mono font-bold text-[#111111]">{editingItem.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787774]">Phân loại:</span>
                <span className="font-bold text-[#111111]">{editingItem.groupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787774]">Mô tả:</span>
                <span className="text-[#111111]">{editingItem.description}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] uppercase tracking-wider mb-1">
                Đơn Giá Giờ Máy (VNĐ/giờ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={editRatePerHour}
                onChange={(e) => setEditRatePerHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] text-sm font-mono font-bold text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-[#787774] mt-1 font-mono">
                ≈ {(editRatePerHour / 60).toFixed(1)} VNĐ/phút
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAEAEA]">
              <ActionButton
                variant="neutral"
                onClick={() => setEditingItem(null)}
                disabled={isSaving}
                label="Hủy"
              />
              <ActionButton
                type="submit"
                variant={saveSuccess ? 'positive' : 'neutral'}
                icon={saveSuccess ? Check : undefined}
                disabled={isSaving}
                label={isSaving ? 'Đang Lưu...' : saveSuccess ? 'Đã Lưu' : 'Lưu Thay Đổi'}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
