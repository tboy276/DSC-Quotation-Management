import type { MachiningOperation } from '../../lib/calculation-engine/types';
import { INITIAL_SYSTEM_RATES } from '../../lib/master-data-service';
import { Plus, Trash2, Cpu } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';

interface MachiningOpsListProps {
  operations: MachiningOperation[];
  totalMachiningCost: number;
  machiningNotes?: string;
  onAddOp: (op: MachiningOperation) => void;
  onUpdateOp: (index: number, op: MachiningOperation) => void;
  onRemoveOp: (index: number) => void;
  onUpdateNotes: (notes: string) => void;
}

export const MachiningOpsList = ({
  operations,
  totalMachiningCost,
  machiningNotes,
  onAddOp,
  onUpdateOp,
  onRemoveOp,
  onUpdateNotes,
}: MachiningOpsListProps) => {
  const cncMachineTypes = [
    { key: 'cnc_type_1', name: 'Loại I: TT Gia công tổ hợp, ngang, đứng', ratePerHour: 390000, ratePerMinute: 6500 },
    { key: 'cnc_type_2', name: 'Loại II: Máy tiện đứng, phay 3 trục,...', ratePerHour: 338000, ratePerMinute: 338000 / 60 },
    { key: 'cnc_type_3', name: 'Loại III: Máy tiện, phay CNC', ratePerHour: 234000, ratePerMinute: 3900 },
    { key: 'cnc_type_4', name: 'Loại IV: Máy khoan cần, máy cũ,..', ratePerHour: 182000, ratePerMinute: 182000 / 60 },
  ];

  const handleAddDefaultOp = () => {
    const defaultType = cncMachineTypes[2]; // Default to Loại III: Máy tiện, phay CNC
    const systemRateObj = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === defaultType.key);
    const hourlyRate = systemRateObj?.value || defaultType.ratePerHour;

    onAddOp({
      name: `Nguyên công ${operations.length + 1}`,
      t_prep_min: 2.0,
      t_man_min: 3.0,
      DG_machine_hour: hourlyRate,
    });
  };

  const handleSelectMachineType = (index: number, key: string) => {
    const cncObj = cncMachineTypes.find((c) => c.key === key);
    const systemRateObj = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === key);

    if (cncObj) {
      const hourlyRate = systemRateObj?.value || cncObj.ratePerHour;
      const currentOp = operations[index];
      onUpdateOp(index, {
        ...currentOp,
        DG_machine_hour: hourlyRate,
      });
    }
  };

  const rightContent = operations.length === 0 ? (
    <p className="text-xs text-[#787774] italic py-2 text-center">
      Chưa có nguyên công gia công nào. Nhấp "+ Thêm nguyên công" để chọn nhóm máy CNC.
    </p>
  ) : (
    <div className="space-y-3">
      {operations.map((op, idx) => {
        // Find matching CNC type based on rate, or default to Loại III
        const matchedCncKey = cncMachineTypes.find((c) => {
          const sysRate = INITIAL_SYSTEM_RATES.find(r => r.rate_key === c.key)?.value || c.ratePerHour;
          return sysRate === op.DG_machine_hour;
        })?.key || 'cnc_type_3';
        
        const currentCncType = cncMachineTypes.find(c => c.key === matchedCncKey) || cncMachineTypes[2];
        const ratePerMin = currentCncType ? (currentCncType.ratePerMinute >= 1000 ? `${currentCncType.ratePerMinute / 1000}k` : currentCncType.ratePerMinute) : (op.DG_machine_hour / 60);

        // Calculate cost for this specific op
        const opCost = (op.t_prep_min + op.t_man_min) * (op.DG_machine_hour / 60);

        return (
          <div
            key={idx}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-4 rounded-[6px] border border-[#EAEAEA] bg-white text-xs"
          >
            {/* Cột trái: Các trường nhập liệu */}
            <div className="flex flex-wrap gap-4 flex-1">
              {/* Tên Nguyên Công */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Tên Nguyên Công
                </label>
                <input
                  type="text"
                  value={op.name || ''}
                  onChange={(e) => onUpdateOp(idx, { ...op, name: e.target.value })}
                  placeholder={`Nguyên công ${idx + 1}`}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              {/* Máy Gia Công */}
              <div className="flex-[1.5] min-w-[200px]">
                <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Máy Gia Công
                </label>
                <select
                  value={matchedCncKey}
                  onChange={(e) => handleSelectMachineType(idx, e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-[#F0F0EE] text-[#111111] font-bold text-xs focus:outline-none"
                >
                  {cncMachineTypes.map((cnc) => (
                    <option key={cnc.key} value={cnc.key}>
                      {cnc.name} ({Math.round(cnc.ratePerHour / 1000)}k/h • {Math.round(cnc.ratePerMinute).toLocaleString('vi-VN')} đ/p)
                    </option>
                  ))}
                </select>
              </div>

              {/* Thời gian gia công */}
              <div className="w-[120px]">
                <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Gia Công (Phút)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={op.t_man_min}
                    onChange={(e) => onUpdateOp(idx, { ...op, t_man_min: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
              </div>

              {/* Thời gian gá lắp */}
              <div className="w-[120px]">
                <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Gá Lắp (Phút)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={op.t_prep_min}
                    onChange={(e) => onUpdateOp(idx, { ...op, t_prep_min: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] text-xs focus:outline-none focus:border-[#111111] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Cột phải: Phép tính & Kết quả */}
            <div className="flex items-center justify-end gap-3 min-w-[150px]">
              <div className="text-right">
                <p className="text-[10px] font-mono font-medium text-[#787774] mb-1">
                  ({op.t_man_min}+{op.t_prep_min})×{ratePerMin}
                </p>
                <p className="font-mono font-extrabold text-[#111111] text-sm">
                  {Math.round(opCost).toLocaleString('vi-VN')} <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#787774]">VNĐ</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveOp(idx)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end mb-0.5 cursor-pointer"
                title="Xóa công đoạn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Ghi chú chung */}
      <div className="pt-2">
        <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
          Ghi Chú Gia Công (Chung)
        </label>
        <textarea
          value={machiningNotes || ''}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Ví dụ: Cần mua dao khoét đặc biệt, Cần mượn gá lắp từ khách hàng..."
          className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-[13px] h-20 resize-none focus:outline-none focus:border-[#111111]"
        />
      </div>
    </div>
  );

  return (
    <CostSectionCard
      icon={<Cpu className="w-5 h-5" />}
      title="SECTION 3: GIA CÔNG CƠ KHÍ (CNC OPS)"
      mainBlockTitle="Danh Sách Các Nguyên Công"
      mainBlockHeaderRight={
        <button
          type="button"
          onClick={handleAddDefaultOp}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nguyên công</span>
        </button>
      }
      mainRightContent={rightContent}
      footerTitle="TỔNG CHI PHÍ GIA CÔNG (PHẦN C)"
      footerSubtitle="= Tổng chi phí các nguyên công cộng lại"
      footerTotal={Math.round(totalMachiningCost).toLocaleString('vi-VN')}
      footerTotalUnit="VNĐ/SP"
    />
  );
};
