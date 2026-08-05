
import type { ToolingComponent } from '../../lib/calculation-engine/types';
import { Plus, Trash2, PenTool } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

interface ToolingOpsListProps {
  isForging: boolean;
  
  components: ToolingComponent[];
  C_design: number;
  k_mgmt_die: number;
  cavity: number;
  life_coefficient: number;
  
  onAddComp: (comp: ToolingComponent) => void;
  onUpdateComp: (index: number, comp: ToolingComponent) => void;
  onRemoveComp: (index: number) => void;
  
  onUpdateField: (field: string, value: number) => void;
}

export const ToolingOpsList = ({
  isForging,
  components,
  C_design,
  k_mgmt_die,
  cavity,
  life_coefficient,
  onAddComp,
  onUpdateComp,
  onRemoveComp,
  onUpdateField,
}: ToolingOpsListProps) => {

  const handleAddDefaultComp = () => {
    onAddComp({
      name: isForging ? `Khuôn rèn ${components.length + 1}` : `Tấm mẫu ${components.length + 1}`,
      material: isForging ? 'Thép SKD11' : 'Nhôm khối',
      weight_kg: 50,
      material_price_kg: 85000,
      machining_price_kg: 120000,
      needs_heat_treatment: false,
      heat_treatment_price_kg: 64000,
      needs_reworking: false,
      rework_ratio: 30,
      rework_count: 9,
    });
  };

  // Calculate totals
  const totalComponentsCost = components.reduce((sum, comp) => {
    const materialCost = comp.weight_kg * comp.material_price_kg;
    const machiningCost = comp.weight_kg * comp.machining_price_kg;
    const heatTreatmentCost = comp.needs_heat_treatment ? (comp.weight_kg * comp.heat_treatment_price_kg) : 0;
    
    let reworkCost = 0;
    if (isForging && comp.needs_reworking) {
      const reworkRatio = (comp.rework_ratio ?? 30) / 100;
      const reworkCount = comp.rework_count ?? 9;
      reworkCost = reworkCount * (reworkRatio * machiningCost);
    }
    return sum + materialCost + machiningCost + heatTreatmentCost + reworkCost;
  }, 0);

  const mgmtCost = (totalComponentsCost + C_design) * (k_mgmt_die / 100);
  const totalDieCost = totalComponentsCost + C_design + mgmtCost;
  const autoLife = life_coefficient * cavity;

  const topInputs = (
    <div className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[4px]">
      <div className="space-y-3 col-span-1 md:col-span-2">
        <h5 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-2 border-b border-[#EAEAEA] pb-1">
          Thông số chung & Tuổi thọ
        </h5>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Cavity / Khuôn
            </label>
            <input
              type="number"
              min="1"
              value={cavity}
              onChange={(e) => onUpdateField('cavity', Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">
              Hệ số tuổi thọ/cavity
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                value={life_coefficient}
                onChange={(e) => onUpdateField('life_coefficient', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-l-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111]"
              />
              <span className="bg-[#F0F0EE] px-2 py-1.5 border border-l-0 border-[#EAEAEA] rounded-r-[4px] text-[10px] font-bold text-[#787774] uppercase">pcs</span>
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-dashed border-[#EAEAEA]">
          <p className="text-[10px] font-bold text-[#787774] uppercase">Tuổi thọ (Tự động):</p>
          <p className="font-mono font-extrabold text-[#38517A] text-[16px]">{autoLife.toLocaleString('vi-VN')} pcs</p>
        </div>
      </div>
      
      <div className="space-y-2 col-span-1 md:col-span-2">
        <h5 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider mb-2 border-b border-[#EAEAEA] pb-1">
          Bóc tách Chi phí Bộ {isForging ? 'Khuôn' : 'Mẫu'}
        </h5>
        
        <div className="flex justify-between items-center pb-1">
          <span className="text-[11px] font-medium text-[#787774]">Tổng tiền thành phần:</span>
          <span className="font-mono font-bold text-[#111111] text-xs">{totalComponentsCost.toLocaleString('vi-VN')} đ</span>
        </div>
        
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[11px] font-medium text-[#787774] min-w-[120px]">+ Tiền thiết kế:</span>
          <div className="flex-1 relative">
            <input
              type="number"
              min="0"
              value={C_design}
              onChange={(e) => onUpdateField('C_design', Number(e.target.value))}
              className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111] text-right pr-6"
            />
            <span className="absolute right-2 top-1.5 text-[10px] text-[#787774]">đ</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[11px] font-medium text-[#787774] min-w-[120px]">+ Tiền quản lý (%):</span>
          <div className="flex-1 flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="100"
              value={k_mgmt_die}
              onChange={(e) => onUpdateField('k_mgmt_die', Number(e.target.value))}
              className="w-16 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111] text-center"
            />
            <span className="text-[10px] text-[#787774] font-mono">= {mgmtCost.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-[#111111] flex justify-between items-center">
          <span className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">= Tổng Chi Phí:</span>
          <span className="font-mono font-extrabold text-[#38517A] text-[16px]">{totalDieCost.toLocaleString('vi-VN')} đ</span>
        </div>
      </div>
    </div>
  );

  const rightContent = components.length === 0 ? (
    <p className="text-xs text-[#787774] italic py-2 text-center">
      Chưa có thành phần {isForging ? 'khuôn' : 'mẫu'} nào. Nhấp "+ Thêm Thành Phần" để bổ sung.
    </p>
  ) : (
    <div className="space-y-4 mt-4">
      {components.map((comp, idx) => {
        // Compute for this comp
        const materialCost = comp.weight_kg * comp.material_price_kg;
        const machiningCost = comp.weight_kg * comp.machining_price_kg;
        const heatTreatmentCost = comp.needs_heat_treatment ? (comp.weight_kg * comp.heat_treatment_price_kg) : 0;
        
        let reworkCost = 0;
        if (isForging && comp.needs_reworking) {
          const reworkRatio = (comp.rework_ratio ?? 30) / 100;
          const reworkCount = comp.rework_count ?? 9;
          reworkCost = reworkCount * (reworkRatio * machiningCost);
        }
        
        const opCost = materialCost + machiningCost + heatTreatmentCost + reworkCost;

        return (
          <div
            key={idx}
            className="flex flex-col gap-3 p-4 rounded-[6px] border border-[#EAEAEA] bg-white text-xs relative animate-fade-in"
          >
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1 mr-4">
                {/* Tên thành phần */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                    Tên thành phần
                  </label>
                  <input
                    type="text"
                    value={comp.name || ''}
                    onChange={(e) => onUpdateComp(idx, { ...comp, name: e.target.value })}
                    placeholder="VD: Tấm mẫu..."
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111]"
                  />
                </div>

                {/* Mác vật liệu */}
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                    Mác vật liệu
                  </label>
                  <input
                    type="text"
                    value={comp.material || ''}
                    onChange={(e) => onUpdateComp(idx, { ...comp, material: e.target.value })}
                    placeholder="VD: Nhôm khối"
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111]"
                  />
                </div>

                {/* Trọng lượng */}
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                    Trọng lượng (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={comp.weight_kg}
                    onChange={(e) => onUpdateComp(idx, { ...comp, weight_kg: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                  />
                </div>

                {/* Phép tính giá */}
                <div className="col-span-1 md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 pt-3 border-t border-dashed border-[#EAEAEA]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#787774] w-28 inline-block">ĐG Vật tư (đ/kg)</span>
                      <input
                        type="number"
                        min="0"
                        value={comp.material_price_kg}
                        onChange={(e) => onUpdateComp(idx, { ...comp, material_price_kg: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono">= {(comp.weight_kg * comp.material_price_kg).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#787774] w-28 inline-block">ĐG Gia công (đ/kg)</span>
                      <input
                        type="number"
                        min="0"
                        value={comp.machining_price_kg}
                        onChange={(e) => onUpdateComp(idx, { ...comp, machining_price_kg: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                      />
                      <span className="text-[10px] text-[#787774] font-mono">= {(comp.weight_kg * comp.machining_price_kg).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer w-28">
                        <input
                          type="checkbox"
                          checked={comp.needs_heat_treatment}
                          onChange={(e) => onUpdateComp(idx, { ...comp, needs_heat_treatment: e.target.checked })}
                          className="w-3 h-3 text-[#111111] focus:ring-[#111111] border-gray-300 rounded"
                        />
                        <span className="text-[10px] font-bold text-[#111111]">Xử lý nhiệt?</span>
                      </label>
                      {comp.needs_heat_treatment && (
                        <>
                          <input
                            type="number"
                            min="0"
                            value={comp.heat_treatment_price_kg}
                            onChange={(e) => onUpdateComp(idx, { ...comp, heat_treatment_price_kg: Number(e.target.value) })}
                            className="w-24 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111]"
                          />
                          <span className="text-[10px] text-[#787774] font-mono">= {(comp.weight_kg * comp.heat_treatment_price_kg).toLocaleString('vi-VN')} đ</span>
                        </>
                      )}
                    </div>
                    
                    {isForging && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer w-28">
                          <input
                            type="checkbox"
                            checked={comp.needs_reworking}
                            onChange={(e) => onUpdateComp(idx, { ...comp, needs_reworking: e.target.checked })}
                            className="w-3 h-3 text-[#111111] focus:ring-[#111111] border-gray-300 rounded"
                          />
                          <span className="text-[10px] font-bold text-[#111111]">Hạ cốt?</span>
                        </label>
                        {comp.needs_reworking && (
                          <div className="flex items-center gap-1.5 bg-[#F0F0EE] p-1 rounded">
                            <span className="text-[9px] text-[#787774]">Tỷ lệ</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={comp.rework_ratio}
                              onChange={(e) => onUpdateComp(idx, { ...comp, rework_ratio: Number(e.target.value) })}
                              className="w-12 px-1 py-0.5 border border-[#EAEAEA] rounded bg-white font-mono text-[#111111] text-[10px] focus:outline-none text-center"
                            />
                            <span className="text-[9px] text-[#787774]">% x</span>
                            <input
                              type="number"
                              min="1"
                              value={comp.rework_count}
                              onChange={(e) => onUpdateComp(idx, { ...comp, rework_count: Number(e.target.value) })}
                              className="w-12 px-1 py-0.5 border border-[#EAEAEA] rounded bg-white font-mono text-[#111111] text-[10px] focus:outline-none text-center"
                            />
                            <span className="text-[9px] text-[#787774]">lần = </span>
                            <span className="text-[10px] text-[#111111] font-mono font-bold">{(reworkCost).toLocaleString('vi-VN')} đ</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => onRemoveComp(idx)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end cursor-pointer"
                  title="Xóa thành phần"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-right mt-auto pb-1 bg-[#FBFBFA] p-2 rounded border border-[#EAEAEA]">
                  <p className="text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1">Tổng TP vòng đời</p>
                  <p className="font-mono font-extrabold text-[#111111] text-[15px]">
                    {Math.round(opCost).toLocaleString('vi-VN')} <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#787774]">VNĐ</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <CostSectionCard
      icon={<PenTool className="w-5 h-5" />}
      title={isForging ? "SECTION 4: BỘ KHUÔN RÈN" : "SECTION 4: BỘ MẪU ĐÚC"}
      topInputs={<>{topInputs}</>}
      mainBlockTitle="Danh Sách Các Thành Phần"
      mainBlockHeaderRight={
        <button
          type="button"
          onClick={handleAddDefaultComp}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thành phần</span>
        </button>
      }
      mainRightContent={rightContent}
      footerTitle={isForging ? "TỔNG CHI PHÍ BỘ KHUÔN RÈN" : "TỔNG CHI PHÍ BỘ MẪU ĐÚC"}
      footerSubtitle="= Tổng tiền (Thành phần + Thiết kế + Quản lý)"
      footerTotal={Math.round(totalDieCost).toLocaleString('vi-VN')}
      footerTotalUnit="VNĐ"
    />
  );
};
