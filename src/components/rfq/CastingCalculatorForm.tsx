import { useState, useEffect } from 'react';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import { INITIAL_CASTING_GRADES, fetchCastingGrades } from '../../lib/master-data-service';
import type { CastingGrade } from '../../types/master-data';
import { Modal } from '../ui/Modal';
import { Layers, Wrench, PieChart, Factory, Eye } from 'lucide-react';

export const CastingCalculatorForm = () => {
  const casting = useQuotationStore((state) => state.castingInput);
  const setCastingField = useQuotationStore((state) => state.setCastingField);
  const addOp = useQuotationStore((state) => state.addCastingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateCastingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeCastingMachiningOp);
  const selectGrade = useQuotationStore((state) => state.selectCastingGrade);

  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [grades, setGrades] = useState<CastingGrade[]>(INITIAL_CASTING_GRADES);

  useEffect(() => {
    const loadMasterDataGrades = async () => {
      const fetched = await fetchCastingGrades();
      if (fetched && fetched.length > 0) {
        setGrades(fetched);
        // Nếu grade đang chọn không nằm trong danh sách fetched, chọn mác đầu tiên
        if (!casting.selected_casting_grade_id || !fetched.some((g) => g.id === casting.selected_casting_grade_id)) {
          selectGrade(fetched[0].id);
        } else {
          // Luôn gọi lại selectGrade để đảm bảo giá BOM mới nhất được áp dụng
          selectGrade(casting.selected_casting_grade_id);
        }
      }
    };
    loadMasterDataGrades();
  }, []);

  // -------------------------------------------------------------
  // NEW 4-STEP CALCULATIONS (Phản ánh đúng công thức Excel)
  // -------------------------------------------------------------
  const yield_ratio = Math.max(0.01, (casting.Y_yield || 60)) / 100;
  const burn_ratio = (casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15) / 100;
  const m_cast = casting.m_cast || 0;

  // BƯỚC 1 & 2: CHO 1000KG MẺ CHUẨN
  const cost_metal_1000 = 1000 * (casting.DG_liquid || 0);
  const scrap_kg_1000 = Math.max(0, 1000 - (1000 * yield_ratio) - (1000 * burn_ratio));
  const cost_scrap_1000 = scrap_kg_1000 * (casting.DG_cast_scrap || 0);
  
  const cost_furnace_1000 = casting.C_furnace_ladle_per_1000kg || 120000;
  const cost_molding_1000 = casting.C_molding_recipe_total_1000kg || 1302200;
  
  const total_batch_cost = cost_metal_1000 - cost_scrap_1000 + cost_furnace_1000 + cost_molding_1000;
  const dg_liquid_final = total_batch_cost / 1000;

  // BƯỚC 3: CHI PHÍ THAO/RUỘT (CHO 1 SẢN PHẨM)
  const resinCoreCost = (casting.m_resin_core || 0) * (casting.DG_resin_core_per_kg || 12500);
  const coreSandCost = (casting.m_core || 0) * (casting.DG_core_sand_kg || 0);
  const totalCoreCostPerProduct = resinCoreCost + coreSandCost;
  const coreCostPerKg = m_cast > 0 ? totalCoreCostPerProduct / m_cast : 0;

  // BƯỚC 4: TỔNG HỢP ĐƠN GIÁ PHẦN A
  const partA_per_kg = (dg_liquid_final / yield_ratio) + coreCostPerKg;

  // Part B Calculations
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


  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* KHỐI PHẦN A: VẬT LIỆU & TẠO KHUÔN (PHƯƠNG PHÁP ĐÚC SINTO) */}
      <div className="bg-white p-5 rounded-[4px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
        
        {/* HEADER PHẦN A */}
        <div className="flex items-center space-x-2 border-b border-[#EAEAEA] pb-3">
          <Layers className="w-5 h-5 text-[#111111] stroke-[2]" />
          <div>
            <h4 className="text-[15px] font-bold text-[#111111] uppercase tracking-wider">
              PHẦN A: VẬT LIỆU & TẠO KHUÔN (PHƯƠNG PHÁP ĐÚC SINTO)
            </h4>
            <p className="text-[12px] text-[#787774] mt-0.5">
              Áp dụng phương pháp tính theo mẻ chuẩn 1,000kg kim loại lỏng.
            </p>
          </div>
        </div>

        {/* THÔNG SỐ SẢN PHẨM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
              Khối Lượng Vật Đúc
            </label>
            <input
              type="number"
              step="0.1"
              value={casting.m_cast}
              onChange={(e) => setCastingField('m_cast', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
              Tỷ Lệ Thu Hồi Kim Loại (%)
            </label>
            <input
              type="number"
              step="1"
              value={casting.Y_yield}
              onChange={(e) => setCastingField('Y_yield', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
              % Hao Hụt Hồi Liệu
            </label>
            <input
              type="number"
              step="0.05"
              value={casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15}
              onChange={(e) => setCastingField('k_burn_loss', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111] focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* KHỐI 1: CHI PHÍ VẬT LIỆU & THAO CÁT */}
        <div className="p-5 bg-[#F9F9F9] border border-[#EAEAEA] rounded-[4px] space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
            <h5 className="text-[12px] font-bold text-[#111111] uppercase tracking-wider">
              1. Chi Phí Vật Liệu & Thao Cát (Quy Đổi Mẻ Chuẩn)
            </h5>
            <button
              type="button"
              onClick={() => setShowRecipeModal(true)}
              className="px-2.5 py-1.5 bg-white text-[#111111] border border-[#EAEAEA] rounded-[4px] text-[11px] font-bold inline-flex items-center space-x-1.5 cursor-pointer hover:bg-[#F0F0EE] shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3 Vật Tư Khuôn</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Cột trái (hẹp hơn) - khoảng 5 cột */}
            <div className="md:col-span-5 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#787774] uppercase mb-1.5 tracking-wider">
                  Chọn Mác Gang Đúc (Danh Mục BOM)
                </label>
                <select
                  value={casting.selected_casting_grade_id}
                  onChange={(e) => selectGrade(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono font-bold text-[13px] focus:outline-none focus:border-[#111111] shadow-sm"
                >
                  {(grades.length > 0 ? grades : INITIAL_CASTING_GRADES).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.notes ? `— ${g.notes}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#787774] uppercase mb-1.5 tracking-wider">
                  Trọng Lượng Thao Nhựa (m_resin_core - kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={casting.m_resin_core || 0}
                  onChange={(e) => setCastingField('m_resin_core', Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono font-bold text-[13px] text-[#111111] focus:outline-none focus:border-[#111111] shadow-sm"
                />
              </div>
            </div>

            {/* Cột phải (rộng hơn) - khoảng 7 cột */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-2.5 text-[13px] font-mono">
                <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#EAEAEA]">
                  <span className="text-[#787774] font-sans">I. Chi phí vật tư nấu luyện</span>
                  <span className="font-bold text-[#111111]">{cost_metal_1000.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#EAEAEA]">
                  <span className="text-[#787774] font-sans">II. Hồi liệu thu hồi (-):</span>
                  <span className="font-bold text-[#10B981]">-{cost_scrap_1000.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#EAEAEA]">
                  <span className="text-[#787774] font-sans">III. Chi phí nấu luyện (Lò&Gầu):</span>
                  <span className="font-bold text-[#111111]">{cost_furnace_1000.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#EAEAEA]">
                  <span className="text-[#787774] font-sans">IV. Chi phí làm khuôn cát:</span>
                  <span className="font-bold text-[#111111]">{cost_molding_1000.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="border-t-2 border-[#111111] pt-3 flex flex-wrap gap-2 justify-between items-center font-mono">
                <span className="text-[13px] font-bold text-[#111111] uppercase font-sans">Tổng Chi Phí Mẻ (I - II + III + IV):</span>
                <span className="font-extrabold text-[#38517A] text-[15px]">{total_batch_cost.toLocaleString('vi-VN')} VNĐ</span>
              </div>

              <div className="flex gap-4 pt-3">
                <div className="bg-[#F0F0EE] p-3.5 rounded-[4px] flex-1 text-center border-l-4 border-slate-300">
                  <p className="text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">Đơn Giá Thành Phẩm</p>
                  <p className="font-mono text-[22px] font-extrabold text-[#38517A] leading-none">
                    {Math.round(dg_liquid_final / yield_ratio).toLocaleString('vi-VN')} <span className="text-[11px] font-bold text-[#111111] tracking-normal">VNĐ/kg</span>
                  </p>
                </div>
                <div className="bg-[#F0F0EE] p-3.5 rounded-[4px] flex-1 text-center border-l-4 border-slate-300">
                  <p className="text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">Phí Thao Quy Đổi</p>
                  <p className="font-mono text-[22px] font-extrabold text-[#38517A] leading-none">
                    {Math.round(coreCostPerKg).toLocaleString('vi-VN')} <span className="text-[11px] font-bold text-[#111111] tracking-normal">VNĐ/kg</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#787774] italic mt-5 pt-3 border-t border-[#EAEAEA]">
            * DG_liquid: {(casting.DG_liquid || 0).toLocaleString('vi-VN')} đ/kg | DG_cast_scrap: {(casting.DG_cast_scrap || 0).toLocaleString('vi-VN')} đ/kg | Hồi liệu mẻ 1000kg: {scrap_kg_1000.toFixed(1)} kg.
          </p>
        </div>

        {/* KHỐI 2: TỔNG ĐƠN GIÁ PHẦN A */}
        <div className="p-6 bg-[#F9F9F9] border border-[#EAEAEA] rounded-[4px] flex flex-col md:flex-row items-center justify-between shadow-xs">
          <div>
            <h5 className="text-[16px] font-bold text-[#111111] tracking-tight">
              2: Tổng Đơn Giá Phần A (Vật Liệu + Tạo Khuôn)
            </h5>
            <p className="text-[12px] text-[#787774] mt-1.5 font-mono">
              = Tổng Chi Phí Mẻ ÷ Khối lượng Thành phẩm trong mẻ (1000kg × Tỷ lệ thu hồi) + Phí Thao Quy Đổi
            </p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <span className="text-[32px] font-extrabold font-mono text-[#111111] leading-none">
              {Math.round(partA_per_kg).toLocaleString('vi-VN')} <span className="text-[15px] font-bold font-sans ml-1">VNĐ/kg</span>
            </span>
          </div>
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
