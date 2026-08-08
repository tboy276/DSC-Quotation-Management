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
import { ActionButton } from '../ui/ActionButton';
import { Modal } from '../ui/Modal';
import { FileText, Eye, Workflow } from 'lucide-react';
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

  const section1Left = (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">1. Khối lượng vật đúc (kg):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={casting.m_cast ?? ''}
          onChange={(e) => setCastingField('m_cast', Math.max(0, Number(e.target.value)))}
          className="w-28 px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] bg-white text-right focus:outline-none focus:border-[#111111]"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">2. Tỷ lệ thu hồi kim loại (%):</label>
        <input
          type="number"
          step="1"
          min="0"
          value={casting.Y_yield ?? ''}
          onChange={(e) => setCastingField('Y_yield', Math.max(0, Number(e.target.value)))}
          className="w-28 px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] bg-white text-right focus:outline-none focus:border-[#111111]"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">3. % Hao hụt hồi liệu:</label>
        <input
          type="number"
          step="0.05"
          min="0"
          value={casting.k_burn_loss !== undefined ? casting.k_burn_loss : 2.15}
          onChange={(e) => setCastingField('k_burn_loss', Math.max(0, Number(e.target.value)))}
          className="w-28 px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] bg-white text-right focus:outline-none focus:border-[#111111]"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">4. Mác gang đúc:</label>
        <select
          value={casting.selected_casting_grade_id}
          onChange={(e) => selectGrade(e.target.value)}
          className="w-36 px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-bold text-xs text-[#111111] bg-white focus:outline-none focus:border-[#111111]"
        >
          {(grades.length > 0 ? grades : INITIAL_CASTING_GRADES).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">5. Trọng lượng thao nhựa (kg):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={casting.m_resin_core ?? 0}
          onChange={(e) => setCastingField('m_resin_core', Math.max(0, Number(e.target.value)))}
          className="w-28 px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] bg-white text-right focus:outline-none focus:border-[#111111]"
        />
      </div>
    </div>
  );

  const section1Right = (
    <div className="space-y-2 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">I. Phí vật tư nấu luyện:</div>
          <div className="text-[10px] font-mono text-[#787774]">1000KG × DG_LIQUID</div>
        </div>
        <div className="font-bold text-[#111111]">{cost_metal_1000.toLocaleString('vi-VN')} VNĐ</div>
      </div>

      <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">II. Hồi liệu thu hồi (-):</div>
          <div className="text-[10px] font-mono text-[#787774]">SCRAP_KG × DG_SCRAP</div>
        </div>
        <div className="font-bold text-[#346538]">- {cost_scrap_1000.toLocaleString('vi-VN')} VNĐ</div>
      </div>

      <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">III. Phí nấu luyện (Lò & Gầu):</div>
          <div className="text-[10px] font-mono text-[#787774]">ĐỊNH MỨC HỆ THỐNG</div>
        </div>
        <div className="font-bold text-[#111111]">{cost_furnace_1000.toLocaleString('vi-VN')} VNĐ</div>
      </div>

      <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">IV. Phí làm khuôn cát:</div>
          <div className="text-[10px] font-mono text-[#787774]">ĐỊNH MỨC HỆ THỐNG</div>
        </div>
        <div className="font-bold text-[#111111]">{cost_molding_1000.toLocaleString('vi-VN')} VNĐ</div>
      </div>

      <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">V. Đơn giá thành phẩm:</div>
          <div className="text-[10px] font-mono text-[#787774]">CHI PHÍ MẺ ÷ (1000KG × TỶ LỆ THU HỒI)</div>
        </div>
        <div className="font-bold text-[#111111]">{Math.round(dg_liquid_final / yield_ratio).toLocaleString('vi-VN')} VNĐ/kg</div>
      </div>

      <div className="flex justify-between items-center py-1">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">VI. Phí thao quy đổi:</div>
          <div className="text-[10px] font-mono text-[#787774]">ĐỊNH MỨC HỆ THỐNG</div>
        </div>
        <div className="font-bold text-[#111111]">{Math.round(coreCostPerKg).toLocaleString('vi-VN')} VNĐ/kg</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* SECTION 1: VẬT LIỆU KIM LOẠI LỎNG & KHUÔN (PHẦN A) */}
      <CostSectionCard
        icon={<Workflow className="w-5 h-5 text-[#111111]" />}
        title="SECTION 1: VẬT LIỆU KIM LOẠI LỎNG & TẠO KHUÔN (PHẦN A)"
        mainBlockTitle="Nhập Liệu Vật Tư & Khuôn Mẻ 1,000kg"
        mainBlockHeaderRight={
          <button
            type="button"
            onClick={() => setShowRecipeModal(true)}
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white rounded-[4px] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3 Vật Tư Khuôn</span>
          </button>
        }
        mainLeftContent={section1Left}
        mainRightContent={section1Right}
        footerTitle="TỔNG CHI PHÍ VẬT TƯ ĐÚC (PHẦN A)"
        footerSubtitle="= Đơn giá/kg × Trọng lượng vật đúc"
        footerTotal={Math.round(partA_per_kg * m_cast).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
      />

      {/* SECTION 2: CHI PHÍ PHÂN XƯỞNG ĐÚC (PHẦN B) */}
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] p-4 shadow-xs space-y-4 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-2.5">
          <FileText className="w-4 h-4 text-[#111111] stroke-[2]" />
          <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            SECTION 2: CHI PHÍ PHÂN XƯỞNG ĐÚC (PHẦN B)
          </h2>
        </div>

        {/* List of items */}
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
            <div>
              <div className="text-[11px] font-bold text-[#111111] font-sans">I. Vật Tư HTSP:</div>
              <div className="text-[10px] font-mono text-[#787774]">
                {(casting.DG_finishing_per_kg || 771.82).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-bold text-[#111111]">{res.C_finishing.toLocaleString('vi-VN')} VNĐ</div>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
            <div>
              <div className="text-[11px] font-bold text-[#111111] font-sans">II. Điện + Nước Tiêu Hao Xưởng:</div>
              <div className="text-[10px] font-mono text-[#787774]">
                {(casting.DG_utility_per_kg || 3687.6).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-bold text-[#111111]">{res.C_utility.toLocaleString('vi-VN')} VNĐ</div>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
            <div>
              <div className="text-[11px] font-bold text-[#111111] font-sans">III. Lương Trực Tiếp & Gián Tiếp:</div>
              <div className="text-[10px] font-mono text-[#787774]">
                {(casting.DG_labor_per_kg || 2461).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-bold text-[#111111]">{res.C_labor.toLocaleString('vi-VN')} VNĐ</div>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
            <div>
              <div className="text-[11px] font-bold text-[#111111] font-sans">IV. Quản Lý Phân Xưởng:</div>
              <div className="text-[10px] font-mono text-[#787774]">
                {(casting.DG_workshop_mgmt_per_kg || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-bold text-[#111111]">{res.C_workshop_mgmt.toLocaleString('vi-VN')} VNĐ</div>
          </div>

          <div className="flex justify-between items-center py-1">
            <div>
              <div className="text-[11px] font-bold text-[#111111] font-sans">V. Khấu Hao Thiết Bị Xưởng:</div>
              <div className="text-[10px] font-mono text-[#787774]">
                {(casting.DG_equipment_depr_per_kg || 4000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ/KG × {m_cast} KG
              </div>
            </div>
            <div className="font-bold text-[#111111]">{res.C_equipment_depreciation.toLocaleString('vi-VN')} VNĐ</div>
          </div>

          {/* Signature Dark Obsidian Total Box for Part B */}
          <div className="mt-3 bg-[#111111] text-white rounded-[6px] p-3.5 flex items-center justify-between border border-[#111111] shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                TỔNG PHẦN B PHÂN XƯỞNG ĐÚC
              </p>
              <p className="font-mono font-extrabold text-2xl text-emerald-400 leading-none">
                {Math.round(res.C_part_b_total).toLocaleString('vi-VN')}
              </p>
            </div>
            <span className="font-mono font-bold text-xs text-white uppercase">
              VNĐ / Chi tiết
            </span>
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
          <ActionButton
            variant="primary"
            onClick={() => setShowRecipeModal(false)}
            label="Đóng Màn Hình"
          />
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
