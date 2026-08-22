import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { Section5SummaryCard } from './Section5SummaryCard';
import { Wrench } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';
import { HighlightNumberInput } from '../../components/ui/HighlightNumberInput';


export default function MachiningCalculatorForm() {
  const machining = useQuotationStore((state) => state.machiningInput);
  const setMachiningField = useQuotationStore((state) => state.setMachiningField);
  
  const addOp = useQuotationStore((state) => state.addMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeMachiningOp);
  const getMachiningResult = useQuotationStore((state) => state.getMachiningResult);
  const systemRates = useQuotationStore((state) => state.systemRates);

  const res = getMachiningResult();

  return (
    <div className="space-y-5 animate-fade-in-up">
      <CostSectionCard
        icon={<Wrench className="w-4 h-4 text-[#111111] stroke-[2]" />}
        title="SECTION 1: THÔNG SỐ SẢN PHẨM"
        mainBlockTitle="Thông số vật tư (Khách hàng cấp phôi)"
        mainLeftContent={
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-1">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">
                  Trọng Lượng Tinh Sau GC (m_tinh - kg):<span className="text-amber-600 ml-0.5">*</span>
                </label>
                <span className="text-[10px] text-gray-500">Dùng tính phí bao gói, vận chuyển</span>
              </div>
              <HighlightNumberInput
                step="0.001"
                min="0"
                value={machining.m_tinh}
                onChange={(e) => setMachiningField('m_tinh', e || 0)}
              />
            </div>
          </div>
        }
        mainRightContent={
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-[#EAEAEA]">
              <span className="text-[#2F3437] font-sans">Chi phí bao gói dự kiến:</span>
              <span className="font-bold text-[#111111]">
                {Math.round(res.C_pack || 0).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#2F3437] font-sans">Chi phí vận chuyển dự kiến:</span>
              <span className="font-bold text-[#111111]">
                {Math.round(res.C_trans || 0).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        }
      />

      {/* Machining */}
      <MachiningOpsList
        operations={machining.machining_operations || []}
        totalMachiningCost={res.C_machining}
        machiningNotes={machining.machining_notes}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
        onUpdateNotes={(notes) => setMachiningField('machining_notes', notes)}
        systemRates={systemRates}
      />

      {/* Summary */}
      <Section5SummaryCard
        isForging={false}
        k_mgmt={machining.k_mgmt}
        onKMgmtChange={(val) => setMachiningField('k_mgmt', val)}
        DG_trans_kg={machining.DG_trans_kg}
        onDGTransChange={(val) => setMachiningField('DG_trans_kg', val)}
        DG_pack_kg={machining.DG_pack_kg || 0}
        onDGPackChange={(val) => setMachiningField('DG_pack_kg', val)}
        k_profit={machining.k_profit_machining}
        onKProfitChange={(val) => setMachiningField('k_profit_machining', val)}
        quoted_moq={machining.quoted_moq}
        onMoqChange={(val) => setMachiningField('quoted_moq', val)}
        DG_heat_treat_per_kg={machining.DG_heat_treat_per_kg}
        onDGHeatTreatChange={(val) => setMachiningField('DG_heat_treat_per_kg', val)}
        DG_paint_per_kg={machining.DG_paint_per_kg}
        onDGPaintChange={(val) => setMachiningField('DG_paint_per_kg', val)}
        COGS={res.COGS}
        C_mgmt={res.C_mgmt}
        C_trans={res.C_trans}
        C_pack={res.C_pack}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.C_profit}
        final_price={res.P_MACHINING}
      />
    </div>
  );
}
