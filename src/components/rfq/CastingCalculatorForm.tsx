import { useState } from 'react';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import { INITIAL_CASTING_GRADES } from '../../lib/master-data-service';
import { Modal } from '../ui/Modal';
import { Box, Flame, Layers, Wrench, PieChart, Factory, Eye, Info } from 'lucide-react';

export const CastingCalculatorForm = () => {
  const casting = useQuotationStore((state) => state.castingInput);
  const setCastingField = useQuotationStore((state) => state.setCastingField);
  const addOp = useQuotationStore((state) => state.addCastingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateCastingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeCastingMachiningOp);
  const selectGrade = useQuotationStore((state) => state.selectCastingGrade);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);

  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);

  // Section 1 Calculations
  const validYield = Math.max(0.01, casting.Y_yield || 57);
  const m_liquid = (casting.m_cast || 0) / (validYield / 100);
  const k_burn_loss = casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15;
  const m_burn_loss = m_liquid * (k_burn_loss / 100);
  const m_scrap_cast = Math.max(0, m_liquid - (casting.m_cast || 0) - m_burn_loss);

  // Section 2 Calculations
  const batchRatio = m_liquid / 1000;
  const furnaceLadleCost = (casting.C_furnace_ladle_per_1000kg || 120000) * batchRatio;
  const moldingFixedCost = (casting.C_molding_recipe_total_1000kg || 1302200) * batchRatio;
  const resinCoreCost = (casting.m_resin_core || 0) * (casting.DG_resin_core_per_kg || 12500);
  const totalMoldingCost = moldingFixedCost + resinCoreCost;
  const coreSandCost = (casting.m_core || 0) * (casting.DG_core_sand_kg || 0);
  const totalOpsCasting = furnaceLadleCost + totalMoldingCost + coreSandCost;

  // Part B Calculations
  const m_cast = casting.m_cast || 0;
  const finishingCost = (casting.DG_finishing_per_kg || 771.82) * m_cast;
  const utilityCost = (casting.DG_utility_per_kg || 3687.6) * m_cast;
  const laborCost = (casting.DG_labor_per_kg || 2461) * m_cast;
  const workshopMgmtCost = (casting.DG_workshop_mgmt_per_kg || 0) * m_cast;
  const equipmentDeprCost = (casting.DG_equipment_depr_per_kg || 4000) * m_cast;
  const totalPartBCost = finishingCost + utilityCost + laborCost + workshopMgmtCost + equipmentDeprCost;
  const partBPerKg = (casting.DG_finishing_per_kg || 771.82) +
    (casting.DG_utility_per_kg || 3687.6) +
    (casting.DG_labor_per_kg || 2461) +
    (casting.DG_workshop_mgmt_per_kg || 0) +
    (casting.DG_equipment_depr_per_kg || 4000);

  const castingRes = getCastingResult();

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Mác Gang & Nước Gang Lỏng */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <Box className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 1: Mác Gang & Nước Gang Lỏng (Cho 1,000kg Kim Loại)
          </h4>
        </div>

        <div className="space-y-3 text-xs">
          {/* Dropdown Mác Gang */}
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chọn Mác Gang Đúc (Tự Động Tính Giá Nước Gang & Hồi Liệu Từ BOM Supabase)
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
                <p className="text-[10px] font-semibold text-[#787774]">Đơn Giá Gang Lỏng Tính Từ BOM (DG_liquid)</p>
                <p className="text-xs font-mono font-extrabold text-[#111111]">
                  {(casting.DG_liquid || 0).toLocaleString('vi-VN')} VNĐ/kg
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Box className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-[10px] font-semibold text-[#787774]">Đơn Giá Thu Hồi Hồi Liệu (DG_cast_scrap)</p>
                <p className="text-xs font-mono font-extrabold text-[#111111]">
                  {(casting.DG_cast_scrap || 0).toLocaleString('vi-VN')} VNĐ/kg
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Tỷ Lệ Hao Hụt Cháy Nấu (k_burn_loss - %)
              </label>
              <input
                type="number"
                step="0.05"
                value={casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15}
                onChange={(e) => setCastingField('k_burn_loss', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono font-bold text-xs text-[#111111]"
              />
            </div>
          </div>

          {/* Calculated Yield & Scrap Summary */}
          <div className="p-2.5 bg-[#F7F6F3] rounded-[6px] border border-[#EAEAEA] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#787774]">
              Gang lỏng mẻ đúc (<strong className="text-[#111111]">{m_liquid.toFixed(1)} kg</strong>) |
              Hao cháy {k_burn_loss}% (<strong className="text-amber-900">{m_burn_loss.toFixed(1)} kg</strong>)
            </span>
            <span className="text-emerald-900 font-bold">
              Hồi liệu thu hồi = {m_scrap_cast.toFixed(1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* 2. Section 2: Tạo Khuôn, Ruột & Lót Lò/Gầu (Phần A) */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#111111] stroke-[2]" />
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
              Section 2: Công Nghệ Tạo Khuôn, Ruột & Lót Lò/Gầu (Phần A)
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowRecipeModal(true)}
            className="px-2.5 py-1 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA] rounded-[5px] text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3 Vật Tư Khuôn Cố Định</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Chi Phí Lót Lò & Gầu (C_furnace_ladle - Tự động từ Master Data)
            </label>
            <div className="px-3 py-1.5 border border-[#EAEAEA] bg-[#FBFBFA] rounded-[6px] font-mono font-extrabold text-xs text-[#111111]">
              {furnaceLadleCost.toLocaleString('vi-VN')} VNĐ
              <span className="text-[10px] font-normal text-[#787774] ml-2">
                ({(casting.C_furnace_ladle_per_1000kg || 120000).toLocaleString('vi-VN')}đ / 1000kg)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              3 Vật Tư Khuôn Cố Định (Bột đất sét, Cát đúc, Sơn khuôn)
            </label>
            <div className="px-3 py-1.5 border border-[#EAEAEA] bg-[#FBFBFA] rounded-[6px] font-mono font-extrabold text-xs text-[#111111]">
              {moldingFixedCost.toLocaleString('vi-VN')} VNĐ
              <span className="text-[10px] font-normal text-[#787774] ml-2">
                ({(casting.C_molding_recipe_total_1000kg || 1302200).toLocaleString('vi-VN')}đ / 1000kg)
              </span>
            </div>
          </div>

          {/* Product Specific Resin Core Input Field */}
          <div>
            <label className="block text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-1">
              Trọng Lượng Thao Cho 1 Sản Phẩm (m_resin_core - kg) *
            </label>
            <input
              type="number"
              step="0.1"
              value={casting.m_resin_core || 0}
              onChange={(e) => setCastingField('m_resin_core', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#111111] bg-white rounded-[6px] font-mono font-bold text-xs text-[#111111]"
            />
            <span className="text-[10px] text-[#787774] block mt-0.5 font-mono">
              Thành tiền C_thao = {resinCoreCost.toLocaleString('vi-VN')} VNĐ ({(casting.DG_resin_core_per_kg || 12500).toLocaleString('vi-VN')}đ/kg)
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Khối Lượng Cát Ruột Khác (m_core - kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={casting.m_core}
              onChange={(e) => setCastingField('m_core', Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] font-mono text-xs text-[#111111]"
            />
          </div>
        </div>

        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-[6px] flex items-center justify-between text-xs font-bold text-amber-950">
          <span>Tổng Chi Phí Tạo Khuôn, Ruột & Lò/Gầu (Section 2 - Phần A):</span>
          <span className="font-mono text-sm">{totalOpsCasting.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>

      {/* Part A Reference Unit Price Banner for Excel Cross-Checking */}
      <div className="p-3.5 bg-[#111111] text-white rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs font-mono text-xs">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-sans font-bold uppercase tracking-wider text-slate-200">
            Đơn giá Phần A (Vật liệu + Tạo khuôn)/kg thành phẩm — đối chiếu bảng Excel gốc:
          </span>
        </div>
        <div className="text-right">
          <span className="text-base font-extrabold text-emerald-400">
            {Math.round(castingRes.partA_per_kg || 0).toLocaleString('vi-VN')} VNĐ / kg
          </span>
          <span className="text-[10px] text-slate-400 block font-sans">
            (= Tổng Chi Phí Phần A {Math.round(castingRes.C_metal_casting + castingRes.C_ops_casting).toLocaleString('vi-VN')} VNĐ / {m_cast} kg)
          </span>
        </div>
      </div>

      {/* 2.5 Block PHẦN B — Chi Phí Xưởng Sau Đúc (Theo kg Thành Phẩm m_cast) */}
      <div className="bg-white p-4 rounded-[10px] border border-emerald-200/80 bg-emerald-50/20 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-emerald-200/60 pb-2">
          <Factory className="w-4 h-4 text-emerald-700 stroke-[2]" />
          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            Phần B: Chi Phí Xưởng Sau Đúc (Quy Đổi Theo {m_cast} kg Thành Phẩm)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-white border border-emerald-100 rounded-[6px]">
            <p className="text-[10px] font-semibold text-[#787774]">1. Vật Tư HTSP (Bi, Đá mài...)</p>
            <p className="font-mono font-bold text-[#111111] text-xs">
              {finishingCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[9px] text-[#787774] font-mono mt-0.5">
              {(casting.DG_finishing_per_kg || 771.82)} đ/kg × {m_cast}kg
            </p>
          </div>

          <div className="p-2.5 bg-white border border-emerald-100 rounded-[6px]">
            <p className="text-[10px] font-semibold text-[#787774]">2. Điện + Nước Tiêu Hao Xưởng</p>
            <p className="font-mono font-bold text-[#111111] text-xs">
              {utilityCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[9px] text-[#787774] font-mono mt-0.5">
              {(casting.DG_utility_per_kg || 3687.6)} đ/kg × {m_cast}kg
            </p>
          </div>

          <div className="p-2.5 bg-white border border-emerald-100 rounded-[6px]">
            <p className="text-[10px] font-semibold text-[#787774]">3. Lương Trực Tiếp & Gián Tiếp</p>
            <p className="font-mono font-bold text-[#111111] text-xs">
              {laborCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[9px] text-[#787774] font-mono mt-0.5">
              {(casting.DG_labor_per_kg || 2461)} đ/kg × {m_cast}kg
            </p>
          </div>

          <div className="p-2.5 bg-white border border-emerald-100 rounded-[6px]">
            <p className="text-[10px] font-semibold text-[#787774]">4. Quản Lý Phân Xưởng</p>
            <p className="font-mono font-bold text-[#111111] text-xs">
              {workshopMgmtCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[9px] text-[#787774] font-mono mt-0.5">
              {(casting.DG_workshop_mgmt_per_kg || 0)} đ/kg × {m_cast}kg
            </p>
          </div>

          <div className="p-2.5 bg-white border border-emerald-100 rounded-[6px]">
            <p className="text-[10px] font-semibold text-[#787774]">5. Khấu Hao Thiết Bị Xưởng</p>
            <p className="font-mono font-bold text-[#111111] text-xs">
              {equipmentDeprCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[9px] text-[#787774] font-mono mt-0.5">
              {(casting.DG_equipment_depr_per_kg || 4000)} đ/kg × {m_cast}kg
            </p>
          </div>

          <div className="p-2.5 bg-emerald-100/60 border border-emerald-300/80 rounded-[6px] flex flex-col justify-center">
            <p className="text-[10px] font-bold uppercase text-emerald-900">Tổng Phần B Xưởng</p>
            <p className="font-mono font-extrabold text-emerald-950 text-sm">
              {totalPartBCost.toLocaleString('vi-VN')} VNĐ
            </p>
            <p className="text-[10px] font-mono text-emerald-800">
              = {partBPerKg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ / kg
            </p>
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

      {/* 5. Section Sliders: Chi Phí Quản Lý Công Ty, Vận Chuyển & Margin Lợi Nhuận */}
      <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-2">
          <PieChart className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Section 5: Tỷ Lệ Quản Lý Công Ty, Vận Chuyển & Margin Lợi Nhuận
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SliderInput
            label="Quản Lý Công Ty (k_mgmt_cast %)"
            value={casting.k_mgmt_cast}
            onChange={(val) => setCastingField('k_mgmt_cast', val)}
            min={0}
            max={30}
            step={0.5}
            unit="%"
            description="Phân bổ chi phí quản lý chung công ty"
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

      {/* Recipe Details Preview Modal */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title="Công Thức 3 Vật Tư Khuôn Cố Định (Mẻ 1,000 kg)"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setShowRecipeModal(false)}
            className="px-4 py-1.5 bg-[#111111] text-white font-bold text-xs rounded-[6px]"
          >
            Đóng Màn Hình
          </button>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] flex items-center justify-between">
            <span className="font-bold text-[#111111]">Tổng 3 Vật Tư Khuôn Cố Định / 1,000kg:</span>
            <span className="font-mono text-sm font-extrabold text-[#111111]">
              {(casting.C_molding_recipe_total_1000kg || 1302200).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <table className="w-full text-left text-xs border border-[#EAEAEA] rounded-[6px] overflow-hidden">
            <thead className="bg-[#FBFBFA] border-b border-[#EAEAEA] font-semibold text-[#787774]">
              <tr>
                <th className="py-2 px-3">Tên Vật Tư</th>
                <th className="py-2 px-3 text-right">Định Mức / 1000kg</th>
                <th className="py-2 px-3 text-right">Đơn Giá</th>
                <th className="py-2 px-3 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA] font-medium text-[#111111]">
              <tr>
                <td className="py-2 px-3 font-bold">Bột đất sét</td>
                <td className="py-2 px-3 text-right font-mono">50 kg</td>
                <td className="py-2 px-3 text-right font-mono">13,900 đ</td>
                <td className="py-2 px-3 text-right font-mono font-bold">695,000 đ</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold">Cát đúc</td>
                <td className="py-2 px-3 text-right font-mono">300 kg</td>
                <td className="py-2 px-3 text-right font-mono">1,560 đ</td>
                <td className="py-2 px-3 text-right font-mono font-bold">468,000 đ</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold">Sơn khuôn</td>
                <td className="py-2 px-3 text-right font-mono">4 kg</td>
                <td className="py-2 px-3 text-right font-mono">34,800 đ</td>
                <td className="py-2 px-3 text-right font-mono font-bold">139,200 đ</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[11px] text-[#787774] italic">
            * Khoản <strong>Chi Phí Thao Cát Nhựa</strong> được tính riêng cho từng sản phẩm tại trường <code>m_resin_core</code> ngoài form.
          </p>
        </div>
      </Modal>
    </div>
  );
};
