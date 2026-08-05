import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MaterialsManager } from './MaterialsManager';
import { CastingBomManager } from './CastingBomManager';
import { CastingOperationsRatesManager } from './CastingOperationsRatesManager';
import { EquipmentRatesManager } from './EquipmentRatesManager';
import { Package, Box, Factory, Settings2 } from 'lucide-react';

export const MasterDataContainer = () => {
  const { profile } = useAuth();
  const isEstimator = profile?.role === 'estimator';
  const [activeSubTab, setActiveSubTab] = useState<
    'materials' | 'casting_bom' | 'casting_operations' | 'equipment_rates'
  >('materials');

  const tabs = [
    { id: 'materials', label: '1. Vật Tư & Lịch Sử Giá', icon: Package },
    { id: 'casting_bom', label: '2. Định Mức BOM Mác Gang', icon: Box },
    { id: 'casting_operations', label: '3. Chi Phí Công Đoạn Đúc', icon: Factory },
    { id: 'equipment_rates', label: '4. Chi Phí Thiết Bị', icon: Settings2 },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Master Data Main Sub-Navigation Bar */}
      <div className="bg-white p-2 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#F0F0EE] text-[#787774] hover:bg-[#E0E0DE] hover:text-[#111111]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Sub-Tab View */}
      {activeSubTab === 'materials' && <MaterialsManager isEstimator={isEstimator} />}
      {activeSubTab === 'casting_bom' && <CastingBomManager isEstimator={isEstimator} />}
      {activeSubTab === 'casting_operations' && <CastingOperationsRatesManager />}
      {activeSubTab === 'equipment_rates' && <EquipmentRatesManager />}
    </div>
  );
};
