import { isSteelCategory } from '../../utils/material-categories';
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
  const materials = useQuotationStore((state) => state.materials);
  const systemRates = useQuotationStore((state) => state.systemRates);
  const isFetchingMasterData = useQuotationStore((state) => state.isFetchingMasterData);

  const activeMaterials = materials.length > 0 ? materials : INITIAL_MATERIALS;
  const steelMaterials = activeMaterials.filter(
    (m) => isSteelCategory(m.category)
  );

  const res = getForgingResult();

  // Variables for Section 2 (Operations breakdown)
  const C_cut = ((forging.t_cut_sec || 0) / 3600) * (forging.DG_sawing_machine_hour || 0);
  const C_heat_induction = forging.m_chi * (forging.w_elec_kwh_per_kg || 0) * (forging.DG_elec_kwh || 0);
  const safeProductivity = (forging.expected_productivity && forging.expected_productivity > 0) ? forging.expected_productivity : 1;
  const C_forging_op = (8 * (forging.DG_forging_machine_hour || 0)) / safeProductivity;
  const C_clean = forging.m_chi * (forging.DG_clean_kg || 0);

  const refWeight = forging.d_cut && forging.l_cut 
    ? (Math.PI * Math.pow(forging.d_cut / 2, 2) * forging.l_cut * 0.00000785)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-4 h-4 text-[#111111] stroke-[2]" />}
        title="SECTION 1: VẬT LIỆU THÉP PHÔI RÈN"
        mainBlockTitle="Nhập Liệu Vật Tư"
        mainLeftContent={
          <div className="space-y-3 text-xs">
            {/* 1. Mác Thép */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">1. Mác Thép (Từ Master Data):</label>
              <select
                value={forging.selected_material_id || ''}
                onChange={(e) => selectMaterial(e.target.value)}
                disabled={isFetchingMasterData}
                className="w-48 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingMasterData ? (
                  <option>Đang tải dữ liệu vật tư...</option>
                ) : (
                  steelMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.notes ? ` — ${m.notes}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 2. Giá Thép */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">2. Giá Thép (VNĐ/kg):</label>
              <input
                type="number"
                value={forging.DG_steel}
                readOnly
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-gray-500 bg-gray-100 text-right cursor-not-allowed"
                title="Tự động cập nhật theo Mác Thép"
              />
            </div>

            {/* 3. Phí Quản Lý Vật Tư */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">3. Phí quản lý vật tư (%):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={forging.k_mgmt_mat || 0}
                onChange={(e) => setForgingField('k_mgmt_mat', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 4. Đường kính */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">4. Đường kính thép (d - mm):</label>
              <input
                type="number"
                min="0"
                value={forging.d_cut || ''}
                onChange={(e) => setForgingField('d_cut', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 5. Chiều dài */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">5. Chiều dài cắt (L - mm):</label>
              <input
                type="number"
                min="0"
                value={forging.l_cut || ''}
                onChange={(e) => setForgingField('l_cut', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 6. TL chi */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">6. Trọng lượng chi (m_chi - kg):</label>
                {refWeight > 0 && forging.m_chi < refWeight && (
                  <span className="text-[10px] text-red-500 font-normal">⚠️ Nhỏ hơn TL tham khảo ({refWeight.toFixed(3)}kg)</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={forging.m_chi}
                onChange={(e) => setForgingField('m_chi', Math.max(0, Number(e.target.value)))}
                className={`w-20 px-2 py-1 border rounded-[4px] font-mono text-xs font-bold text-right ${refWeight > 0 && forging.m_chi < refWeight ? 'border-red-500 bg-red-50 text-red-700' : 'border-blue-400 bg-blue-50/30 text-[#111111]'}`}
              />
            </div>

            {/* 7. TL phôi */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">7. Trọng lượng phôi rèn (m_phoi - kg):</label>
                {forging.m_chi > 0 && forging.m_phoi > forging.m_chi && (
                  <span className="text-[10px] text-red-500 font-normal">⚠️ Phôi không được lớn hơn TL Chi ({forging.m_chi}kg)</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={forging.m_phoi}
                onChange={(e) => setForgingField('m_phoi', Math.max(0, Number(e.target.value)))}
                className={`w-20 px-2 py-1 border rounded-[4px] font-mono text-xs font-bold text-right ${forging.m_chi > 0 && forging.m_phoi > forging.m_chi ? 'border-red-500 bg-red-50 text-red-700' : 'border-[#EAEAEA] bg-white text-[#111111]'}`}
              />
            </div>

            {/* 8. TL tinh + Checkbox */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">8. TL tinh sau gia công (kg):</label>
                  {forging.m_phoi > 0 && (forging.m_tinh || 0) > forging.m_phoi && (
                    <span className="text-[10px] text-red-500 font-normal">⚠️ Tinh không được lớn hơn TL Phôi ({forging.m_phoi}kg)</span>
                  )}
                </div>
                <div className="flex items-center space-x-1 border border-[#EAEAEA] px-1.5 py-0.5 rounded bg-[#F9F9F9] hover:bg-[#F0F0EE] transition-colors cursor-pointer" onClick={() => setForgingField('use_m_tinh', !forging.use_m_tinh)}>
                  <input
                    type="checkbox"
                    id="use_m_tinh"
                    checked={forging.use_m_tinh || false}
                    onChange={(e) => setForgingField('use_m_tinh', e.target.checked)}
                    className="w-3 h-3 cursor-pointer accent-[#111111]"
                  />
                  <label htmlFor="use_m_tinh" className="text-[10px] text-slate-500 cursor-pointer select-none font-medium">Tính theo TL tinh</label>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={forging.m_tinh || ''}
                onChange={(e) => setForgingField('m_tinh', Math.max(0, Number(e.target.value)))}
                className={`w-20 px-2 py-1 border rounded-[4px] font-mono text-xs font-bold text-right ${forging.m_phoi > 0 && (forging.m_tinh || 0) > forging.m_phoi ? 'border-red-500 bg-red-50 text-red-700' : forging.use_m_tinh ? 'border-[#111111] bg-white text-[#111111]' : 'border-[#EAEAEA] bg-gray-50 text-gray-500'}`}
              />
            </div>

            {/* 9. % Cháy hao */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">9. % Cháy hao (k_loss):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={forging.k_loss}
                onChange={(e) => setForgingField('k_loss', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 10. Đơn giá thu hồi ba-via rèn */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">10. Đơn giá thu hồi ba-via rèn (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_scrap ?? ''}
                onChange={(e) => setForgingField('DG_scrap', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 11. Đơn giá thu hồi phoi CNC (chỉ hiển thị khi tính theo TL tinh) */}
            {forging.use_m_tinh && (forging.m_tinh || 0) > 0 && (
              <div className="flex items-center justify-between gap-1 bg-amber-50/50 p-2 rounded">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">11. Đơn giá thu hồi phoi CNC (VNĐ/kg):</label>
                  {res.m_bavia_cnc && res.m_bavia_cnc > 0 && !forging.DG_scrap_cnc && (
                    <span className="text-[10px] text-amber-700 font-medium">⚠️ Vui lòng nhập đơn giá phoi CNC thu hồi</span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Nhập đơn giá"
                  value={forging.DG_scrap_cnc ?? ''}
                  onChange={(e) => setForgingField('DG_scrap_cnc', e.target.value ? Math.max(0, Number(e.target.value)) : undefined)}
                  className={`w-24 px-2 py-1 border rounded-[4px] font-mono text-xs font-bold text-right ${res.m_bavia_cnc && res.m_bavia_cnc > 0 && !forging.DG_scrap_cnc ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-[#EAEAEA] bg-white text-[#111111]'}`}
                />
              </div>
            )}
          </div>
        }
        mainRightContent={
          <div className="space-y-1.5 text-xs font-mono">
            {/* 1. Trọng lượng đoạn cắt lý thuyết */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">1. Trọng lượng cắt lý thuyết:</div>
                <div className="text-[9px] font-mono text-[#787774]">W = π×(d/2)²×L×7.85/10⁶</div>
              </div>
              <div className="font-bold text-[#111111]">{refWeight > 0 ? refWeight.toFixed(3) : '---'} kg</div>
            </div>
            
            {/* 2. Trọng lượng ba via */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">2. Trọng lượng ba via:</div>
                <div className="text-[9px] font-mono text-[#787774]">m_bavia = (m_chi - {forging.use_m_tinh ? 'm_tinh' : 'm_phoi'}) × (1 - k_loss%)</div>
              </div>
              <div className="font-bold text-[#38517A]">{res.m_bavia.toFixed(3)} kg</div>
            </div>

            {/* 3. Chi phí thép đầu vào */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">3. Chi phí thép đầu vào:</div>
                <div className="text-[9px] font-mono text-[#787774]">m_chi × DG_steel × (1 + Phí QL%)</div>
              </div>
              <div className="font-bold text-[#111111]">{(forging.m_chi * forging.DG_steel * (1 + (forging.k_mgmt_mat || 0) / 100)).toLocaleString('vi-VN')} VNĐ</div>
            </div>

            {/* 4. Chi phí ba via thu hồi */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">4. Chi phí ba via thu hồi:</div>
                <div className="text-[9px] font-mono text-[#787774]">m_bavia × DG_scrap</div>
              </div>
              <div className="font-bold text-[#00A651]">-{ (res.m_bavia * forging.DG_scrap).toLocaleString('vi-VN') } VNĐ</div>
            </div>

            {/* 5. Chi phí vật tư trong báo giá */}
            <div className="flex justify-between items-center py-0.5">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">5. Chi phí vật tư báo giá:</div>
                <div className="text-[9px] font-mono text-[#787774]">Chi phí thép - Chi phí thu hồi</div>
              </div>
              <div className="font-bold text-[#111111]">{res.C_mat_forging.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>
        }
        footerTitle="TỔNG CHI PHÍ VẬT TƯ THÉP RÈN (PHẦN A)"
        footerTotal={Math.round(res.C_mat_forging).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ / CHI TIẾT"
        isFinalTotal={true}
      />


      {/* 2. Section Công Nghệ & Hệ Máy Rèn */}
      <CostSectionCard
        icon={<Layers className="w-4 h-4 text-[#111111] stroke-[2]" />}
        title="SECTION 2: CÔNG NGHỆ RÈN & HỆ THIẾT BỊ"
        mainBlockTitle="Nhập Liệu Công Nghệ"
        mainLeftContent={
          <div className="space-y-3 text-xs">
            {/* 1. Máy cắt/cưa phôi */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">1. Máy cắt/cưa phôi:</label>
              <select
                value={forging.sawing_machine_type || 'band_saw'}
                onChange={(e) => selectSawingMachineType(e.target.value as 'band_saw' | 'punch_cut')}
                className="w-36 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs text-right"
              >
                <option value="band_saw">Máy cưa vòng</option>
                <option value="punch_cut">Máy cắt đột</option>
              </select>
            </div>

            {/* 2. Thời gian cắt phôi */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">2. Thời gian cắt phôi (giây):</label>
              <input
                type="number"
                min="0"
                value={forging.t_cut_sec ?? ''}
                onChange={(e) => setForgingField('t_cut_sec', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 3. Dây chuyền rèn */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">3. Dây chuyền rèn:</label>
              <select
                value={forging.forging_line || '1000T'}
                onChange={(e) => selectForgingLine(e.target.value as any)}
                className="w-36 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs text-right"
              >
                <option value="1000T">Máy dập 1000T</option>
                <option value="1600T">Máy dập 1600T</option>
                <option value="63kJ">Máy búa 63 kJ</option>
                <option value="80kJ">Máy búa 80 kJ</option>
              </select>
            </div>

            {/* 4. Năng suất dự kiến */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">4. Năng suất dự kiến (Cái/ca):</label>
              <input
                type="number"
                min="0"
                value={forging.expected_productivity ?? ''}
                onChange={(e) => setForgingField('expected_productivity', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>

            {/* 5. Đơn giá phun bi */}
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">5. Đơn giá phun bi (VNĐ/kg):</label>
              <input
                type="number"
                min="0"
                value={forging.DG_clean_kg ?? ''}
                onChange={(e) => setForgingField('DG_clean_kg', Math.max(0, Number(e.target.value)))}
                className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
              />
            </div>
          </div>
        }
        mainRightContent={
          <div className="space-y-1.5 text-xs font-mono">
            {/* 1. Chi phí cưa phôi */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">1. Chi phí cưa phôi:</div>
                <div className="text-[9px] font-mono text-[#787774]">(t_cut / 3600) × DG_may_cua</div>
              </div>
              <div className="font-bold text-[#111111]">{Math.round(C_cut).toLocaleString('vi-VN')} VNĐ</div>
            </div>
            
            {/* 2. Chi phí nung phôi */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">2. Chi phí nung phôi:</div>
                <div className="text-[9px] font-mono text-[#787774]">m_chi × {forging.w_elec_kwh_per_kg} kWh/kg × DG_dien</div>
              </div>
              <div className="font-bold text-[#111111]">{Math.round(C_heat_induction).toLocaleString('vi-VN')} VNĐ</div>
            </div>

            {/* 3. Chi phí rèn phôi */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">3. Chi phí rèn phôi:</div>
                <div className="text-[9px] font-mono text-[#787774]">(8×60 / NăngSuất) × DG_may_ren/phút</div>
              </div>
              <div className="font-bold text-[#111111]">{Math.round(C_forging_op).toLocaleString('vi-VN')} VNĐ</div>
            </div>

            {/* 4. Chi phí phun bi */}
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">4. Chi phí phun bi:</div>
                <div className="text-[9px] font-mono text-[#787774]">m_chi × DG_phun_bi</div>
              </div>
              <div className="font-bold text-[#111111]">{Math.round(C_clean).toLocaleString('vi-VN')} VNĐ</div>
            </div>

            {/* 5. Tổng chi phí rèn */}
            <div className="flex justify-between items-center py-0.5">
              <div>
                <div className="text-[11px] font-bold text-[#111111] font-sans">5. Tổng chi phí rèn & XLB:</div>
                <div className="text-[9px] font-mono text-[#787774]">Tổng các công đoạn rèn</div>
              </div>
              <div className="font-bold text-[#111111]">{res.C_ops_forging.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>
        }
        footerTitle="TỔNG CHI PHÍ CÔNG NGHỆ RÈN (PHẦN B)"
        footerTotal={Math.round(res.C_ops_forging).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ / CHI TIẾT"
        isFinalTotal={true}
      />

      {/* 3. Section Gia Công Cơ Khí Động (CNC Ops) */}
      <MachiningOpsList
        operations={forging.machining_operations || []}
        totalMachiningCost={res.C_machining}
        machiningNotes={forging.machining_notes}
        systemRates={systemRates}
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
        amortizationCostPerUnit={res.C_die_amortization}
      />

      {/* 5. Section 5: Tổng Hợp Chi Phí (Summary) */}
      <Section5SummaryCard
        isForging={true}
        k_mgmt={forging.k_mgmt}
        onKMgmtChange={(val) => setForgingField('k_mgmt', val)}
        DG_trans_kg={forging.DG_trans_kg}
        onDGTransChange={(val) => setForgingField('DG_trans_kg', val)}
        DG_pack_kg={forging.DG_pack_kg || 0}
        onDGPackChange={(val) => setForgingField('DG_pack_kg', val)}
        k_profit={forging.k_profit_forging}
        onKProfitChange={(val) => setForgingField('k_profit_forging', val)}
        quoted_moq={forging.quoted_moq}
        onMoqChange={(val) => setForgingField('quoted_moq', val)}
        DG_heat_treat_per_kg={forging.DG_heat_treat_per_kg}
        onDGHeatTreatChange={(val) => setForgingField('DG_heat_treat_per_kg', val)}
        DG_paint_per_kg={forging.DG_paint_per_kg}
        onDGPaintChange={(val) => setForgingField('DG_paint_per_kg', val)}
        COGS={res.COGS}
        C_mgmt={res.C_mgmt}
        C_trans={res.C_trans}
        C_pack={res.C_pack}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.C_profit}
        final_price={res.P_FORGING}
      />
    </div>
  );
};
