import type { ToolingComponent } from '../../lib/calculation-engine/types';
import type { Material } from '../../types/master-data';
import { Plus, Trash2, Layers } from 'lucide-react';
import { ActionButton } from '../ui/ActionButton';

interface ToolingOpsListProps {
  isForging: boolean;
  materials?: Material[];
  
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
  materials = [],
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

  const autoLife = life_coefficient * cavity;
  
  // Chi phí khuôn phải = 0 khi danh sách chi tiết rỗng
  const mgmtCost = components.length > 0 ? (totalComponentsCost + C_design) * (k_mgmt_die / 100) : 0;
  const totalDieCost = components.length > 0 ? (totalComponentsCost + C_design + mgmtCost) : 0;

  return (
    <div className="space-y-4 animate-fade-in-up mt-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-2.5">
        <Layers className="w-4 h-4 text-[#111111] stroke-[2]" />
        <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
          {isForging ? "SECTION 4: BỘ KHUÔN RÈN" : "SECTION 4: BỘ MẪU ĐÚC"}
        </h3>
      </div>

      {/* Card 1: Danh sách thành phần */}
      <div className="bg-white border border-[#EAEAEA] rounded-[8px] shadow-xs p-4 relative space-y-4">
        <div className="flex justify-between items-center pb-2.5 border-b border-[#EAEAEA]">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
            1. Danh sách các chi tiết / thành phần bộ {isForging ? 'khuôn' : 'mẫu'}
          </h4>
          
          <ActionButton
            type="button"
            onClick={handleAddDefaultComp}
            variant="primary"
            icon={Plus}
            label={`Thêm chi tiết ${isForging ? 'khuôn' : 'mẫu'}`}
          />
        </div>

        {/* List items */}
        {components.length === 0 ? (
          <p className="text-xs text-[#787774] italic text-center py-3">
            Chưa có chi tiết nào. Nhấp nút trên để thêm chi tiết {isForging ? 'khuôn' : 'mẫu'}.
          </p>
        ) : (
          <div className="space-y-3">
            {components.map((comp, idx) => {
              const matCost = comp.weight_kg * comp.material_price_kg;
              const machCost = comp.weight_kg * comp.machining_price_kg;
              const heatCost = comp.needs_heat_treatment ? (comp.weight_kg * comp.heat_treatment_price_kg) : 0;
              let rewCost = 0;
              if (isForging && comp.needs_reworking) {
                const ratio = (comp.rework_ratio ?? 30) / 100;
                const count = comp.rework_count ?? 9;
                rewCost = count * (ratio * machCost);
              }
              const compTotal = matCost + machCost + heatCost + rewCost;

              return (
                <div key={idx} className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EAEAEA]">
                    <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                      <span className="font-mono text-xs font-bold text-[#111111]">#{idx + 1}</span>
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => onUpdateComp(idx, { ...comp, name: e.target.value })}
                        className="px-2 py-1 border border-[#EAEAEA] bg-white rounded font-bold text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                        placeholder="Tên chi tiết..."
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-[#111111]">
                        {Math.round(compTotal).toLocaleString('vi-VN')} VNĐ
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveComp(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Xóa chi tiết"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form fields grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Vật liệu</label>
                      <select
                        value={comp.material_id || ''}
                        onChange={(e) => {
                          const selMat = materials.find((m) => m.id === e.target.value);
                          onUpdateComp(idx, {
                            ...comp,
                            material_id: selMat?.id,
                            material: selMat?.name || comp.material,
                            material_price_kg: selMat?.latest_price ?? comp.material_price_kg,
                          });
                        }}
                        className="w-full px-2 py-1 border border-[#EAEAEA] bg-white rounded font-mono text-xs text-[#111111]"
                      >
                        <option value="">-- Chọn vật tư --</option>
                        {materials
                          .filter((m) => m.category === 'Vật liệu làm khuôn mẫu' || m.id === comp.material_id)
                          .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {m.latest_price?.toLocaleString('vi-VN')} VNĐ/kg
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Trọng lượng (kg)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={comp.weight_kg}
                        onChange={(e) => onUpdateComp(idx, { ...comp, weight_kg: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-xs text-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Giá vật liệu (VNĐ/kg)</label>
                      <input
                        type="number"
                        step="1000"
                        value={comp.material_price_kg}
                        onChange={(e) => onUpdateComp(idx, { ...comp, material_price_kg: Number(e.target.value) })}
                        disabled={!!comp.material_id}
                        className={`w-full px-2 py-1 border border-[#EAEAEA] rounded font-mono font-bold text-xs text-[#111111] ${comp.material_id ? 'bg-[#F9F9F8] text-[#787774] cursor-not-allowed' : 'bg-white'}`}
                      />
                      {comp.material_id && <div className="text-[9px] text-[#787774] mt-0.5">Giá tự động theo Tab 1</div>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Giá gia công (VNĐ/kg)</label>
                      <input
                        type="number"
                        step="1000"
                        value={comp.machining_price_kg}
                        onChange={(e) => onUpdateComp(idx, { ...comp, machining_price_kg: Number(e.target.value) })}
                        className="w-full px-2 py-1 border border-[#EAEAEA] bg-white rounded font-mono font-bold text-xs text-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Options: Heat treatment & Sửa khuôn */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-[#EAEAEA]">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={comp.needs_heat_treatment}
                        onChange={(e) => onUpdateComp(idx, { ...comp, needs_heat_treatment: e.target.checked })}
                        className="rounded text-[#111111]"
                      />
                      <span className="text-[11px] font-bold text-[#787774] uppercase">Nhiệt luyện</span>
                    </label>

                    {comp.needs_heat_treatment && (
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-[#787774] uppercase font-bold">Đơn giá NL:</span>
                        <input
                          type="number"
                          value={comp.heat_treatment_price_kg}
                          onChange={(e) => onUpdateComp(idx, { ...comp, heat_treatment_price_kg: Number(e.target.value) })}
                          className="w-24 px-2 py-0.5 border border-[#EAEAEA] bg-white rounded font-mono text-xs text-[#111111]"
                        />
                        <span className="text-[10px] text-[#787774] font-mono">VNĐ/kg</span>
                      </div>
                    )}

                    {isForging && (
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={comp.needs_reworking}
                          onChange={(e) => onUpdateComp(idx, { ...comp, needs_reworking: e.target.checked })}
                          className="rounded text-[#111111]"
                        />
                        <span className="text-[11px] font-bold text-[#787774] uppercase">Sửa khuôn nhiều lần</span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 2: Thông số tuổi thọ & Bóc tách tổng chi phí */}
      <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-4 flex flex-col md:flex-row gap-5">
        {/* Left Column: Thông số lòng khuôn */}
        <div className="w-full md:w-1/3 space-y-3 pr-2 border-b md:border-b-0 md:border-r border-[#EAEAEA] pb-4 md:pb-0">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider pb-2 border-b border-[#EAEAEA]">
            Thông số lòng khuôn & tuổi thọ
          </h4>
          
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Số lòng khuôn (Cavity):</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={cavity}
                  onChange={(e) => onUpdateField('cavity', Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-xs text-[#111111] bg-white"
                />
                <span className="px-2.5 py-1.5 bg-white border-l-0 border border-[#EAEAEA] text-[10px] font-bold text-[#787774] uppercase">Lòng</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-1">Hệ số sản lượng / 1 lòng:</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={life_coefficient}
                  onChange={(e) => onUpdateField('life_coefficient', Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] font-mono font-bold text-xs text-[#111111] bg-white"
                />
                <span className="px-2.5 py-1.5 bg-white border-l-0 border border-[#EAEAEA] text-[10px] font-bold text-[#787774] uppercase">PCS</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-[#EAEAEA]">
              <span className="block text-[10px] font-bold text-[#787774] uppercase tracking-wider mb-0.5">Tuổi thọ bộ {isForging ? 'khuôn' : 'mẫu'} (Tự động):</span>
              <div className="text-base font-mono font-bold text-[#111111]">
                {autoLife.toLocaleString('vi-VN')} <span className="text-xs font-sans text-[#787774]">pcs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bóc tách chi phí */}
        <div className="w-full md:w-2/3 space-y-3">
          <h4 className="text-[11px] font-bold text-[#111111] uppercase tracking-wider pb-2 border-b border-[#EAEAEA]">
            Bóc tách chi phí bộ {isForging ? 'Khuôn' : 'Mẫu'}
          </h4>
          
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
              <span className="text-[#787774] font-sans">Tổng tiền thành phần:</span>
              <span className="font-bold text-[#111111]">{totalComponentsCost.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            
            <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
              <span className="text-[#787774] font-sans">+ Phí thiết kế:</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="0"
                  value={C_design}
                  onChange={(e) => onUpdateField('C_design', Number(e.target.value))}
                  className="w-[110px] px-2 py-1 border border-[#EAEAEA] rounded bg-white text-xs font-mono font-bold text-[#111111] text-right" 
                />
                <span className="text-xs text-[#787774] font-sans">VNĐ</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-1 border-b border-[#EAEAEA]">
              <span className="text-[#787774] font-sans">+ Phí quản lý (%):</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0" max="100"
                  value={k_mgmt_die}
                  onChange={(e) => onUpdateField('k_mgmt_die', Number(e.target.value))}
                  className="w-[50px] px-2 py-1 border border-[#EAEAEA] rounded bg-white text-xs font-mono font-bold text-[#111111] text-center" 
                />
                <span className="text-xs text-[#787774] font-sans">%</span>
                <span className="text-xs text-[#787774] font-mono">= {mgmtCost.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
            
            {/* Signature Dark Obsidian Hero Total Card for Section 4 */}
            <div className="mt-3 bg-[#111111] text-white rounded-[6px] p-3.5 flex flex-col items-end justify-center text-right border border-[#111111] shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                TỔNG CHI PHÍ BỘ {isForging ? 'KHUÔN' : 'MẪU'}
              </p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="font-mono font-extrabold text-2xl text-emerald-400 leading-none">
                  {Math.round(totalDieCost).toLocaleString('vi-VN')}
                </span>
                <span className="font-mono font-bold text-xs text-white uppercase">
                  VNĐ
                </span>
              </div>
            </div>
            {components.length === 0 && (
              <p className="text-[10px] text-red-500/80 italic mt-1.5 leading-tight">
                * Chưa có chi tiết {isForging ? 'khuôn' : 'mẫu'} — chi phí {isForging ? 'khuôn' : 'mẫu'} = 0đ, Phí thiết kế/Phí quản lý sẽ không được tính cho tới khi thêm ít nhất 1 chi tiết.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
