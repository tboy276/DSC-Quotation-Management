import { useState, useEffect } from 'react';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { ToolingOpsList } from './ToolingOpsList';
import { ToolingAmortizationSection } from './ToolingAmortizationSection';
import { Section5SummaryCard } from './Section5SummaryCard';
import {
  INITIAL_CASTING_GRADES,
  fetchCastingGrades,
  fetchMoldingRecipe,
  fetchCastingSettings,
  getMoldingRecipeTotalCost1000kg,
  getFurnaceLadleCostPer1000kg,
} from '../../lib/master-data-service';
import type { CastingGrade, MoldingRecipeItem } from '../../types/master-data';
import { Modal } from '../ui/Modal';
import { FileText, Eye } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export const CastingCalculatorForm = () => {
  const casting = useQuotationStore((state) => state.castingInput);
  const setCastingField = useQuotationStore((state) => state.setCastingField);
  const addOp = useQuotationStore((state) => state.addCastingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateCastingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeCastingMachiningOp);
  const addComp = useQuotationStore((state) => state.addCastingPatternComponent);
  const updateComp = useQuotationStore((state) => state.updateCastingPatternComponent);
  const removeComp = useQuotationStore((state) => state.removeCastingPatternComponent);
  const selectGrade = useQuotationStore((state) => state.selectCastingGrade);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);

  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [grades, setGrades] = useState<CastingGrade[]>(INITIAL_CASTING_GRADES);
  const [recipeItems, setRecipeItems] = useState<MoldingRecipeItem[]>([]);

  useEffect(() => {
    const loadMasterData = async () => {
      const [fetchedGrades, fetchedRecipe, fetchedSettings] = await Promise.all([
        fetchCastingGrades(),
        fetchMoldingRecipe(),
        fetchCastingSettings(),
      ]);

      if (fetchedRecipe && fetchedRecipe.length > 0) {
        setRecipeItems(fetchedRecipe);
        const moldingTotal = getMoldingRecipeTotalCost1000kg(fetchedRecipe);
        setCastingField('C_molding_recipe_total_1000kg', moldingTotal);
      }

      if (fetchedSettings) {
        const furnaceTotal = getFurnaceLadleCostPer1000kg(fetchedSettings);
        setCastingField('C_furnace_ladle_per_1000kg', furnaceTotal);
        setCastingField('DG_finishing_per_kg', fetchedSettings.finishing_material_rate);
        setCastingField('DG_utility_per_kg', fetchedSettings.utility_rate);
        setCastingField('DG_labor_per_kg', fetchedSettings.labor_rate);
        setCastingField('DG_workshop_mgmt_per_kg', fetchedSettings.workshop_mgmt_rate);
        setCastingField('DG_equipment_depr_per_kg', fetchedSettings.equipment_depreciation_rate);
        setCastingField('DG_resin_core_per_kg', fetchedSettings.resin_core_sand_rate_per_kg || 12500);
      }

      if (fetchedGrades && fetchedGrades.length > 0) {
        setGrades(fetchedGrades);
        if (!casting.selected_casting_grade_id || !fetchedGrades.some((g) => g.id === casting.selected_casting_grade_id)) {
          selectGrade(fetchedGrades[0].id);
        } else {
          selectGrade(casting.selected_casting_grade_id);
        }
      }
    };
    loadMasterData();
  }, []);

  const res = getCastingResult();
  
  // Section 1/2 variables
  const yield_ratio = Math.max(0.01, (casting.Y_yield || 60)) / 100;
  const burn_ratio = (casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15) / 100;
  const m_cast = casting.m_cast || 0;
  const cost_metal_1000 = 1000 * (casting.DG_liquid || 0);
  const scrap_kg_1000 = Math.max(0, 1000 - (1000 * yield_ratio) - (1000 * burn_ratio));
  const cost_scrap_1000 = scrap_kg_1000 * (casting.DG_cast_scrap || 0);
  const cost_furnace_1000 = casting.C_furnace_ladle_per_1000kg || 120000;
  const cost_molding_1000 = casting.C_molding_recipe_total_1000kg || 1302200;
  const total_batch_cost = cost_metal_1000 - cost_scrap_1000 + cost_furnace_1000 + cost_molding_1000;
  const dg_liquid_final = total_batch_cost / 1000;
  const resinCoreCost = (casting.m_resin_core || 0) * (casting.DG_resin_core_per_kg || 12500);
  const coreSandCost = (casting.m_core || 0) * (casting.DG_core_sand_kg || 0);
  const totalCoreCostPerProduct = resinCoreCost + coreSandCost;
  const coreCostPerKg = m_cast > 0 ? totalCoreCostPerProduct / m_cast : 0;
  const partA_per_kg = (dg_liquid_final / yield_ratio) + coreCostPerKg;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* SECTION 1 & 2: PHẦN A (Bespoke UI) */}
      <div className="space-y-4 animate-fade-in-up">
        {/* Header Card */}
        <div className="border border-slate-200 rounded-[8px] p-4 bg-white flex items-start gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="w-5 h-5 bg-slate-100 rounded-[4px] mt-0.5 flex-shrink-0"></div>
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 uppercase tracking-wide">
              PHẦN A: VẬT LIỆU & TẠO KHUÔN
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Áp dụng phương pháp tính theo mẻ chuẩn 1,000kg kim loại lỏng.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="border border-slate-200 rounded-[8px] p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* Header of Main Card */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold text-slate-600 uppercase tracking-wider">
              NHẬP LIỆU VẬT TƯ & KHUÔN
            </h3>
            <button
              type="button"
              onClick={() => setShowRecipeModal(true)}
              className="px-3 py-1.5 bg-white text-[#111111] border border-slate-200 rounded-[6px] text-[12px] font-bold inline-flex items-center space-x-2 cursor-pointer hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              <span>3 Vật Tư Khuôn</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column - Inputs */}
            <div className="md:col-span-5 border border-slate-200 rounded-[8px] p-5 flex flex-col gap-5">
              {/* 1. Khối lượng */}
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700">1. Khối lượng vật đúc (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={casting.m_cast ?? ''}
                  onChange={(e) => setCastingField('m_cast', Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-mono text-[14px] text-slate-900 text-right focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>

              {/* 2. Tỷ lệ thu hồi */}
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700">2. Tỷ lệ thu hồi kim loại (%):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={casting.Y_yield ?? ''}
                  onChange={(e) => setCastingField('Y_yield', Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-mono text-[14px] text-slate-900 text-right focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>

              {/* 3. % Hao hụt hồi liệu */}
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700">3. % Hao hụt hồi liệu:</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15}
                  onChange={(e) => setCastingField('k_burn_loss', Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-mono text-[14px] text-slate-900 text-right focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>

              {/* 4. Mác gang đúc */}
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700">4. Mác gang đúc:</label>
                <select
                  value={casting.selected_casting_grade_id}
                  onChange={(e) => selectGrade(e.target.value)}
                  className="w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] text-slate-900 text-[13px] font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                >
                  {(grades.length > 0 ? grades : INITIAL_CASTING_GRADES).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Trọng lượng thao nhựa */}
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700">5. Trọng lượng thao nhựa (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={casting.m_resin_core ?? 0}
                  onChange={(e) => setCastingField('m_resin_core', Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px] font-mono text-[14px] text-slate-900 text-right focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Right Column - Calculations */}
            <div className="md:col-span-7 border border-slate-200 rounded-[8px] p-5 flex flex-col justify-center">
              <div className="flex-1 space-y-3.5">
                {/* I */}
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">I. Chi phí vật tư nấu luyện:</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">1000KG × DG_LIQUID</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-slate-900">{cost_metal_1000.toLocaleString('vi-VN')} đ</div>
                </div>

                {/* II */}
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">II. Hồi liệu thu hồi (-):</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">SCRAP_KG × DG_CAST_SCRAP</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-emerald-500">- {cost_scrap_1000.toLocaleString('vi-VN')} đ</div>
                </div>

                {/* III */}
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">III. Chi phí nấu luyện (Lò & Gầu):</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">ĐỊNH MỨC HỆ THỐNG</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-slate-900">{cost_furnace_1000.toLocaleString('vi-VN')} đ</div>
                </div>

                {/* IV */}
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">IV. Chi phí làm khuôn cát:</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">ĐỊNH MỨC HỆ THỐNG</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-slate-900">{cost_molding_1000.toLocaleString('vi-VN')} đ</div>
                </div>

                {/* V */}
                <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">V. Đơn giá thành phẩm:</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">TỔNG CHI PHÍ MẺ ÷ (1000KG × TỶ LỆ THU HỒI)</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-slate-900">{Math.round(dg_liquid_final / yield_ratio).toLocaleString('vi-VN')} VNĐ/kg</div>
                </div>

                {/* VI */}
                <div className="flex justify-between items-center pb-1">
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">VI. Phí thao quy đổi:</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">ĐỊNH MỨC HỆ THỐNG</div>
                  </div>
                  <div className="font-mono text-[15px] font-bold text-slate-900">{Math.round(coreCostPerKg).toLocaleString('vi-VN')} VNĐ/kg</div>
                </div>
              </div>

              {/* Total Box */}
              <div className="mt-3 bg-[#F4F7FB] border border-blue-100/50 rounded-[8px] p-4 flex justify-between items-end">
                <div>
                  <div className="text-[15px] font-extrabold text-slate-900 uppercase">TỔNG CHI PHÍ VẬT TƯ ĐÚC</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mt-1">ĐƠN GIÁ/KG × TRỌNG LƯỢNG VẬT ĐÚC</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-mono text-blue-500 mb-1">
                    ({Math.round(dg_liquid_final / yield_ratio).toLocaleString('vi-VN')} + {Math.round(coreCostPerKg).toLocaleString('vi-VN')}) × {m_cast.toLocaleString('vi-VN')}
                  </div>
                  <div className="text-[26px] leading-none font-mono font-extrabold text-blue-600">
                    {Math.round(partA_per_kg * m_cast).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: CHI PHÍ PHÂN XƯỞNG ĐÚC (Bespoke UI) */}
      <div className="border border-slate-200 rounded-[8px] p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-slate-100 rounded-[6px] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-slate-700" />
          </div>
          <h2 className="text-[15px] font-bold text-slate-900 uppercase tracking-wide">
            PHẦN B: CHI PHÍ PHÂN XƯỞNG ĐÚC
          </h2>
        </div>

        {/* List of items */}
        <div className="flex flex-col space-y-4">
          {/* I */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <div className="text-[13px] font-bold text-slate-900">I. Vật Tư HTSP:</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                {(casting.DG_finishing_per_kg || 771.82).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Đ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-mono text-[14px] font-bold text-slate-900">{res.C_finishing.toLocaleString('vi-VN')} đ</div>
          </div>

          {/* II */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <div className="text-[13px] font-bold text-slate-900">II. Điện + Nước Tiêu Hao Xưởng:</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                {(casting.DG_utility_per_kg || 3687.6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Đ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-mono text-[14px] font-bold text-slate-900">{res.C_utility.toLocaleString('vi-VN')} đ</div>
          </div>

          {/* III */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <div className="text-[13px] font-bold text-slate-900">III. Lương Trực Tiếp & Gián Tiếp:</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                {(casting.DG_labor_per_kg || 2461).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Đ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-mono text-[14px] font-bold text-slate-900">{res.C_labor.toLocaleString('vi-VN')} đ</div>
          </div>

          {/* IV */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <div className="text-[13px] font-bold text-slate-900">IV. Quản Lý Phân Xưởng:</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                {(casting.DG_workshop_mgmt_per_kg || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Đ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-mono text-[14px] font-bold text-slate-900">{res.C_workshop_mgmt.toLocaleString('vi-VN')} đ</div>
          </div>

          {/* V */}
          <div className="flex justify-between items-center pb-2">
            <div>
              <div className="text-[13px] font-bold text-slate-900">V. Khấu Hao Thiết Bị Xưởng:</div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                {(casting.DG_equipment_depr_per_kg || 4000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Đ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-mono text-[14px] font-bold text-slate-900">{res.C_equipment_depreciation.toLocaleString('vi-VN')} đ</div>
          </div>

          {/* Total Box */}
          <div className="mt-2 bg-[#F4F7FB] border border-blue-100/50 rounded-[6px] p-4 flex justify-between items-center">
            <div className="text-[14px] font-extrabold text-slate-900 uppercase">TỔNG PHẦN B XƯỞNG:</div>
            <div className="text-[18px] font-mono font-bold text-blue-600">
              {Math.round(res.C_part_b_total).toLocaleString('vi-VN')} <span className="text-[14px] font-bold uppercase">VNĐ/SP</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: GIA CÔNG CƠ KHÍ */}
      <MachiningOpsList
        operations={casting.machining_operations || []}
        totalMachiningCost={res.C_machining_casting}
        machiningNotes={casting.machining_notes}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
        onUpdateNotes={(notes) => setCastingField('machining_notes', notes)}
      />

      {/* 4A. Bóc Tách Chi Phí Mẫu */}
      <ToolingOpsList
        isForging={false}
        components={casting.pattern_components || []}
        C_design={casting.C_design ?? 15000000}
        k_mgmt_die={casting.k_mgmt_die ?? 10}
        cavity={casting.cavity ?? 1}
        life_coefficient={casting.life_coefficient ?? 20000}
        onAddComp={addComp}
        onUpdateComp={updateComp}
        onRemoveComp={removeComp}
        onUpdateField={(field, value) => setCastingField(field, value)}
      />

      {/* 4B. Section Khấu Hao Mẫu & Đơn Hàng (Tối giản hoá) */}
      <ToolingAmortizationSection
        isForging={false}
        treatment={casting.pattern_cost_treatment || 'separate'}
        onTreatmentChange={(treatment) => setCastingField('pattern_cost_treatment', treatment)}
        N_order={casting.N_order || res.actual_L_pattern_life || 20000}
        onNOrderChange={(val) => setCastingField('N_order', val)}
        totalToolingCost={res.actual_C_pattern_total || 0}
        autoToolLife={res.actual_L_pattern_life || 20000}
        amortizationCostPerUnit={res.C_pattern_amortization || 0}
      />

      {/* SECTION 5: TỔNG KẾT & BÁO GIÁ */}
      <Section5SummaryCard
        isForging={false}
        k_mgmt={casting.k_mgmt_cast ?? 10}
        onKMgmtChange={(val) => setCastingField('k_mgmt_cast', val)}
        DG_trans_kg={casting.DG_trans_kg ?? 1500}
        onDGTransChange={(val) => setCastingField('DG_trans_kg', val)}
        DG_pack_kg={casting.DG_pack_kg ?? 0}
        onDGPackChange={(val) => setCastingField('DG_pack_kg', val)}
        k_profit={casting.k_profit_casting ?? 12}
        onKProfitChange={(val) => setCastingField('k_profit_casting', val)}
        COGS={res.COGS}
        C_mgmt={res.COGS * ((casting.k_mgmt_cast || 0) / 100)}
        C_trans={(casting.DG_trans_kg || 0) * m_cast}
        C_pack={casting.DG_pack_kg !== undefined ? (casting.DG_pack_kg * m_cast) : (casting.C_pack || 0)}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.P_CASTING - res.pre_profit_price}
        final_price={res.P_CASTING}
      />
      
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
            <span className="font-bold text-[#111111]">Tổng Chi Phí Vật Tư Khuôn / 1,000kg:</span>
            <span className="font-mono text-sm font-extrabold text-[#111111]">
              {(casting.C_molding_recipe_total_1000kg || 1302200).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <table className="w-full text-left text-xs border border-[#EAEAEA] rounded-[6px] overflow-hidden">
            <thead className="bg-[#FBFBFA] border-b border-[#EAEAEA] font-semibold text-[#787774]">
              <tr>
                <th className="py-2 px-3">Tên Vật Tư / Dịch Vụ</th>
                <th className="py-2 px-3 text-right">Định Mức / 1000kg</th>
                <th className="py-2 px-3 text-right">Đơn Giá</th>
                <th className="py-2 px-3 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA] font-medium text-[#111111]">
              {(recipeItems.length > 0
                ? recipeItems
                : [
                    { id: '1', material_name: 'Bột đất sét', quantity_per_1000kg: 50, unit: 'kg', unit_price: 13900, is_outsourced: false, outsourced_cost_per_1000kg: 0 },
                    { id: '2', material_name: 'Cát đúc', quantity_per_1000kg: 300, unit: 'kg', unit_price: 1560, is_outsourced: false, outsourced_cost_per_1000kg: 0 },
                    { id: '3', material_name: 'Sơn khuôn', quantity_per_1000kg: 4, unit: 'kg', unit_price: 34800, is_outsourced: false, outsourced_cost_per_1000kg: 0 },
                  ]
              ).map((item) => {
                const itemCost = item.is_outsourced
                  ? item.outsourced_cost_per_1000kg
                  : item.quantity_per_1000kg * item.unit_price;
                return (
                  <tr key={item.id}>
                    <td className="py-2 px-3 font-bold text-[#111111]">
                      {item.material_name}
                      {item.is_outsourced && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          Thuê ngoài
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#787774]">
                      {item.is_outsourced ? '—' : `${item.quantity_per_1000kg} ${item.unit || 'kg'}`}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#787774]">
                      {item.is_outsourced ? '—' : `${item.unit_price.toLocaleString('vi-VN')} đ`}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#111111]">
                      {itemCost.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                );
              })}
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
