import { useEffect } from 'react';
import { isSteelCategory } from '../../utils/material-categories';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { Section5SummaryCard } from './Section5SummaryCard';
import { INITIAL_MATERIALS } from '../../lib/master-data-service';
import { Workflow } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';
import { NumberTextInput } from '../../components/ui/NumberTextInput';
import { HighlightNumberInput } from '../../components/ui/HighlightNumberInput';


export default function SawingCalculatorForm() {
  const sawing = useQuotationStore((state) => state.sawingInput);
  const setSawingField = useQuotationStore((state) => state.setSawingField);
  const selectSawingMaterial = useQuotationStore((state) => state.selectSawingMaterial);
  
  const addOp = useQuotationStore((state) => state.addSawingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateSawingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeSawingMachiningOp);
  const getSawingResult = useQuotationStore((state) => state.getSawingResult);
  const materials = useQuotationStore((state) => state.materials);
  const systemRates = useQuotationStore((state) => state.systemRates);
  const isFetchingMasterData = useQuotationStore((state) => state.isFetchingMasterData);

  const activeMaterials = materials.length > 0 ? materials : INITIAL_MATERIALS;
  const steelMaterials = activeMaterials.filter(
    (m) => isSteelCategory(m.category)
  );

  useEffect(() => {
    if (activeMaterials.length > 0 && sawing.selected_material_id) {
      const mat = activeMaterials.find(m => m.id === sawing.selected_material_id);
      if (mat) {
        if (sawing.DG_steel !== mat.latest_price || sawing.DG_scrap !== mat.scrap_price) {
          setSawingField('DG_steel', mat.latest_price || 0);
          setSawingField('DG_scrap', mat.scrap_price || 0);
        }
      }
    }
  }, [sawing.selected_material_id, activeMaterials, setSawingField]);

  const res = getSawingResult();

  // Theoretical weight calculation reference
  const refWeight = sawing.d_cut && sawing.l_cut 
    ? (Math.PI * Math.pow(sawing.d_cut / 2, 2) * sawing.l_cut * 0.00000785)
    : 0;

  // Breakdown values
  const effectiveSteelPrice = (sawing.DG_steel || 0) * (1 + (sawing.k_mgmt_mat || 0) / 100);
  const costSteelInput = ((sawing.m_chi || 0) || 0) * effectiveSteelPrice;

  let m_bavia_forging = ((sawing.m_chi || 0) - (sawing.m_phoi || 0)) * (1 - (sawing.k_loss || 0) / 100);
  let m_bavia_cnc = 0;
  if (sawing.use_m_tinh && sawing.m_tinh !== undefined) {
    m_bavia_cnc = Math.max(0, (sawing.m_phoi || 0) - sawing.m_tinh);
  }
  const costScrapRecycle = (m_bavia_forging * (sawing.DG_scrap || 0)) + (m_bavia_cnc * (sawing.DG_scrap_cnc ?? sawing.DG_scrap ?? 0));

  const section1Left = (
    <div className="space-y-3 text-xs">
      {/* 1. MÃ¡c ThÃ©p */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">1. MÃ¡c ThÃ©p (Tá»« Master Data):</label>
        <select
          value={sawing.selected_material_id || ''}
          onChange={(e) => selectSawingMaterial(e.target.value)}
          disabled={isFetchingMasterData}
          className="w-48 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingMasterData ? (
            <option>Äang táº£i dá»¯ liá»‡u váº­t tÆ°...</option>
          ) : (
            steelMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.notes ? ` â€” ${m.notes}` : ''}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 2. GiÃ¡ ThÃ©p */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">2. GiÃ¡ ThÃ©p (VNÄ/kg):</label>
        <NumberTextInput
          value={sawing.DG_steel}
          readOnly
          className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-gray-500 bg-gray-100 text-right cursor-not-allowed"
          title="Tá»± Ä‘á»™ng cáº­p nháº­t theo MÃ¡c ThÃ©p"
        onChange={() => {}} />
      </div>

      {/* 3. PhÃ­ Quáº£n LÃ½ Váº­t TÆ° */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">3. PhÃ­ quáº£n lÃ½ váº­t tÆ° (%):</label>
        <HighlightNumberInput
          min="0"
          step="0.1"
          value={sawing.k_mgmt_mat}
          onChange={(e) => setSawingField('k_mgmt_mat', Math.max(0, e))}
        />
      </div>

      {/* 4. ÄÆ°á»ng kÃ­nh */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">4. ÄÆ°á»ng kÃ­nh thÃ©p (d - mm):<span className="text-amber-600 ml-0.5">*</span></label>
        <HighlightNumberInput
          min="0"
          value={sawing.d_cut}
          onChange={(e) => setSawingField('d_cut', Math.max(0, e))}
        />
      </div>

      {/* 5. Chiá»u dÃ i */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">5. Chiá»u dÃ i cáº¯t (L - mm):<span className="text-amber-600 ml-0.5">*</span></label>
        <HighlightNumberInput
          min="0"
          value={sawing.l_cut}
          onChange={(e) => setSawingField('l_cut', Math.max(0, e))}
        />
      </div>

      {/* 6. TL chi */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">6. Trá»ng lÆ°á»£ng chi (m_chi - kg):<span className="text-amber-600 ml-0.5">*</span></label>
          {refWeight > 0 && (sawing.m_chi || 0) < refWeight && (
            <span className="text-[10px] text-red-500 font-normal">âš ï¸ Nhá» hÆ¡n TL tham kháº£o ({refWeight.toFixed(3)}kg)</span>
          )}
        </div>
        <HighlightNumberInput
          min="0"
          step="0.0001"
          value={(sawing.m_chi || 0)}
          hasError={refWeight > 0 && (sawing.m_chi || 0) < refWeight}
          onChange={(e) => setSawingField('m_chi', Math.max(0, e))}
        />
      </div>

      {/* 7. TL phÃ´i */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">7. Trá»ng lÆ°á»£ng phÃ´i cáº¯t (m_phoi - kg):<span className="text-amber-600 ml-0.5">*</span></label>
          {(sawing.m_chi || 0) > 0 && (sawing.m_phoi || 0) > (sawing.m_chi || 0) && (
            <span className="text-[10px] text-red-500 font-normal">âš ï¸ PhÃ´i cáº¯t khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n TL Chi ({(sawing.m_chi || 0)}kg)</span>
          )}
        </div>
        <HighlightNumberInput
          min="0"
          step="0.01"
          value={(sawing.m_phoi || 0)}
          hasError={(sawing.m_chi || 0) > 0 && (sawing.m_phoi || 0) > (sawing.m_chi || 0)}
          onChange={(e) => setSawingField('m_phoi', Math.max(0, e))}
        />
      </div>

      {/* TL tinh toggle */}
      <div className="flex items-center justify-between gap-1 bg-[#FBFBFA] p-1.5 rounded-[4px] border border-[#EAEAEA]">
        <div className="flex flex-col">
          <label className="flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={sawing.use_m_tinh || false}
              onChange={(e) => setSawingField('use_m_tinh', e.target.checked)}
              className="rounded text-[#111111] focus:ring-[#111111] w-3 h-3 accent-[#111111]"
            />
            <span className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">8. TÃ­nh theo TL tinh:{sawing.use_m_tinh && <span className="text-amber-600 ml-0.5">*</span>}</span>
          </label>
          {(sawing.m_phoi || 0) > 0 && (sawing.m_tinh || 0) > (sawing.m_phoi || 0) && (
            <span className="text-[10px] text-red-500 font-normal">âš ï¸ Tinh khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n TL PhÃ´i ({(sawing.m_phoi || 0)}kg)</span>
          )}
        </div>
        <HighlightNumberInput
          min="0"
          step="0.01"
          value={sawing.m_tinh}
          disabled={!sawing.use_m_tinh}
          isRequired={sawing.use_m_tinh}
          hasError={(sawing.m_phoi || 0) > 0 && (sawing.m_tinh || 0) > (sawing.m_phoi || 0)}
          onChange={(e) => setSawingField('m_tinh', Math.max(0, e))}
          className={!sawing.use_m_tinh ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : ""}
        />
      </div>

      {/* 9. % ChÃ¡y hao */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">9. % ChÃ¡y hao (k_loss):</label>
        <NumberTextInput
          min="0"
          step="0.1"
          value={sawing.k_loss}
          onChange={(e) => setSawingField('k_loss', Math.max(0, e))}
          className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
        />
      </div>

      {/* 10. ÄÆ¡n giÃ¡ thu há»“i phoi cÆ°a */}
      <div className="flex items-center justify-between gap-1">
        <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">10. ÄÆ¡n giÃ¡ thu há»“i phoi cÆ°a (VNÄ/kg):</label>
        <NumberTextInput
          min="0"
          value={sawing.DG_scrap}
          onChange={(e) => setSawingField('DG_scrap', Math.max(0, e))}
          className="w-20 px-2 py-1 border border-[#EAEAEA] rounded-[4px] font-mono text-xs font-bold text-[#111111] text-right"
        />
      </div>

      {/* 11. ÄÆ¡n giÃ¡ thu há»“i phoi CNC (Náº¿u chá»n TL tinh) */}
      {sawing.use_m_tinh && (
        <div className="flex items-center justify-between gap-1 bg-amber-50/40 p-2 rounded">
          <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">11. ÄÆ¡n giÃ¡ thu há»“i phoi CNC (VNÄ/kg):</label>
          <NumberTextInput
            min="0"
            placeholder="Máº·c Ä‘á»‹nh = ÄG phoi cÆ°a"
            value={sawing.DG_scrap_cnc }
            onChange={(e) => setSawingField('DG_scrap_cnc', e ? Math.max(0, e) : undefined)}
            className="w-24 px-2 py-1 border border-amber-300 rounded-[4px] font-mono text-xs font-bold text-amber-950 bg-white text-right"
          />
        </div>
      )}
    </div>
  );

  const section1Right = (
    <div className="space-y-1.5 text-xs font-mono">
      <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">1. Trá»ng lÆ°á»£ng cáº¯t lÃ½ thuyáº¿t:</div>
          <div className="text-[9px] font-mono text-[#787774]">W = Ï€Ã—(d/2)Â²Ã—LÃ—7.85/10â¶</div>
        </div>
        <div className="font-bold text-[#111111]">
          {refWeight > 0 ? `${refWeight.toFixed(3)} kg` : '--- kg'}
        </div>
      </div>

      <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">2. Trá»ng lÆ°á»£ng phoi / ba vÃ¢y:</div>
          <div className="text-[9px] font-mono text-[#787774]">
            m_bavia = (m_chi - m_phoi) Ã— (1 - k_loss%) {sawing.use_m_tinh ? '+ (m_phoi - m_tinh)' : ''}
          </div>
        </div>
        <div className="font-bold text-[#111111]">{res.m_bavia.toFixed(3)} kg</div>
      </div>

      <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">3. Chi phÃ­ thÃ©p Ä‘áº§u vÃ o:</div>
          <div className="text-[9px] font-mono text-[#787774]">m_chi Ã— DG_steel Ã— (1 + PhÃ­ QL%)</div>
        </div>
        <div className="font-bold text-[#111111]">{Math.round(costSteelInput).toLocaleString('vi-VN')} VNÄ</div>
      </div>

      <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">4. Chi phÃ­ phoi thu há»“i (-):</div>
          <div className="text-[9px] font-mono text-[#787774]">m_bavia Ã— DG_scrap</div>
        </div>
        <div className="font-bold text-[#00A651]">- {Math.round(costScrapRecycle).toLocaleString('vi-VN')} VNÄ</div>
      </div>

      <div className="flex justify-between items-center py-0.5">
        <div>
          <div className="text-[11px] font-bold text-[#111111] font-sans">5. Chi phÃ­ váº­t tÆ° bÃ¡o giÃ¡:</div>
          <div className="text-[9px] font-mono text-[#787774]">Chi phÃ­ thÃ©p - Chi phÃ­ thu há»“i</div>
        </div>
        <div className="font-bold text-[#111111]">{Math.round(res.C_mat_sawing).toLocaleString('vi-VN')} VNÄ</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* 1. Section Váº­t Liá»‡u (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-4 h-4 text-[#111111] stroke-[2]" />}
        title="SECTION 1: Váº¬T LIá»†U THÃ‰P PHÃ”I CÆ¯A"
        mainBlockTitle="Nháº­p Liá»‡u Váº­t TÆ°"
        mainLeftContent={section1Left}
        mainRightContent={section1Right}
        footerTitle="Tá»”NG CHI PHÃ Váº¬T TÆ¯ THÃ‰P (PHáº¦N A)"
        footerTotal={Math.round(res.C_mat_sawing).toLocaleString('vi-VN')}
        footerTotalUnit="VNÄ / CHI TIáº¾T"
        isFinalTotal={true}
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
        systemRates={systemRates}
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
