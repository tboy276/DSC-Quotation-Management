import type { ToolingComponent } from '../../lib/calculation-engine/types';
import { Plus, Trash2, Layers } from 'lucide-react';

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

  return (
    <div className="space-y-4 animate-fade-in-up mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-1 mb-2">
        <Layers className="w-5 h-5 text-[#38517A]" />
        <h3 className="text-[14px] font-black text-[#38517A] uppercase tracking-wider">
          {isForging ? "SECTION 4: BỘ KHUÔN RÈN" : "SECTION 4: BỘ MẪU ĐÚC"}
        </h3>
      </div>

      {/* Card 1: Danh sách thành phần */}
      <div className="bg-white border border-[#EAEAEA] rounded-[6px] shadow-sm p-5 pl-10 relative">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#EAEAEA]">
          <h4 className="text-[12px] font-bold text-[#111111] uppercase tracking-wider">
            Danh sách các thành phần
          </h4>
          <button
            type="button"
            onClick={handleAddDefaultComp}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thành phần</span>
          </button>
        </div>

        {components.length === 0 ? (
          <p className="text-xs text-[#787774] italic py-8 text-center bg-[#F9F9F9] rounded border border-dashed border-[#EAEAEA]">
            Chưa có thành phần {isForging ? 'khuôn' : 'mẫu'} nào. Nhấp "+ Thêm thành phần" để bổ sung.
          </p>
        ) : (
          <div className="space-y-0">
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
                <div key={idx} className="flex flex-wrap lg:flex-nowrap items-end gap-4 relative py-4 border-b border-[#F0F0EE] last:border-0 group">
                  <button 
                    onClick={() => onRemoveComp(idx)}
                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                    title="Xóa thành phần"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-[160px] flex-shrink-0">
                    <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">Tên</label>
                    <input 
                      type="text" 
                      value={comp.name || ''}
                      onChange={(e) => onUpdateComp(idx, { ...comp, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-medium text-[#111111] focus:border-[#111111] outline-none" 
                    />
                  </div>
                  <div className="w-[120px] flex-shrink-0">
                    <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">Mác</label>
                    <input 
                      type="text"
                      value={comp.material || ''}
                      onChange={(e) => onUpdateComp(idx, { ...comp, material: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-medium text-[#111111] focus:border-[#111111] outline-none" 
                    />
                  </div>
                  <div className="w-[80px] flex-shrink-0">
                    <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">KL (KG)</label>
                    <input 
                      type="number" 
                      min="0" step="0.1"
                      value={comp.weight_kg}
                      onChange={(e) => onUpdateComp(idx, { ...comp, weight_kg: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none" 
                    />
                  </div>
                  <div className="w-[110px] flex-shrink-0">
                    <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">ĐG Vật tư</label>
                    <input 
                      type="number"
                      min="0"
                      value={comp.material_price_kg}
                      onChange={(e) => onUpdateComp(idx, { ...comp, material_price_kg: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none" 
                    />
                  </div>
                  <div className="w-[110px] flex-shrink-0">
                    <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">ĐG Gia công</label>
                    <input 
                      type="number" 
                      min="0"
                      value={comp.machining_price_kg}
                      onChange={(e) => onUpdateComp(idx, { ...comp, machining_price_kg: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none" 
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1.5 pb-2 pl-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={comp.needs_heat_treatment}
                          onChange={(e) => onUpdateComp(idx, { ...comp, needs_heat_treatment: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#111111] rounded border-gray-300" 
                        />
                        <span className="text-[10px] font-bold text-[#787774]">Xử lý nhiệt</span>
                      </label>
                      {comp.needs_heat_treatment && (
                         <input 
                           type="number" 
                           placeholder="Đơn giá XLN"
                           value={comp.heat_treatment_price_kg}
                           onChange={(e) => onUpdateComp(idx, { ...comp, heat_treatment_price_kg: Number(e.target.value) })}
                           className="w-[80px] px-2 py-1 border border-[#EAEAEA] rounded text-[10px] font-mono outline-none focus:border-[#111111]" 
                         />
                      )}
                    </div>
                    {isForging && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={comp.needs_reworking}
                            onChange={(e) => onUpdateComp(idx, { ...comp, needs_reworking: e.target.checked })}
                            className="w-3.5 h-3.5 text-[#111111] rounded border-gray-300" 
                          />
                          <span className="text-[10px] font-bold text-[#787774]">Hạ cốt</span>
                        </label>
                        {comp.needs_reworking && (
                           <div className="flex items-center gap-1">
                             <input 
                               type="number" 
                               value={comp.rework_ratio}
                               onChange={(e) => onUpdateComp(idx, { ...comp, rework_ratio: Number(e.target.value) })}
                               className="w-[50px] px-1.5 py-1 border border-[#EAEAEA] rounded text-[10px] font-mono outline-none focus:border-[#111111] text-center" 
                               placeholder="Tỷ lệ %" 
                             /> 
                             <span className="text-[9px] text-[#787774]">%</span>
                             <input 
                               type="number" 
                               value={comp.rework_count}
                               onChange={(e) => onUpdateComp(idx, { ...comp, rework_count: Number(e.target.value) })}
                               className="w-[50px] px-1.5 py-1 border border-[#EAEAEA] rounded text-[10px] font-mono outline-none focus:border-[#111111] text-center ml-1" 
                               placeholder="Số lần" 
                             /> 
                             <span className="text-[9px] text-[#787774]">lần</span>
                           </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-[120px] text-right border-l border-[#F0F0EE] pl-4 pb-1 flex-shrink-0">
                    <span className="block text-[8px] font-bold text-[#999999] uppercase tracking-wider mb-1">Tổng TP</span>
                    <div className="font-mono font-bold text-[#111111] text-[13px]">
                      {Math.round(opCost).toLocaleString('vi-VN')} <span className="text-[9px] text-[#999999] font-sans">đ</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 2: 2 columns */}
      <div className="bg-white border border-[#EAEAEA] rounded-[6px] shadow-sm p-6 flex flex-col md:flex-row gap-6">
        {/* Left Column: Thông số chung */}
        <div className="flex-1 md:border-r border-[#EAEAEA] md:pr-8">
          <h4 className="text-[12px] font-bold text-[#111111] uppercase tracking-wider mb-6 pb-2 border-b border-[#EAEAEA]">
            Thông số chung & Tuổi thọ
          </h4>
          <div className="flex gap-6 mb-8">
            <div className="w-[120px]">
              <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">Cavity / Khuôn</label>
              <input 
                type="number" 
                min="1"
                value={cavity}
                onChange={(e) => onUpdateField('cavity', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none" 
              />
            </div>
            <div className="w-[160px]">
              <label className="block text-[9px] font-bold text-[#999999] uppercase tracking-wider mb-1.5">Hệ số tuổi thọ/cavity</label>
              <div className="flex items-center border border-[#EAEAEA] rounded-[4px] overflow-hidden focus-within:border-[#111111]">
                <input 
                  type="number" 
                  min="0"
                  value={life_coefficient}
                  onChange={(e) => onUpdateField('life_coefficient', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-medium text-[#111111] outline-none border-none" 
                />
                <span className="px-2.5 py-1.5 bg-[#F9F9F9] border-l border-[#EAEAEA] text-[10px] font-bold text-[#787774] uppercase">PCS</span>
              </div>
            </div>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Tuổi thọ (Tự động):</span>
            <div className="text-[20px] font-black text-[#38517A] flex items-baseline gap-1.5">
              {autoLife.toLocaleString('vi-VN')} <span className="text-[12px] font-bold text-[#787774] font-sans lowercase">pcs</span>
            </div>
          </div>
        </div>

        {/* Right Column: Bóc tách chi phí */}
        <div className="flex-1 md:pl-2 pt-6 md:pt-0 border-t md:border-t-0 border-[#EAEAEA]">
          <h4 className="text-[12px] font-bold text-[#111111] uppercase tracking-wider mb-6 pb-2 border-b border-[#EAEAEA]">
            Bóc tách chi phí bộ {isForging ? 'Khuôn' : 'Mẫu'}
          </h4>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium text-[#787774]">Tổng tiền thành phần:</span>
              <span className="font-mono font-bold text-[#111111] text-[13px]">{totalComponentsCost.toLocaleString('vi-VN')} đ</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium text-[#787774]">+ Tiền thiết kế:</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="0"
                  value={C_design}
                  onChange={(e) => onUpdateField('C_design', Number(e.target.value))}
                  className="w-[120px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none text-right" 
                />
                <span className="text-[12px] text-[#787774] font-sans">đ</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium text-[#787774]">+ Tiền quản lý (%):</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                   <input 
                     type="number" 
                     min="0" max="100"
                     value={k_mgmt_die}
                     onChange={(e) => onUpdateField('k_mgmt_die', Number(e.target.value))}
                     className="w-[60px] px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] text-xs font-mono font-medium text-[#111111] focus:border-[#111111] outline-none text-center" 
                   />
                   <span className="text-[12px] text-[#787774] font-sans">%</span>
                </div>
                <span className="text-[12px] text-[#787774] font-mono">= {mgmtCost.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#EAEAEA] flex justify-between items-end mt-2">
              <span className="text-[12px] font-bold text-[#111111] uppercase tracking-wider">= Tổng chi phí:</span>
              <span className="font-mono font-black text-[#38517A] text-[20px]">
                {Math.round(totalDieCost).toLocaleString('vi-VN')} <span className="text-[13px] font-bold text-[#38517A] font-sans">đ</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
