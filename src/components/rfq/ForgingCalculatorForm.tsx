import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { ToolingOpsList } from './ToolingOpsList';
import { ToolingAmortizationSection } from './ToolingAmortizationSection';
import { Section5SummaryCard } from './Section5SummaryCard';
import {
  INITIAL_MATERIALS,
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
  const selectSawingMachineType = useQuotationStore((state) => state.selectSawingMachineType);
  const selectForgingLine = useQuotationStore((state) => state.selectForgingLine);
  const getForgingResult = useQuotationStore((state) => state.getForgingResult);

  const steelMaterials = INITIAL_MATERIALS.filter(
    (m) => m.category === 'Thép cán - Rèn'
  );

  const res = getForgingResult();

  // Variables for Section 2 (Operations breakdown)
  const C_cut = ((forging.t_cut_sec || 0) / 3600) * (forging.DG_sawing_machine_hour || 0);
  const C_heat_induction = forging.m_chi * (forging.w_elec_kwh_per_kg || 0) * (forging.DG_elec_kwh || 0);
  const safeProductivity = (forging.expected_productivity && forging.expected_productivity > 0) ? forging.expected_productivity : 1;
  const C_forging_op = (8 * (forging.DG_forging_machine_hour || 0)) / safeProductivity;
  const C_heat_treat = forging.m_chi * (forging.DG_heat_treat_kg || 0);
  const C_clean = forging.m_chi * (forging.DG_clean_kg || 0);

  const refWeight = forging.d_cut && forging.l_cut 
    ? (Math.PI * Math.pow(forging.d_cut / 2, 2) * forging.l_cut * 0.00000785)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-5 h-5" />}
        title="SECTION 1: VẬT LIỆU THÉP PHÔI RÈN"
        mainBlockTitle="Nhập Liệu Vật Tư"
        mainLeftContent={
          <div className="space-y-0 text-[13px]">
            {/* Row 1: Mác Thép */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">1. Mác Thép (Từ Master Data):</label>
              <select
                value={forging.selected_material_id}
                onChange={(e) => selectMaterial(e.target.value)}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-right"
              >
                {steelMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Giá Thép */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">2. Giá Thép (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_steel}
                onChange={(e) => setForgingField('DG_steel', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 3: Phí Quản Lý Vật Tư */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">3. Phí quản lý vật tư (%):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={forging.k_mgmt_mat || 0}
                onChange={(e) => setForgingField('k_mgmt_mat', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 4: Đường kính */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">4. Đường kính thép (d - mm):</label>
              <input
                type="number"
                min="0"
                value={forging.d_cut || ''}
                onChange={(e) => setForgingField('d_cut', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 5: Chiều dài */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">5. Chiều dài cắt (L - mm):</label>
              <input
                type="number"
                min="0"
                value={forging.l_cut || ''}
                onChange={(e) => setForgingField('l_cut', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 6: TL chi */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774] flex flex-col">
                <span>6. Trọng lượng chi (m_chi - kg):</span>
                {refWeight > 0 && forging.m_chi < refWeight && (
                  <span className="text-[10px] text-red-500 font-normal">⚠️ Nhỏ hơn TL lý thuyết ({refWeight.toFixed(3)}kg)</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={forging.m_chi}
                onChange={(e) => setForgingField('m_chi', Math.max(0, Number(e.target.value)))}
                className={`w-1/2 min-w-[200px] px-2 py-1.5 border rounded-[4px] font-mono font-bold text-right ${refWeight > 0 && forging.m_chi < refWeight ? 'border-red-500 bg-red-50 text-red-700' : 'border-blue-400 bg-blue-50/30 text-[#111111]'}`}
              />
            </div>

            {/* Row 7: TL phôi */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">7. Trọng lượng phôi rèn (m_phoi - kg):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={forging.m_phoi}
                onChange={(e) => setForgingField('m_phoi', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 8: TL tinh + Checkbox */}
            <div className="flex flex-col py-2 border-b border-[#EAEAEA]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 w-1/2">
                  <label className="font-bold text-[#787774]">8. TL tinh sau gia công (kg):</label>
                  <div className="flex items-center space-x-1 border border-[#EAEAEA] px-1.5 py-0.5 rounded bg-[#F9F9F9]">
                    <input
                      type="checkbox"
                      id="use_m_tinh"
                      checked={forging.use_m_tinh || false}
                      onChange={(e) => setForgingField('use_m_tinh', e.target.checked)}
                      className="w-3 h-3"
                    />
                    <label htmlFor="use_m_tinh" className="text-[10px] text-slate-500 cursor-pointer">Tính ba-via</label>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={forging.m_tinh || ''}
                  onChange={(e) => setForgingField('m_tinh', Math.max(0, Number(e.target.value)))}
                  disabled={!forging.use_m_tinh}
                  className={`w-1/2 min-w-[200px] px-2 py-1.5 border rounded-[4px] font-mono font-bold text-right ${forging.use_m_tinh ? 'border-blue-300 bg-blue-50/20 text-[#111111]' : 'border-[#EAEAEA] bg-gray-100 text-gray-400'}`}
                />
              </div>
            </div>

            {/* Row 9: % Cháy hao */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">9. % Cháy hao (k_loss):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={forging.k_loss}
                onChange={(e) => setForgingField('k_loss', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* Row 10: DG_scrap (Bổ sung để lấy dữ liệu tính toán hoàn chỉnh) */}
            <div className="flex items-center justify-between py-2">
              <label className="font-bold text-[#787774]">10. Giá phế liệu thu hồi (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_scrap}
                onChange={(e) => setForgingField('DG_scrap', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>
          </div>
        }
        mainRightContent={
          <div className="space-y-4 mb-4">
            <div className="bg-[#F0F0EE] p-5 rounded-[4px] border border-slate-300 space-y-3 font-mono text-[13px] h-full flex flex-col justify-center">
              {/* 1. Trọng lượng đoạn cắt lý thuyết */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">1. Trọng lượng cắt lý thuyết:</span>
                  <span className="text-[10px] text-slate-500 font-mono">W = π×(d/2)²×L×7.85/10⁶</span>
                </div>
                <span className="font-bold text-[#111111]">{refWeight > 0 ? refWeight.toFixed(3) : '---'} kg</span>
              </div>
              
              {/* 2. Trọng lượng ba via */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">2. Trọng lượng ba via:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_bavia = (m_chi - {forging.use_m_tinh ? 'm_tinh' : 'm_phoi'}) × (1 - k_loss%)</span>
                </div>
                <span className="font-bold text-[#38517A] text-[15px]">{res.m_bavia.toFixed(3)} kg</span>
              </div>

              {/* 3. Chi phí thép đầu vào */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">3. Chi phí thép đầu vào:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_chi × DG_steel × (1 + Phí QL%)</span>
                </div>
                <span className="font-bold text-[#111111]">{(forging.m_chi * forging.DG_steel * (1 + (forging.k_mgmt_mat || 0) / 100)).toLocaleString('vi-VN')} đ</span>
              </div>

              {/* 4. Chi phí ba via thu hồi */}
              <div className="flex justify-between border-b border-slate-400 pb-3 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">4. Chi phí ba via thu hồi:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_bavia × DG_scrap</span>
                </div>
                <span className="font-bold text-[#10B981]">-{ (res.m_bavia * forging.DG_scrap).toLocaleString('vi-VN') } đ</span>
              </div>

              {/* 5. Chi phí vật tư trong báo giá */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 font-sans text-[14px] uppercase tracking-tight">5. Chi phí vật tư báo giá:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Chi phí thép - Chi phí thu hồi</span>
                </div>
                <span className="font-extrabold text-[#111111] text-[24px] leading-none">{res.C_mat_forging.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        }
      />


      {/* 2. Section Công Nghệ & Hệ Máy Rèn */}
      <CostSectionCard
        icon={<Layers className="w-5 h-5" />}
        title="SECTION 2: CÔNG NGHỆ RÈN & HỆ THIẾT BỊ"
        mainBlockTitle="Nhập Liệu Công Nghệ"
        mainLeftContent={
          <div className="space-y-0 text-[13px]">
            {/* 1. Máy cắt/cưa phôi */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">1. Máy cắt/cưa phôi:</label>
              <select
                value={forging.sawing_machine_type || 'band_saw'}
                onChange={(e) => selectSawingMachineType(e.target.value as 'band_saw' | 'punch_cut')}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-right"
              >
                <option value="band_saw">Máy cưa vòng</option>
                <option value="punch_cut">Máy cắt đột</option>
              </select>
            </div>

            {/* 2. Thời gian cắt phôi */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">2. Thời gian cắt phôi (giây):</label>
              <input
                type="number"
                min="0"
                value={forging.t_cut_sec ?? ''}
                onChange={(e) => setForgingField('t_cut_sec', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* 3. Dây chuyền rèn */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">3. Dây chuyền rèn:</label>
              <select
                value={forging.forging_line || '1000T'}
                onChange={(e) => selectForgingLine(e.target.value as any)}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-right"
              >
                <option value="1000T">Máy dập 1000T</option>
                <option value="1600T">Máy dập 1600T</option>
                <option value="63kJ">Máy búa 63 kJ</option>
                <option value="80kJ">Máy búa 80 kJ</option>
              </select>
            </div>

            {/* 4. Năng suất dự kiến */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">4. Năng suất dự kiến (Cái/ca):</label>
              <input
                type="number"
                min="0"
                value={forging.expected_productivity ?? ''}
                onChange={(e) => setForgingField('expected_productivity', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* 5. Đơn giá nhiệt luyện */}
            <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
              <label className="font-bold text-[#787774]">5. Đơn giá nhiệt luyện (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_heat_treat_kg ?? ''}
                onChange={(e) => setForgingField('DG_heat_treat_kg', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>

            {/* 6. Đơn giá phun bi */}
            <div className="flex items-center justify-between py-2">
              <label className="font-bold text-[#787774]">6. Đơn giá phun bi (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_clean_kg ?? ''}
                onChange={(e) => setForgingField('DG_clean_kg', Math.max(0, Number(e.target.value)))}
                className="w-1/2 min-w-[200px] px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
              />
            </div>
          </div>
        }
        mainRightContent={
          <div className="space-y-4 mb-4">
            <div className="bg-[#F0F0EE] p-5 rounded-[4px] border border-slate-300 space-y-3 font-mono text-[13px] h-full flex flex-col justify-center">
              {/* 1. Chi phí cưa phôi */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">1. Chi phí cưa phôi:</span>
                  <span className="text-[10px] text-slate-500 font-mono">(t_cut / 3600) × DG_may_cua</span>
                </div>
                <span className="font-bold text-[#111111]">{Math.round(C_cut).toLocaleString('vi-VN')} đ</span>
              </div>
              
              {/* 2. Chi phí nung phôi */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">2. Chi phí nung phôi:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_chi × {forging.w_elec_kwh_per_kg} kWh/kg × DG_dien</span>
                </div>
                <span className="font-bold text-[#111111]">{Math.round(C_heat_induction).toLocaleString('vi-VN')} đ</span>
              </div>

              {/* 3. Chi phí rèn phôi */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">3. Chi phí rèn phôi:</span>
                  <span className="text-[10px] text-slate-500 font-mono">(8×60 / NangSuat) × DG_may_ren/phut</span>
                </div>
                <span className="font-bold text-[#111111]">{Math.round(C_forging_op).toLocaleString('vi-VN')} đ</span>
              </div>

              {/* 4. Chi phí nhiệt luyện */}
              <div className="flex justify-between border-b border-dashed border-slate-300 pb-2 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">4. Chi phí nhiệt luyện:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_chi × DG_nhiet_luyen</span>
                </div>
                <span className="font-bold text-[#111111]">{Math.round(C_heat_treat).toLocaleString('vi-VN')} đ</span>
              </div>

              {/* 5. Chi phí phun bi */}
              <div className="flex justify-between border-b border-slate-400 pb-3 items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 font-sans text-[12px]">5. Chi phí phun bi:</span>
                  <span className="text-[10px] text-slate-500 font-mono">m_chi × DG_phun_bi</span>
                </div>
                <span className="font-bold text-[#111111]">{Math.round(C_clean).toLocaleString('vi-VN')} đ</span>
              </div>

              {/* 6. Tổng chi phí rèn */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 font-sans text-[14px] uppercase tracking-tight">TỔNG CHI PHÍ RÈN & XLB:</span>
                </div>
                <span className="font-extrabold text-[#111111] text-[24px] leading-none">{res.C_ops_forging.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        }
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
