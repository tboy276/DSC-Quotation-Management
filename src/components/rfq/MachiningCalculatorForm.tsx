import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { Section5SummaryCard } from './Section5SummaryCard';
import { Wrench } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export default function MachiningCalculatorForm() {
  const machining = useQuotationStore((state) => state.machiningInput);
  const setMachiningField = useQuotationStore((state) => state.setMachiningField);
  
  const addOp = useQuotationStore((state) => state.addMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeMachiningOp);
  const getMachiningResult = useQuotationStore((state) => state.getMachiningResult);

  const res = getMachiningResult();

  return (
    <div className="space-y-5 animate-fade-in-up">
      <CostSectionCard
        icon={<Wrench className="w-5 h-5 text-emerald-500" />}
        title="THÔNG SỐ SẢN PHẨM"
        mainBlockTitle="Thông số vật tư (Khách hàng cấp phôi)"
        mainLeftContent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Trọng Lượng Tinh Sau GC - m_tinh (kg)</label>
              <input
                type="number"
                step="0.001"
                value={machining.m_tinh || ''}
                onChange={(e) => setMachiningField('m_tinh', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all"
              />
              <p className="text-[10px] text-gray-500">Dùng để tính phí bao gói, vận chuyển</p>
            </div>
          </div>
        }
        mainRightContent={
          <div className="bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] p-3 space-y-2">
            <h4 className="text-[10px] font-bold text-[#787774] uppercase tracking-wider">Dự Toán Bao Gói & Vận Chuyển</h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#2F3437] font-sans">Chi phí bao gói:</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(res.C_pack || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#2F3437] font-sans">Chi phí vận chuyển:</span>
                <span className="font-bold text-[#111111]">
                  {Math.round(res.C_trans || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
            <p className="text-[9px] text-[#787774] mt-2 font-sans italic">* Chi phí dự kiến, thay đổi theo đơn giá tại Section 5</p>
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
