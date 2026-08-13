import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { Section5SummaryCard } from './Section5SummaryCard';
import { INITIAL_MATERIALS } from '../../lib/master-data-service';
import { Workflow } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export default function SawingCalculatorForm() {
  const sawing = useQuotationStore((state) => state.sawingInput);
  const setSawingField = useQuotationStore((state) => state.setSawingField);
  const selectSawingMaterial = useQuotationStore((state) => state.selectSawingMaterial);
  
  const addOp = useQuotationStore((state) => state.addSawingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateSawingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeSawingMachiningOp);
  const getSawingResult = useQuotationStore((state) => state.getSawingResult);
  const materials = useQuotationStore((state) => state.materials);
  const isFetchingMasterData = useQuotationStore((state) => state.isFetchingMasterData);

  const activeMaterials = materials.length > 0 ? materials : INITIAL_MATERIALS;
  const steelMaterials = activeMaterials.filter(
    (m) => m.category === 'Thép cán - Rèn'
  );

  const res = getSawingResult();

  // Theoretical weight calculation reference
  const refWeight = sawing.d_cut && sawing.l_cut 
    ? (Math.PI * Math.pow(sawing.d_cut / 2, 2) * sawing.l_cut * 0.00000785)
    : 0;

  // Breakdown values
  const effectiveSteelPrice = (sawing.DG_steel || 0) * (1 + (sawing.k_mgmt_mat || 0) / 100);
  const costSteelInput = (sawing.m_chi || 0) * effectiveSteelPrice;

  let m_bavia_forging = (sawing.m_chi - sawing.m_phoi) * (1 - (sawing.k_loss || 0) / 100);
  let m_bavia_cnc = 0;
  if (sawing.use_m_tinh && sawing.m_tinh !== undefined) {
    m_bavia_cnc = Math.max(0, sawing.m_phoi - sawing.m_tinh);
  }
  const costScrapRecycle = (m_bavia_forging * (sawing.DG_scrap || 0)) + (m_bavia_cnc * (sawing.DG_scrap_cnc ?? sawing.DG_scrap ?? 0));

  const section1Left = (
    <div className="space-y-0 text-xs">
      {/* 1. Mác Thép */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">1. Mác Thép (Từ Master Data):</label>
        <select
          value={sawing.selected_material_id || ''}
          onChange={(e) => selectSawingMaterial(e.target.value)}
          disabled={isFetchingMasterData}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingMasterData ? (
            <option>Đang tải dữ liệu vật tư...</option>
          ) : (
            steelMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 2. Giá Thép */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA] bg-[#FBFBFA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">2. Giá Thép (VNĐ/kg):</label>
        <input
          type="number"
          value={sawing.DG_steel}
          readOnly
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#787774] bg-[#F0F0EE] text-right cursor-not-allowed"
          title="Tự động cập nhật theo Mác Thép"
        />
      </div>

      {/* 3. Phí Quản Lý Vật Tư */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">3. Phí quản lý vật tư (%):</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={sawing.k_mgmt_mat || 0}
          onChange={(e) => setSawingField('k_mgmt_mat', Math.max(0, Number(e.target.value)))}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
        />
      </div>

      {/* 4. Đường kính */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">4. Đường kính thép (d - mm):</label>
        <input
          type="number"
          min="0"
          value={sawing.d_cut || ''}
          onChange={(e) => setSawingField('d_cut', Math.max(0, Number(e.target.value)))}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
        />
      </div>

      {/* 5. Chiều dài */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">5. Chiều dài cắt (L - mm):</label>
        <input
          type="number"
          min="0"
          value={sawing.l_cut || ''}
          onChange={(e) => setSawingField('l_cut', Math.max(0, Number(e.target.value)))}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
        />
      </div>

      {/* 6. TL chi */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">6. Trọng lượng chi (m_chi - kg):</label>
          {refWeight > 0 && sawing.m_chi < refWeight && (
            <span className="text-[10px] text-red-500 font-normal">⚠️ Nhỏ hơn TL tham khảo ({refWeight.toFixed(3)}kg)</span>
          )}
        </div>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={sawing.m_chi}
          onChange={(e) => setSawingField('m_chi', Math.max(0, Number(e.target.value)))}
          className={`w-1/2 min-w-[200px] px-2.5 py-1.5 border rounded-[4px] font-mono font-bold text-right ${refWeight > 0 && sawing.m_chi < refWeight ? 'border-red-500 bg-red-50 text-red-700' : 'border-[#EAEAEA] bg-white text-[#111111]'}`}
        />
      </div>

      {/* 7. TL phôi */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">7. Trọng lượng phôi cắt (m_phoi - kg):</label>
          {sawing.m_chi > 0 && sawing.m_phoi > sawing.m_chi && (
            <span className="text-[10px] text-red-500 font-normal">⚠️ Phôi không được lớn hơn TL Chi ({sawing.m_chi}kg)</span>
          )}
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={sawing.m_phoi}
          onChange={(e) => setSawingField('m_phoi', Math.max(0, Number(e.target.value)))}
          className={`w-1/2 min-w-[200px] px-2.5 py-1.5 border rounded-[4px] font-mono font-bold text-right ${sawing.m_chi > 0 && sawing.m_phoi > sawing.m_chi ? 'border-red-500 bg-red-50 text-red-700' : 'border-[#EAEAEA] bg-white text-[#111111]'}`}
        />
      </div>

      {/* 8. TL tinh + Checkbox */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">8. TL tinh sau gia công (kg):</label>
            {sawing.m_phoi > 0 && (sawing.m_tinh || 0) > sawing.m_phoi && (
              <span className="text-[10px] text-red-500 font-normal">⚠️ Tinh không được lớn hơn TL Phôi ({sawing.m_phoi}kg)</span>
            )}
          </div>
          <div className="flex items-center space-x-1 border border-[#EAEAEA] px-1.5 py-0.5 rounded bg-[#FBFBFA] hover:bg-[#F0F0EE] transition-colors cursor-pointer" onClick={() => setSawingField('use_m_tinh', !sawing.use_m_tinh)}>
            <input
              type="checkbox"
              id="use_m_tinh_sawing"
              checked={sawing.use_m_tinh || false}
              onChange={(e) => setSawingField('use_m_tinh', e.target.checked)}
              className="w-3 h-3 cursor-pointer accent-[#111111]"
            />
            <label htmlFor="use_m_tinh_sawing" className="text-[10px] text-[#787774] cursor-pointer select-none font-medium">Tính theo TL tinh</label>
          </div>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={sawing.m_tinh || ''}
          onChange={(e) => setSawingField('m_tinh', Math.max(0, Number(e.target.value)))}
          className={`w-1/2 min-w-[200px] px-2.5 py-1.5 border rounded-[4px] font-mono font-bold text-right ${sawing.m_phoi > 0 && (sawing.m_tinh || 0) > sawing.m_phoi ? 'border-red-500 bg-red-50 text-red-700' : sawing.use_m_tinh ? 'border-[#111111] bg-white text-[#111111]' : 'border-[#EAEAEA] bg-[#F0F0EE] text-[#787774]'}`}
        />
      </div>

      {/* 9. % Cháy hao */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">9. % Cháy hao (k_loss):</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={sawing.k_loss}
          onChange={(e) => setSawingField('k_loss', Math.max(0, Number(e.target.value)))}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
        />
      </div>

      {/* 10. Đơn giá thu hồi ba-via phoi cưa */}
      <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA]">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">10. Đơn giá thu hồi phoi cưa (VNĐ/kg):</label>
        <input
          type="number"
          min="0"
          value={sawing.DG_scrap}
          onChange={(e) => setSawingField('DG_scrap', Math.max(0, Number(e.target.value)))}
          className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-[#111111] text-right"
        />
      </div>

      {/* 11. Đơn giá thu hồi phoi CNC (Nếu chọn TL tinh) */}
      {sawing.use_m_tinh && (
        <div className="flex items-center justify-between py-2 border-b border-[#EAEAEA] bg-amber-50/40">
          <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">11. Đơn giá thu hồi phoi CNC (VNĐ/kg):</label>
          <input
            type="number"
            min="0"
            placeholder="Mặc định = ĐG phoi cưa"
            value={sawing.DG_scrap_cnc ?? ''}
            onChange={(e) => setSawingField('DG_scrap_cnc', e.target.value ? Math.max(0, Number(e.target.value)) : undefined)}
            className="w-1/2 min-w-[200px] px-2.5 py-1.5 border border-amber-300 rounded-[4px] font-mono font-bold text-amber-950 bg-white text-right"
          />
        </div>
      )}
    </div>
  );

  const section1Right = (
    <div className="space-y-3.5 text-xs font-mono">
      <div className="border-b border-[#EAEAEA] pb-2.5">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#111111] font-sans">1. Trọng lượng cắt lý thuyết:</span>
          <span className="font-bold text-[#111111]">
            {refWeight > 0 ? `${refWeight.toFixed(3)} kg` : '--- kg'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#787774] mt-0.5">
          W = π×(d/2)²×L×7.85/10⁶
        </div>
      </div>

      <div className="border-b border-[#EAEAEA] pb-2.5">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#111111] font-sans">2. Trọng lượng phoi / ba vây:</span>
          <span className="font-bold text-[#111111]">{res.m_bavia.toFixed(3)} kg</span>
        </div>
        <div className="text-[10px] font-mono text-[#787774] mt-0.5">
          m_bavia = (m_chi - m_phoi) × (1 - k_loss%) {sawing.use_m_tinh ? '+ (m_phoi - m_tinh)' : ''}
        </div>
      </div>

      <div className="border-b border-[#EAEAEA] pb-2.5">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#111111] font-sans">3. Chi phí thép đầu vào:</span>
          <span className="font-bold text-[#111111]">{Math.round(costSteelInput).toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div className="text-[10px] font-mono text-[#787774] mt-0.5">
          m_chi × DG_steel × (1 + Phí QL%)
        </div>
      </div>

      <div className="border-b border-[#EAEAEA] pb-2.5">
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#111111] font-sans">4. Chi phí phoi thu hồi (-):</span>
          <span className="font-bold text-[#346538]">- {Math.round(costScrapRecycle).toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div className="text-[10px] font-mono text-[#787774] mt-0.5">
          m_bavia × DG_scrap
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-5 h-5 text-[#111111]" />}
        title="SECTION 1: VẬT LIỆU THÉP"
        mainBlockTitle="Nhập Liệu Vật Tư"
        mainLeftContent={section1Left}
        mainRightContent={section1Right}
        footerTitle="CHI PHÍ VẬT TƯ BÁO GIÁ"
        footerSubtitle="Chi phí thép - Chi phí thu hồi"
        footerTotal={Math.round(res.C_mat_sawing).toLocaleString('vi-VN')}
        footerTotalUnit="VNĐ/SP"
      />

      {/* 2. Machining & Sawing Process */}
      <MachiningOpsList
        operations={sawing.machining_operations || []}
        totalMachiningCost={res.C_machining}
        machiningNotes={sawing.machining_notes}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
        onUpdateNotes={(notes) => setSawingField('machining_notes', notes)}
        sawingOpProps={{
          t_cut_sec: sawing.t_cut_sec || 0,
          DG_sawing_machine_hour: sawing.DG_sawing_machine_hour || 0,
          sawing_machine_type: sawing.sawing_machine_type || 'band_saw',
          onUpdateSawingOp: (t_cut_sec, DG_sawing_machine_hour, sawing_machine_type) => {
            setSawingField('t_cut_sec', t_cut_sec);
            setSawingField('DG_sawing_machine_hour', DG_sawing_machine_hour);
            if (sawing_machine_type) {
              setSawingField('sawing_machine_type', sawing_machine_type);
            }
          },
          C_ops_sawing: res.C_ops_sawing,
        }}
      />

      {/* 3. Summary */}
      <Section5SummaryCard
        isForging={false}
        k_mgmt={sawing.k_mgmt}
        onKMgmtChange={(val) => setSawingField('k_mgmt', val)}
        DG_trans_kg={sawing.DG_trans_kg}
        onDGTransChange={(val) => setSawingField('DG_trans_kg', val)}
        DG_pack_kg={sawing.DG_pack_kg || 0}
        onDGPackChange={(val) => setSawingField('DG_pack_kg', val)}
        k_profit={sawing.k_profit_sawing}
        onKProfitChange={(val) => setSawingField('k_profit_sawing', val)}
        quoted_moq={sawing.quoted_moq}
        onMoqChange={(val) => setSawingField('quoted_moq', val)}
        DG_heat_treat_per_kg={sawing.DG_heat_treat_per_kg}
        onDGHeatTreatChange={(val) => setSawingField('DG_heat_treat_per_kg', val)}
        DG_paint_per_kg={sawing.DG_paint_per_kg}
        onDGPaintChange={(val) => setSawingField('DG_paint_per_kg', val)}
        COGS={res.COGS}
        C_mgmt={res.C_mgmt}
        C_trans={res.C_trans}
        C_pack={res.C_pack}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.C_profit}
        final_price={res.P_SAWING}
      />
    </div>
  );
}

