import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { SliderInput } from '../ui/SliderInput';
import {
  INITIAL_MATERIALS,
  INITIAL_PRESSING_RATES,
  INITIAL_HAMMER_RATES,
} from '../../lib/master-data-service';
import { Workflow, Layers, Wrench, PieChart } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export const ForgingCalculatorForm = () => {
  const forging = useQuotationStore((state) => state.forgingInput);
  const setForgingField = useQuotationStore((state) => state.setForgingField);
  const addOp = useQuotationStore((state) => state.addForgingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateForgingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeForgingMachiningOp);
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
        N_order={forging.N_order || 1}
        totalMachiningCost={res.C_machining}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
      />

      {/* 4. Section Khấu Hao Khuôn & Đơn Hàng */}
      <CostSectionCard
        icon={<Wrench className="w-5 h-5" />}
        title="SECTION 4: BỘ KHUÔN RÈN & SẢN LƯỢNG ĐƠN HÀNG"
        topInputs={
          <>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Tổng Chi Phí Bộ Khuôn (VNĐ)
              </label>
              <input
                type="number"
                step="1000000"
                value={forging.C_die_total}
                onChange={(e) => setForgingField('C_die_total', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Tuổi Thọ Khuôn (L_die_life - SP)
              </label>
              <input
                type="number"
                value={forging.L_die_life}
                onChange={(e) => setForgingField('L_die_life', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Sản Lượng Đơn Hàng (N_order)
              </label>
              <input
                type="number"
                value={forging.N_order}
                onChange={(e) => setForgingField('N_order', Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[13px] text-[#111111]"
              />
            </div>
          </>
        }
        mainLeftContent={
          <div>
            <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-2">
              Cơ Chế Xử Lý Tiền Khuôn
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setForgingField('die_cost_treatment', 'amortized')}
                className={`px-3 py-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer border text-left ${
                  forging.die_cost_treatment === 'amortized'
                    ? 'bg-white border-[#111111] text-[#111111] shadow-sm'
                    : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                }`}
              >
                Phân Bổ Vào Giá Vốn (Amortized COGS)
              </button>
              <button
                type="button"
                onClick={() => setForgingField('die_cost_treatment', 'separate')}
                className={`px-3 py-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer border text-left ${
                  forging.die_cost_treatment === 'separate'
                    ? 'bg-[#FDEBEC] border-[#9F2F2D] text-[#9F2F2D] shadow-sm'
                    : 'bg-[#F9F9F9] border-[#EAEAEA] text-[#787774] hover:text-[#111111]'
                }`}
              >
                Tách Riêng Khoản Khuôn (Separate Fee)
              </button>
            </div>
          </div>
        }
        breakdownItems={
          forging.die_cost_treatment === 'amortized' ? [
            { label: 'I. Tổng Chi Phí Khuôn:', value: `${(forging.C_die_total || 0).toLocaleString('vi-VN')} đ` },
            { label: 'II. Mẫu số khấu hao:', value: `${Math.min(forging.L_die_life || 1, Math.max(1, forging.N_order || 1)).toLocaleString('vi-VN')} SP` },
          ] : [
            { label: 'I. Tiền Khuôn Tách Riêng Nhập 1 Lần:', value: `${(forging.C_die_total || 0).toLocaleString('vi-VN')} đ` },
          ]
        }
        breakdownTotal={
          forging.die_cost_treatment === 'amortized' ? { label: 'Khấu hao tiền khuôn / Sản phẩm:', value: `${res.C_die_amortization.toLocaleString('vi-VN')} VNĐ/SP` } : undefined
        }
        footerTitle="Phí Khấu Hao Khuôn (Cộng vào Giá Vốn COGS)"
        footerSubtitle={forging.die_cost_treatment === 'amortized' ? "= Phí Khấu Hao Khuôn / Sản phẩm" : "Tiền khuôn tách riêng, KHÔNG phân bổ vào COGS"}
        footerTotal={forging.die_cost_treatment === 'amortized' ? res.C_die_amortization.toLocaleString('vi-VN') : 0}
        footerTotalUnit="VNĐ/SP"
      />

      {/* 5. Section Sliders: Chi Phí Quản Lý, Vận Chuyển & Lợi Nhuận */}
      <CostSectionCard
        icon={<PieChart className="w-5 h-5" />}
        title="SECTION 5: TỔNG HỢP & BÁO GIÁ CUỐI CÙNG"
        topInputs={
          <>
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
          </>
        }
        mainBlockTitle="Tổng Hợp Chi Phí (Cho 1 Sản Phẩm)"
        breakdownItems={[
          { label: 'I. Giá Vốn Rèn (COGS):', value: `${res.COGS.toLocaleString('vi-VN')} đ` },
          { label: `II. Phí Quản Lý Công Ty (${forging.k_mgmt}%):`, value: `${(res.COGS * (forging.k_mgmt || 0) / 100).toLocaleString('vi-VN')} đ` },
          { label: `III. Phí Vận Chuyển (${(forging.DG_trans_kg || 0).toLocaleString('vi-VN')} đ/kg):`, value: `${((forging.DG_trans_kg || 0) * res.m_phoi).toLocaleString('vi-VN')} đ` },
          { label: 'IV. Phí Bao Gói:', value: `${(forging.C_pack || 0).toLocaleString('vi-VN')} đ` },
        ]}
        breakdownTotal={{ label: 'Tổng Giá Thành TRƯỚC Lợi Nhuận:', value: `${res.pre_profit_price.toLocaleString('vi-VN')} VNĐ` }}
        infoBoxes={[
          { label: `Lợi Nhuận Mục Tiêu (${forging.k_profit_forging}%)`, value: (res.P_FORGING - res.pre_profit_price).toLocaleString('vi-VN'), unit: 'VNĐ' },
        ]}
        footerTitle="ĐƠN GIÁ BÁO GIÁ CUỐI CÙNG (GIÁ BÁN)"
        footerSubtitle={`= Giá Thành Trước Lợi Nhuận × (1 + ${forging.k_profit_forging}%)`}
        footerTotal={res.P_FORGING.toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
        isFinalTotal={true}
      />
    </div>
  );
};
