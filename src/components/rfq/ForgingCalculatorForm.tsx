import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import {
  INITIAL_MATERIALS,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
} from '../../lib/master-data-service';
import { Workflow, Layers, Wrench, PieChart } from 'lucide-react';

export const ForgingCalculatorForm = () => {
  const forging = useQuotationStore((state) => state.forgingInput);
  const setForgingField = useQuotationStore((state) => state.setForgingField);
  const addOp = useQuotationStore((state) => state.addForgingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateForgingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeForgingMachiningOp);
  const selectMaterial = useQuotationStore((state) => state.selectForgingMaterial);
  const selectMachineRate = useQuotationStore((state) => state.selectForgingMachineRate);

  const steelMaterials = INITIAL_MATERIALS.filter(
    (m) => m.category === 'Thép cán - Rèn'
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Workflow className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 1: Vật Liệu Thép Phôi Rèn
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Dropdown Thép Phôi */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chọn Mác Thép & Nguồn Gốc (Từ Master Data)
            </label>
            <select
              value={forging.selected_material_id}
              onChange={(e) => selectMaterial(e.target.value)}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
            >
              {steelMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — Thép: {(m.latest_price || 0).toLocaleString('vi-VN')} VNĐ/kg | Phế: {(m.scrap_price || 0).toLocaleString('vi-VN')} VNĐ/kg
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Đơn Giá Thép Phôi (DG_steel - VNĐ/kg)
            </label>
            <input
              type="number"
              value={forging.DG_steel}
              onChange={(e) => setForgingField('DG_steel', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Đơn Giá Thu Hồi Ba-via (DG_scrap - VNĐ/kg)
            </label>
            <input
              type="number"
              value={forging.DG_scrap}
              onChange={(e) => setForgingField('DG_scrap', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Khối Lượng Phôi Tinh (m_tinh - kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={forging.m_tinh}
              onChange={(e) => setForgingField('m_tinh', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Khối Lượng Ba-via (m_bavia - kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={forging.m_bavia}
              onChange={(e) => setForgingField('m_bavia', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Phần Trăm Cháy Hao Phôi (k_loss - %)
            </label>
            <input
              type="number"
              step="0.1"
              value={forging.k_loss}
              onChange={(e) => setForgingField('k_loss', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>
        </div>
      </div>

      {/* 2. Section Công Nghệ & Hệ Máy Rèn */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Layers className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 2: Công Nghệ Rèn & Hệ Thiết Bị
          </h4>
        </div>

        <div className="space-y-3 text-xs">
          {/* Segmented Button chọn hệ máy: Máy Dập vs Máy Búa */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
              Hệ Thiết Bị Rèn Chính
            </label>
            <div className="inline-flex p-1 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA]">
              <button
                type="button"
                onClick={() => selectMachineRate(forging.selected_press_rate_id, 'press')}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  forging.forging_machine_type === 'press'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Máy Dập (Presses)
              </button>
              <button
                type="button"
                onClick={() => selectMachineRate(forging.selected_hammer_rate_id, 'hammer')}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                  forging.forging_machine_type === 'hammer'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#787774] hover:text-[#111111]'
                }`}
              >
                Máy Búa Khuỷu Thủy Lực
              </button>
            </div>
          </div>

          {/* Capacity Band Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chọn Dải Tải Trọng / Năng Lượng Máy (Load Từ Master Data)
            </label>
            {forging.forging_machine_type === 'press' ? (
              <select
                value={forging.selected_press_rate_id}
                onChange={(e) => selectMachineRate(e.target.value, 'press')}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
              >
                {INITIAL_PRESSING_RATES.map((r) => (
                  <option key={r.id} value={r.id}>
                    Máy Dập {r.tonnage_min} - {r.tonnage_max} Tấn — Cước: {r.rate_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={forging.selected_hammer_rate_id}
                onChange={(e) => selectMachineRate(e.target.value, 'hammer')}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
              >
                {INITIAL_HAMMER_RATES.map((r) => (
                  <option key={r.id} value={r.id}>
                    Máy Búa {r.energy_min} - {r.energy_max} kJ — Cước: {r.rate_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time & Operation inputs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Thời Gian Cắt Phôi (t_cut - Giây)
              </label>
              <input
                type="number"
                value={forging.t_cut_sec}
                onChange={(e) => setForgingField('t_cut_sec', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Thời Gian Dập/Búa (t_forging - Giây)
              </label>
              <input
                type="number"
                value={forging.t_forging_sec}
                onChange={(e) => setForgingField('t_forging_sec', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Thời Gian Cắt Ba-via (t_trim - Giây)
              </label>
              <input
                type="number"
                value={forging.t_trim_sec}
                onChange={(e) => setForgingField('t_trim_sec', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Nhiệt Luyện (DG_heat_treat - VNĐ/kg)
              </label>
              <input
                type="number"
                value={forging.DG_heat_treat_kg}
                onChange={(e) => setForgingField('DG_heat_treat_kg', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Phun Bi/Làm Sạch (DG_clean - VNĐ/kg)
              </label>
              <input
                type="number"
                value={forging.DG_clean_kg}
                onChange={(e) => setForgingField('DG_clean_kg', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                Đơn Giá Điện (DG_elec - VNĐ/kWh)
              </label>
              <input
                type="number"
                value={forging.DG_elec_kwh}
                onChange={(e) => setForgingField('DG_elec_kwh', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs text-[#111111]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Gia Công Cơ Khí Động (CNC Ops) */}
      <MachiningOpsList
        operations={forging.machining_operations || []}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
      />

      {/* 4. Section Khấu Hao Khuôn & Đơn Hàng */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Wrench className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 4: Bộ Khuôn Rèn & Sản Lượng Đơn Hàng
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tổng Chi Phí Bộ Khuôn (VNĐ)
            </label>
            <input
              type="number"
              step="1000000"
              value={forging.C_die_total}
              onChange={(e) => setForgingField('C_die_total', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tuổi Thọ Khuôn (L_die_life - Sản phẩm)
            </label>
            <input
              type="number"
              value={forging.L_die_life}
              onChange={(e) => setForgingField('L_die_life', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Sản Lượng Đơn Hàng (N_order - Chi tiết)
            </label>
            <input
              type="number"
              value={forging.N_order}
              onChange={(e) => setForgingField('N_order', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>
        </div>

        {/* Toggle Xử lý tiền khuôn */}
        <div className="pt-2">
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
            Cơ Chế Xử Lý Tiền Khuôn (die_cost_treatment)
          </label>
          <div className="inline-flex p-1 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setForgingField('die_cost_treatment', 'amortized')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                forging.die_cost_treatment === 'amortized'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Phân Bổ Vào Giá Vốn (Amortized COGS)
            </button>
            <button
              type="button"
              onClick={() => setForgingField('die_cost_treatment', 'separate')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                forging.die_cost_treatment === 'separate'
                  ? 'bg-[#FDEBEC] text-[#9F2F2D] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Tách Riêng Khoản Khuôn (Separate Fee)
            </button>
          </div>
        </div>
      </div>

      {/* 5. Section Sliders: Chi Phí Quản Lý, Vận Chuyển & Lợi Nhuận */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <PieChart className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 5: Tỷ Lệ Quản Lý, Vận Chuyển & Margin Lợi Nhuận
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SliderInput
            label="Chi Phí Quản Lý (k_mgmt %)"
            value={forging.k_mgmt}
            onChange={(val) => setForgingField('k_mgmt', val)}
            min={0}
            max={30}
            step={0.5}
            unit="%"
            description="Phân bổ quản lý doanh nghiệp"
          />

          <SliderInput
            label="Đơn Giá Vận Chuyển (DG_trans)"
            value={forging.DG_trans_kg}
            onChange={(val) => setForgingField('DG_trans_kg', val)}
            min={0}
            max={10000}
            step={100}
            unit="VNĐ/kg"
            description="Tính theo khối lượng phôi tổng"
          />

          <SliderInput
            label="Margin Lợi Nhuận (k_profit %)"
            value={forging.k_profit_forging}
            onChange={(val) => setForgingField('k_profit_forging', val)}
            min={0}
            max={50}
            step={1}
            unit="%"
            description="Tỷ lệ lợi nhuận mục tiêu Rèn"
          />
        </div>
      </div>
    </div>
  );
};
