import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { ToolingOpsList } from './ToolingOpsList';
import { ToolingAmortizationSection } from './ToolingAmortizationSection';
import { Section5SummaryCard } from './Section5SummaryCard';
import {
  INITIAL_MATERIALS,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
} from '../../lib/master-data-service';
import { Workflow, Layers } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export const ForgingCalculatorForm = () => {
  const forging = useQuotationStore((state) => state.forgingInput);
  const setForgingField = useQuotationStore((state) => state.setForgingField);
  const addOp = useQuotationStore((state) => state.addForgingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateForgingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeForgingMachiningOp);
  const addComp = useQuotationStore((state) => state.addForgingDieComponent);
  const updateComp = useQuotationStore((state) => state.updateForgingDieComponent);
  const removeComp = useQuotationStore((state) => state.removeForgingDieComponent);
  const selectMaterial = useQuotationStore((state) => state.selectForgingMaterial);
  const selectMachineRate = useQuotationStore((state) => state.selectForgingMachineRate);
  const getForgingResult = useQuotationStore((state) => state.getForgingResult);

  const steelMaterials = INITIAL_MATERIALS.filter(
    (m) => m.category === 'Thép cán - Rèn'
  );

  const res = getForgingResult();

  // Variables for Section 2 (Operations breakdown)
  const C_cut = ((forging.t_cut_sec || 0) / 3600) * (forging.DG_sawing_machine_hour || 0);
  const C_heat_induction = res.m_phoi * (forging.w_elec_kwh_per_kg || 0) * (forging.DG_elec_kwh || 0);
  const C_forging_op = ((forging.t_forging_sec || 0) / 3600) * (forging.DG_forging_machine_hour || 0);
  const C_trim = ((forging.t_trim_sec || 0) / 3600) * (forging.DG_trim_machine_hour || 0);
  const C_heat_treat = res.m_phoi * (forging.DG_heat_treat_kg || 0);
  const C_clean = res.m_phoi * (forging.DG_clean_kg || 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-5 h-5" />}
        title="SECTION 1: VẬT LIỆU THÉP PHÔI RÈN"
        topInputs={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Khối Lượng Phôi Tinh (m_tinh - kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={forging.m_tinh}
                onChange={(e) => setForgingField('m_tinh', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Khối Lượng Ba-via (m_bavia - kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={forging.m_bavia}
                onChange={(e) => setForgingField('m_bavia', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Phần Trăm Cháy Hao Phôi (k_loss - %)
              </label>
              <input
                type="number"
                step="0.1"
                value={forging.k_loss}
                onChange={(e) => setForgingField('k_loss', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
          </>
        }
        mainBlockTitle="Tính Toán Giá Phôi"
        mainLeftContent={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Chọn Mác Thép & Nguồn Gốc (Từ Master Data)
              </label>
              <select
                value={forging.selected_material_id}
                onChange={(e) => selectMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-[13px]"
              >
                {steelMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Thép: {(m.latest_price || 0).toLocaleString('vi-VN')} VNĐ/kg | Phế: {(m.scrap_price || 0).toLocaleString('vi-VN')} VNĐ/kg
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Đơn Giá Thép (DG_steel)
                </label>
                <input
                  type="number"
                  value={forging.DG_steel}
                  onChange={(e) => setForgingField('DG_steel', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Thu Hồi Ba-via (DG_scrap)
                </label>
                <input
                  type="number"
                  value={forging.DG_scrap}
                  onChange={(e) => setForgingField('DG_scrap', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
                />
              </div>
            </div>
          </>
        }
        breakdownItems={[
          { label: 'I. Tiền thép phôi (m_phoi × DG_steel):', value: `${(res.m_phoi * forging.DG_steel).toLocaleString('vi-VN')} đ` },
          { label: 'II. Hồi liệu Ba-via thu hồi (-):', value: `-${(forging.m_bavia * forging.DG_scrap).toLocaleString('vi-VN')} đ`, valueClassName: 'text-[#10B981]' },
        ]}
        breakdownTotal={{ label: 'Tổng Tiền Vật Liệu (I - II):', value: `${res.C_mat_forging.toLocaleString('vi-VN')} VNĐ` }}
        infoBoxes={[
          { label: 'Tổng Khối Lượng Phôi', value: res.m_phoi.toLocaleString('vi-VN'), unit: 'kg' },
        ]}
        footerTitle="1: Tổng Đơn Giá Vật Liệu Thép"
        footerSubtitle="= (m_phoi × DG_steel) - (m_bavia × DG_scrap)"
        footerTotal={res.C_mat_forging.toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
      />

      {/* 2. Section Công Nghệ & Hệ Máy Rèn */}
      <CostSectionCard
        icon={<Layers className="w-5 h-5" />}
        title="SECTION 2: CÔNG NGHỆ RÈN & HỆ THIẾT BỊ"
        topInputs={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Thời Gian Cắt Phôi (t_cut - s)
              </label>
              <input
                type="number"
                value={forging.t_cut_sec}
                onChange={(e) => setForgingField('t_cut_sec', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Thời Gian Máy Rèn (t_forging - s)
              </label>
              <input
                type="number"
                value={forging.t_forging_sec}
                onChange={(e) => setForgingField('t_forging_sec', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Thời Gian Cắt Ba-via (t_trim - s)
              </label>
              <input
                type="number"
                value={forging.t_trim_sec}
                onChange={(e) => setForgingField('t_trim_sec', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Nhiệt Luyện (DG_heat_treat - VNĐ/kg)
              </label>
              <input
                type="number"
                value={forging.DG_heat_treat_kg}
                onChange={(e) => setForgingField('DG_heat_treat_kg', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Phun Bi/Làm Sạch (DG_clean - VNĐ/kg)
              </label>
              <input
                type="number"
                value={forging.DG_clean_kg}
                onChange={(e) => setForgingField('DG_clean_kg', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Đơn Giá Điện (DG_elec - VNĐ/kWh)
              </label>
              <input
                type="number"
                value={forging.DG_elec_kwh}
                onChange={(e) => setForgingField('DG_elec_kwh', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
          </>
        }
        mainBlockTitle="Lựa Chọn Hệ Máy Rèn"
        mainLeftContent={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Hệ Thiết Bị Rèn Chính
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => selectMachineRate(forging.selected_press_rate_id, 'press')}
                  className={`px-3 py-2 rounded-[4px] text-[13px] font-bold transition-all cursor-pointer border text-left ${
                    forging.forging_machine_type === 'press'
                      ? 'bg-white border-[#111111] text-[#111111] shadow-sm'
                      : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                  }`}
                >
                  Máy Dập (Presses)
                </button>
                <button
                  type="button"
                  onClick={() => selectMachineRate(forging.selected_hammer_rate_id, 'hammer')}
                  className={`px-3 py-2 rounded-[4px] text-[13px] font-bold transition-all cursor-pointer border text-left ${
                    forging.forging_machine_type === 'hammer'
                      ? 'bg-white border-[#111111] text-[#111111] shadow-sm'
                      : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                  }`}
                >
                  Máy Búa Khuỷu Thủy Lực
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Chọn Dải Tải Trọng / Năng Lượng Máy
              </label>
              {forging.forging_machine_type === 'press' ? (
                <select
                  value={forging.selected_press_rate_id}
                  onChange={(e) => selectMachineRate(e.target.value, 'press')}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-[13px]"
                >
                  {INITIAL_PRESSING_RATES.map((r) => (
                    <option key={r.id} value={r.id}>
                      Máy Dập {r.tonnage_min} - {r.tonnage_max} Tấn — {r.rate_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={forging.selected_hammer_rate_id}
                  onChange={(e) => selectMachineRate(e.target.value, 'hammer')}
                  className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-[13px]"
                >
                  {INITIAL_HAMMER_RATES.map((r) => (
                    <option key={r.id} value={r.id}>
                      Máy Búa {r.energy_min} - {r.energy_max} kJ — {r.rate_per_hour.toLocaleString('vi-VN')} VNĐ/giờ
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        }
        breakdownItems={[
          { label: 'I. Chi phí máy cưa:', value: `${Math.round(C_cut).toLocaleString('vi-VN')} đ` },
          { label: 'II. Nung phôi điện cảm ứng:', value: `${Math.round(C_heat_induction).toLocaleString('vi-VN')} đ` },
          { label: 'III. Chi phí máy rèn:', value: `${Math.round(C_forging_op).toLocaleString('vi-VN')} đ` },
          { label: 'IV. Chi phí cắt ba-via:', value: `${Math.round(C_trim).toLocaleString('vi-VN')} đ` },
          { label: 'V. Chi phí nhiệt luyện:', value: `${Math.round(C_heat_treat).toLocaleString('vi-VN')} đ` },
          { label: 'VI. Chi phí phun bi / Làm sạch:', value: `${Math.round(C_clean).toLocaleString('vi-VN')} đ` },
        ]}
        breakdownTotal={{ label: 'Tổng Chi Phí Rèn & XLB:', value: `${res.C_ops_forging.toLocaleString('vi-VN')} VNĐ` }}
        footerTitle="2: Tổng Đơn Giá Công Nghệ Rèn"
        footerSubtitle="= Tổng chi phí máy móc, nhiệt luyện và làm sạch"
        footerTotal={res.C_ops_forging.toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
      />

      {/* 3. Section Gia Công Cơ Khí Động (CNC Ops) */}
      <MachiningOpsList
        operations={forging.machining_operations || []}
        totalMachiningCost={res.C_machining}
        machiningNotes={forging.machining_notes}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
        onUpdateNotes={(notes) => setForgingField('machining_notes', notes)}
      />

      {/* 4A. Bóc Tách Chi Phí Khuôn */}
      <ToolingOpsList
        isForging={true}
        components={forging.die_components || []}
        C_design={forging.C_design ?? 15000000}
        k_mgmt_die={forging.k_mgmt_die ?? 10}
        cavity={forging.cavity ?? 1}
        life_coefficient={forging.life_coefficient ?? 20000}
        onAddComp={addComp}
        onUpdateComp={updateComp}
        onRemoveComp={removeComp}
        onUpdateField={(field, value) => setForgingField(field, value)}
      />

      {/* 4B. Section Khấu Hao Khuôn & Đơn Hàng (Tối giản hoá) */}
      <ToolingAmortizationSection
        isForging={true}
        treatment={forging.die_cost_treatment || 'separate'}
        onTreatmentChange={(treatment) => setForgingField('die_cost_treatment', treatment)}
        N_order={forging.N_order || res.actual_L_die_life || 20000}
        onNOrderChange={(val) => setForgingField('N_order', val)}
        totalToolingCost={res.actual_C_die_total || 0}
        autoToolLife={res.actual_L_die_life || 20000}
        amortizationCostPerUnit={res.C_die_amortization || 0}
      />

      {/* 5. Section 5: Tổng Hợp & Báo Giá Cuối Cùng */}
      <Section5SummaryCard
        isForging={true}
        k_mgmt={forging.k_mgmt ?? 8}
        onKMgmtChange={(val) => setForgingField('k_mgmt', val)}
        DG_trans_kg={forging.DG_trans_kg ?? 1500}
        onDGTransChange={(val) => setForgingField('DG_trans_kg', val)}
        DG_pack_kg={forging.DG_pack_kg ?? 0}
        onDGPackChange={(val) => setForgingField('DG_pack_kg', val)}
        k_profit={forging.k_profit_forging ?? 15}
        onKProfitChange={(val) => setForgingField('k_profit_forging', val)}
        COGS={res.COGS}
        C_mgmt={res.COGS * ((forging.k_mgmt || 0) / 100)}
        C_trans={(forging.DG_trans_kg || 0) * res.m_phoi}
        C_pack={forging.DG_pack_kg !== undefined ? (forging.DG_pack_kg * res.m_phoi) : (forging.C_pack || 0)}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.P_FORGING - res.pre_profit_price}
        final_price={res.P_FORGING}
      />
    </div>
  );
};
