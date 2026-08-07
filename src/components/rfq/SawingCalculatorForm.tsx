import React from 'react';
import { useQuotationStore } from '../../store/useQuotationStore';
import { MachiningOpsList } from './MachiningOpsList';
import { Section5SummaryCard } from './Section5SummaryCard';
import { Scissors, Workflow } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

export default function SawingCalculatorForm() {
  const sawing = useQuotationStore((state) => state.sawingInput);
  const setSawingField = useQuotationStore((state) => state.setSawingField);
  
  const addOp = useQuotationStore((state) => state.addSawingMachiningOp);
  const updateOp = useQuotationStore((state) => state.updateSawingMachiningOp);
  const removeOp = useQuotationStore((state) => state.removeSawingMachiningOp);
  const getSawingResult = useQuotationStore((state) => state.getSawingResult);

  const res = getSawingResult();

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. Section Vật Liệu (Material Inputs) */}
      <CostSectionCard
        icon={<Workflow className="w-5 h-5" />}
        title="SECTION 1: VẬT LIỆU THÉP & CẮT PHÔI"
        mainBlockTitle="Thông số vật tư"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Trọng Lượng Tinh - m_tinh (kg)</label>
            <input
              type="number"
              step="0.001"
              value={sawing.m_tinh || ''}
              onChange={(e) => setSawingField('m_tinh', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Trọng Lượng Phôi Cắt (kg)</label>
            <input
              type="number"
              step="0.001"
              value={sawing.m_phoi}
              onChange={(e) => setSawingField('m_phoi', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Trọng Lượng Chi Đầu Vào (kg)</label>
            <input
              type="number"
              step="0.001"
              value={sawing.m_chi}
              onChange={(e) => setSawingField('m_chi', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Hao Hụt Cắt (%)</label>
            <input
              type="number"
              step="0.1"
              value={sawing.k_loss}
              onChange={(e) => setSawingField('k_loss', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Đơn Giá Thép Đầu Vào (VNĐ/kg)</label>
            <input
              type="number"
              value={sawing.DG_steel}
              onChange={(e) => setSawingField('DG_steel', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Đơn Giá Phế Liệu (VNĐ/kg)</label>
            <input
              type="number"
              value={sawing.DG_scrap}
              onChange={(e) => setSawingField('DG_scrap', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Thời Gian Cắt Phôi (giây)</label>
            <input
              type="number"
              value={sawing.t_cut_sec}
              onChange={(e) => setSawingField('t_cut_sec', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#787774] uppercase tracking-wider">Đơn Giá Máy Cắt (VNĐ/giờ)</label>
            <input
              type="number"
              value={sawing.DG_sawing_machine_hour}
              onChange={(e) => setSawingField('DG_sawing_machine_hour', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-[8px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-[13px] transition-all font-mono"
            />
          </div>
        </div>
      </CostSectionCard>

      {/* 2. Machining */}
      <MachiningOpsList
        operations={sawing.machining_operations || []}
        totalMachiningCost={res.C_machining}
        machiningNotes={sawing.machining_notes}
        onAddOp={addOp}
        onUpdateOp={updateOp}
        onRemoveOp={removeOp}
        onUpdateNotes={(notes) => setSawingField('machining_notes', notes)}
      />

      {/* 3. Summary */}
      <Section5SummaryCard
        k_mgmt={sawing.k_mgmt}
        onKMgmtChange={(val) => setSawingField('k_mgmt', val)}
        DG_trans_kg={sawing.DG_trans_kg}
        onDGTransChange={(val) => setSawingField('DG_trans_kg', val)}
        DG_pack_kg={sawing.DG_pack_kg || 0}
        onDGPackChange={(val) => setSawingField('DG_pack_kg', val)}
        k_profit={sawing.k_profit_sawing}
        onKProfitChange={(val) => setSawingField('k_profit_sawing', val)}
        COGS={res.COGS}
        C_mgmt={res.COGS * (sawing.k_mgmt / 100)}
        C_trans={(sawing.m_tinh || sawing.m_phoi || 0) * sawing.DG_trans_kg}
        C_pack={sawing.DG_pack_kg ? (sawing.m_tinh || sawing.m_phoi || 0) * sawing.DG_pack_kg : (sawing.C_pack || 0)}
        pre_profit_price={res.pre_profit_price}
        profit_amount={res.P_SAWING - res.pre_profit_price}
        final_price={res.P_SAWING}
      />
    </div>
  );
}

