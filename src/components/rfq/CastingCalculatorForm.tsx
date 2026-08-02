import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import { INITIAL_CASTING_GRADES } from '../../lib/master-data-service';
import { Box, Flame, Layers, Wrench, PieChart } from 'lucide-react';

export const CastingCalculatorForm = () => {
  const casting = useQuotationStore((state) => state.castingInput);
  const setCastingField = useQuotationStore((state) => state.setCastingField);
  const addOp = useQuotationStore((state) => state.addCastingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateCastingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeCastingMachiningOp);
  const selectGrade = useQuotationStore((state) => state.selectCastingGrade);

  const calculatedSintoMolding = (casting.DG_sinto_op || 10000) / Math.max(1, casting.n_cavity_per_mold || 1);
  const calculatedFinishCast = (casting.m_cast || 0) * (casting.DG_finish_kg || 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Mác Gang & BOM Nước Gang Lỏng */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Box className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 1: Mác Gang & Nước Gang Lỏng
          </h4>
        </div>

        <div className="space-y-3 text-xs">
          {/* Dropdown Mác Gang */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chọn Mác Gang Đúc (Load BOM & Lịch Sử Giá Mới Nhất)
            </label>
            <select
              value={casting.selected_casting_grade_id}
              onChange={(e) => selectGrade(e.target.value)}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
            >
              {INITIAL_CASTING_GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.notes}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Calculated DG_liquid and DG_cast_scrap Preview */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px]">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-[10px] font-semibold text-[#787774]">Đơn Giá Gang Lỏng (DG_liquid)</p>
                <p className="text-xs font-mono font-extrabold text-[#111111]">
                  {(casting.DG_liquid || 0).toLocaleString('vi-VN')} VNĐ/kg
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Box className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-[10px] font-semibold text-[#787774]">Đơn Giá Hồi Liệu (DG_cast_scrap)</p>
                <p className="text-xs font-mono font-extrabold text-[#111111]">
                  {(casting.DG_cast_scrap || 0).toLocaleString('vi-VN')} VNĐ/kg
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Khối Lượng Vật Đúc Tinh (m_cast - kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={casting.m_cast}
                onChange={(e) => setCastingField('m_cast', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Tỷ Lệ Thu Hồi Kim Loại (Y_yield - %)
              </label>
              <input
                type="number"
                step="1"
                value={casting.Y_yield}
                onChange={(e) => setCastingField('Y_yield', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Section Tạo Khuôn Sinto, Làm Ruột & Hoàn Thiện */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Layers className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 2: Tạo Khuôn Sinto, Ruột & Làm Sạch
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Số Lòng Khuôn / Hòm (n_cavity_per_mold)
            </label>
            <input
              type="number"
              min="1"
              value={casting.n_cavity_per_mold}
              onChange={(e) => setCastingField('n_cavity_per_mold', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Cước Khuôn Sinto / Chi Tiết (C_sinto_molding)
            </label>
            <div className="px-3 py-1.5 border border-[#EAEAEA] bg-[#FBFBFA] rounded-[6px] font-mono font-extrabold text-xs text-[#111111]">
              {calculatedSintoMolding.toLocaleString('vi-VN')} VNĐ / SP
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Khối Lượng Cát Ruột (m_core - kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={casting.m_core}
              onChange={(e) => setCastingField('m_core', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Đơn Giá Cát Ruột (DG_core_sand - VNĐ/kg)
            </label>
            <input
              type="number"
              value={casting.DG_core_sand_kg}
              onChange={(e) => setCastingField('DG_core_sand_kg', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Đơn Giá Phun Bi / Làm Sạch (DG_finish - VNĐ/kg)
            </label>
            <input
              type="number"
              value={casting.DG_finish_kg}
              onChange={(e) => setCastingField('DG_finish_kg', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chi Phí Phun Bi Làm Sạch (C_finish_cast)
            </label>
            <div className="px-3 py-1.5 border border-[#EAEAEA] bg-[#FBFBFA] rounded-[6px] font-mono font-extrabold text-xs text-[#111111]">
              {calculatedFinishCast.toLocaleString('vi-VN')} VNĐ / SP
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Gia Công Cơ Khí Động (CNC Ops) */}
      <MachiningOpsList
        operations={casting.machining_operations || []}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
      />

      {/* 4. Section Khấu Hao Mẫu Đúc & Đơn Hàng */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Wrench className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 4: Bộ Mẫu Đúc Sinto & Sản Lượng Đơn Hàng
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tổng Chi Phí Bộ Mẫu Đúc (VNĐ)
            </label>
            <input
              type="number"
              step="1000000"
              value={casting.C_pattern_total}
              onChange={(e) => setCastingField('C_pattern_total', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Tuổi Thọ Mẫu (L_pattern_life - Sản phẩm)
            </label>
            <input
              type="number"
              value={casting.L_pattern_life}
              onChange={(e) => setCastingField('L_pattern_life', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Sản Lượng Đơn Hàng (N_order - Chi tiết)
            </label>
            <input
              type="number"
              value={casting.N_order}
              onChange={(e) => setCastingField('N_order', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
          </div>
        </div>

        {/* Toggle Xử lý tiền mẫu */}
        <div className="pt-2">
          <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
            Cơ Chế Xử Lý Tiền Mẫu (pattern_cost_treatment)
          </label>
          <div className="inline-flex p-1 bg-[#F0F0EE] rounded-[6px] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setCastingField('pattern_cost_treatment', 'amortized')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                casting.pattern_cost_treatment === 'amortized'
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Phân Bổ Vào Giá Vốn (Amortized COGS)
            </button>
            <button
              type="button"
              onClick={() => setCastingField('pattern_cost_treatment', 'separate')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
                casting.pattern_cost_treatment === 'separate'
                  ? 'bg-[#FDEBEC] text-[#9F2F2D] shadow-xs'
                  : 'text-[#787774] hover:text-[#111111]'
              }`}
            >
              Tách Riêng Khoản Mẫu (Separate Fee)
            </button>
          </div>
        </div>
      </div>

      {/* 5. Section Sliders: Chi Phí Quản Lý Đúc, Vận Chuyển & Margin Lợi Nhuận */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <PieChart className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 5: Tỷ Lệ Quản Lý Đúc, Vận Chuyển & Margin Lợi Nhuận
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SliderInput
            label="Quản Lý Đúc (k_mgmt_cast %)"
            value={casting.k_mgmt_cast}
            onChange={(val) => setCastingField('k_mgmt_cast', val)}
            min={0}
            max={30}
            step={0.5}
            unit="%"
            description="Phân bổ chi phí quản lý đúc"
          />

          <SliderInput
            label="Vận Chuyển Đúc (DG_trans)"
            value={casting.DG_trans_kg}
            onChange={(val) => setCastingField('DG_trans_kg', val)}
            min={0}
            max={10000}
            step={100}
            unit="VNĐ/kg"
            description="Tính theo khối lượng vật đúc"
          />

          <SliderInput
            label="Margin Lợi Nhuận (k_profit %)"
            value={casting.k_profit_casting}
            onChange={(val) => setCastingField('k_profit_casting', val)}
            min={0}
            max={50}
            step={1}
            unit="%"
            description="Tỷ lệ lợi nhuận mục tiêu Đúc"
          />
        </div>
      </div>
    </div>
  );
};
