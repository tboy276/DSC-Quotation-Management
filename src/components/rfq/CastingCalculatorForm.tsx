import { useState, useEffect } from 'react';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import { INITIAL_CASTING_GRADES, fetchCastingGrades } from '../../lib/master-data-service';
import type { CastingGrade } from '../../types/master-data';
import { Modal } from '../ui/Modal';
import { Layers, Wrench, PieChart, Factory, Eye } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export const CastingCalculatorForm = () => {
  const casting = useQuotationStore((state) => state.castingInput);
  const setCastingField = useQuotationStore((state) => state.setCastingField);
  const addOp = useQuotationStore((state) => state.addCastingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateCastingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeCastingMachiningOp);
  const selectGrade = useQuotationStore((state) => state.selectCastingGrade);
  const getCastingResult = useQuotationStore((state) => state.getCastingResult);

  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [grades, setGrades] = useState<CastingGrade[]>(INITIAL_CASTING_GRADES);

  useEffect(() => {
    const loadMasterDataGrades = async () => {
      const fetched = await fetchCastingGrades();
      if (fetched && fetched.length > 0) {
        setGrades(fetched);
        if (!casting.selected_casting_grade_id || !fetched.some((g) => g.id === casting.selected_casting_grade_id)) {
          selectGrade(fetched[0].id);
        } else {
          selectGrade(casting.selected_casting_grade_id);
        }
      }
    };
    loadMasterDataGrades();
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
      {/* SECTION 1 & 2: PHẦN A */}
      <CostSectionCard
        icon={<Layers className="w-5 h-5" />}
        title="PHẦN A: VẬT LIỆU & TẠO KHUÔN (PHƯƠNG PHÁP ĐÚC SINTO)"
        subtitle="Áp dụng phương pháp tính theo mẻ chuẩn 1,000kg kim loại lỏng."
        topInputs={
          <>
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
          </>
        }
        mainBlockTitle="1. Chi Phí Vật Liệu & Thao Cát (Quy Đổi Mẻ Chuẩn)"
        mainBlockHeaderRight={
          <button
            type="button"
            onClick={() => setShowRecipeModal(true)}
            className="px-2.5 py-1.5 bg-white text-[#111111] border border-[#EAEAEA] rounded-[4px] text-[11px] font-bold inline-flex items-center space-x-1.5 cursor-pointer hover:bg-[#F0F0EE] shadow-sm transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3 Vật Tư Khuôn</span>
          </button>
        }
        mainLeftContent={
          <>
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
          </>
        }
        breakdownItems={[
          { label: 'I. Chi phí vật tư nấu luyện', value: `${cost_metal_1000.toLocaleString('vi-VN')} đ` },
          { label: 'II. Hồi liệu thu hồi (-):', value: `-${cost_scrap_1000.toLocaleString('vi-VN')} đ`, valueClassName: 'text-[#10B981]' },
          { label: 'III. Chi phí nấu luyện (Lò&Gầu):', value: `${cost_furnace_1000.toLocaleString('vi-VN')} đ` },
          { label: 'IV. Chi phí làm khuôn cát:', value: `${cost_molding_1000.toLocaleString('vi-VN')} đ` },
        ]}
        breakdownTotal={{ label: 'Tổng Chi Phí Mẻ (I - II + III + IV):', value: `${total_batch_cost.toLocaleString('vi-VN')} VNĐ` }}
        infoBoxes={[
          { label: 'Đơn Giá Thành Phẩm', value: Math.round(dg_liquid_final / yield_ratio).toLocaleString('vi-VN'), unit: 'VNĐ/kg' },
          { label: 'Phí Thao Quy Đổi', value: Math.round(coreCostPerKg).toLocaleString('vi-VN'), unit: 'VNĐ/kg' },
        ]}
        bottomNote={`* DG_liquid: ${(casting.DG_liquid || 0).toLocaleString('vi-VN')} đ/kg | DG_cast_scrap: ${(casting.DG_cast_scrap || 0).toLocaleString('vi-VN')} đ/kg | Hồi liệu mẻ 1000kg: ${scrap_kg_1000.toFixed(1)} kg.`}
        footerTitle="2: Tổng Đơn Giá Phần A (Vật Liệu + Tạo Khuôn)"
        footerSubtitle="= Tổng Chi Phí Mẻ ÷ Khối lượng Thành phẩm trong mẻ (1000kg × Tỷ lệ thu hồi) + Phí Thao Quy Đổi"
        footerTotal={Math.round(partA_per_kg).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/kg"
      />

      {/* SECTION B: CHI PHÍ XƯỞNG */}
      <CostSectionCard
        icon={<Factory className="w-5 h-5" />}
        title={`PHẦN B: CHI PHÍ XƯỞNG SAU ĐÚC (Quy Đổi Theo ${m_cast} kg Thành Phẩm)`}
        breakdownItems={[
          { label: `I. Vật Tư HTSP (${(casting.DG_finishing_per_kg || 771.82).toLocaleString('vi-VN')} đ/kg)`, value: `${res.C_finishing.toLocaleString('vi-VN')} đ` },
          { label: `II. Điện + Nước Tiêu Hao Xưởng (${(casting.DG_utility_per_kg || 3687.6).toLocaleString('vi-VN')} đ/kg)`, value: `${res.C_utility.toLocaleString('vi-VN')} đ` },
          { label: `III. Lương Trực Tiếp & Gián Tiếp (${(casting.DG_labor_per_kg || 2461).toLocaleString('vi-VN')} đ/kg)`, value: `${res.C_labor.toLocaleString('vi-VN')} đ` },
          { label: `IV. Quản Lý Phân Xưởng (${(casting.DG_workshop_mgmt_per_kg || 0).toLocaleString('vi-VN')} đ/kg)`, value: `${res.C_workshop_mgmt.toLocaleString('vi-VN')} đ` },
          { label: `V. Khấu Hao Thiết Bị Xưởng (${(casting.DG_equipment_depr_per_kg || 4000).toLocaleString('vi-VN')} đ/kg)`, value: `${res.C_equipment_depreciation.toLocaleString('vi-VN')} đ` },
        ]}
        breakdownTotal={{ label: 'Tổng Phần B Xưởng:', value: `${res.C_part_b_total.toLocaleString('vi-VN')} VNĐ` }}
        footerTitle="Tổng Đơn Giá Phần B (Chi Phí Xưởng)"
        footerSubtitle="= Tổng Chi Phí Phần B ÷ Khối lượng Thành phẩm"
        footerTotal={Math.round(res.C_part_b_total / Math.max(0.0001, m_cast)).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/kg"
      />

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

      {/* SECTION 4: KHẤU HAO MẪU */}
      <CostSectionCard
        icon={<Wrench className="w-5 h-5" />}
        title="SECTION 4: BỘ MẪU ĐÚC SINTO & SẢN LƯỢNG ĐƠN HÀNG"
        topInputs={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Tổng Chi Phí Bộ Mẫu Đúc (VNĐ)
              </label>
              <input
                type="number"
                step="1000000"
                value={casting.C_pattern_total}
                onChange={(e) => setCastingField('C_pattern_total', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Tuổi Thọ Mẫu (L_pattern_life - SP)
              </label>
              <input
                type="number"
                value={casting.L_pattern_life}
                onChange={(e) => setCastingField('L_pattern_life', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Sản Lượng Đơn Hàng (N_order)
              </label>
              <input
                type="number"
                value={casting.N_order}
                onChange={(e) => setCastingField('N_order', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
          </>
        }
        mainLeftContent={
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-2">
              Cơ Chế Xử Lý Tiền Mẫu
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCastingField('pattern_cost_treatment', 'amortized')}
                className={`px-3 py-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer border text-left ${
                  casting.pattern_cost_treatment === 'amortized'
                    ? 'bg-white border-[#111111] text-[#111111] shadow-sm'
                    : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                }`}
              >
                Phân Bổ Vào Giá Vốn (Amortized COGS)
              </button>
              <button
                type="button"
                onClick={() => setCastingField('pattern_cost_treatment', 'separate')}
                className={`px-3 py-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer border text-left ${
                  casting.pattern_cost_treatment === 'separate'
                    ? 'bg-[#FDEBEC] border-[#9F2F2D] text-[#9F2F2D] shadow-sm'
                    : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                }`}
              >
                Tách Riêng Khoản Mẫu (Separate Fee)
              </button>
            </div>
          </div>
        }
        breakdownItems={
          casting.pattern_cost_treatment === 'amortized' ? [
            { label: 'I. Tổng Chi Phí Mẫu:', value: `${(casting.C_pattern_total || 0).toLocaleString('vi-VN')} đ` },
            { label: 'II. Mẫu số khấu hao (Min giữa L_pattern_life và N_order):', value: `${Math.min(casting.L_pattern_life || 1, Math.max(1, casting.N_order || 1)).toLocaleString('vi-VN')} SP` },
          ] : [
            { label: 'I. Tiền Mẫu Tách Riêng Nhập 1 Lần:', value: `${(casting.C_pattern_total || 0).toLocaleString('vi-VN')} đ` },
          ]
        }
        breakdownTotal={
          casting.pattern_cost_treatment === 'amortized' ? { label: 'Khấu hao tiền mẫu / Sản phẩm:', value: `${res.C_pattern_amortization.toLocaleString('vi-VN')} VNĐ/SP` } : undefined
        }
        footerTitle="Phí Khấu Hao Mẫu (Cộng vào Giá Vốn COGS)"
        footerSubtitle={casting.pattern_cost_treatment === 'amortized' ? "= Phí Khấu Hao Mẫu / Sản phẩm" : "Tiền mẫu tách riêng, KHÔNG phân bổ vào COGS"}
        footerTotal={casting.pattern_cost_treatment === 'amortized' ? res.C_pattern_amortization.toLocaleString('vi-VN') : 0}
        footerTotalUnit="VNĐ/SP"
      />

      {/* SECTION 5: TỔNG KẾT & BÁO GIÁ */}
      <CostSectionCard
        icon={<PieChart className="w-5 h-5" />}
        title="SECTION 5: TỔNG HỢP & BÁO GIÁ CUỐI CÙNG"
        topInputs={
          <>
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
          </>
        }
        mainBlockTitle="Tổng Hợp Chi Phí (Cho 1 Sản Phẩm)"
        breakdownItems={[
          { label: 'I. Giá Vốn Đúc (COGS):', value: `${res.COGS.toLocaleString('vi-VN')} đ` },
          { label: `II. Phí Quản Lý Công Ty (${casting.k_mgmt_cast}%):`, value: `${(res.COGS * (casting.k_mgmt_cast || 0) / 100).toLocaleString('vi-VN')} đ` },
          { label: `III. Phí Vận Chuyển (${(casting.DG_trans_kg || 0).toLocaleString('vi-VN')} đ/kg):`, value: `${((casting.DG_trans_kg || 0) * m_cast).toLocaleString('vi-VN')} đ` },
          { label: 'IV. Phí Bao Gói:', value: `${(casting.C_pack || 0).toLocaleString('vi-VN')} đ` },
        ]}
        breakdownTotal={{ label: 'Tổng Giá Thành TRƯỚC Lợi Nhuận:', value: `${res.pre_profit_price.toLocaleString('vi-VN')} VNĐ` }}
        infoBoxes={[
          { label: `Lợi Nhuận Mục Tiêu (${casting.k_profit_casting}%)`, value: (res.P_CASTING - res.pre_profit_price).toLocaleString('vi-VN'), unit: 'VNĐ' },
        ]}
        footerTitle="ĐƠN GIÁ BÁO GIÁ CUỐI CÙNG (GIÁ BÁN)"
        footerSubtitle={`= Giá Thành Trước Lợi Nhuận × (1 + ${casting.k_profit_casting}%)`}
        footerTotal={res.P_CASTING.toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
        isFinalTotal={true}
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
