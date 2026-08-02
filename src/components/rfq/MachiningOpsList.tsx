import type { MachiningOperation } from '../../lib/calculation-engine/types';
import { INITIAL_SYSTEM_RATES } from '../../lib/master-data-service';
import { Plus, Trash2, Cpu } from 'lucide-react';

interface MachiningOpsListProps {
  operations: MachiningOperation[];
  onAddOp: (op: MachiningOperation) => void;
  onUpdateOp: (index: number, op: MachiningOperation) => void;
  onRemoveOp: (index: number) => void;
}

export const MachiningOpsList = ({
  operations,
  onAddOp,
  onUpdateOp,
  onRemoveOp,
}: MachiningOpsListProps) => {
  const cncMachineTypes = [
    { key: 'cnc_turning', name: 'Máy Tiện CNC', ratePerMinute: 3500 },
    { key: 'cnc_milling', name: 'Máy Phay CNC (3-5 trục)', ratePerMinute: 4500 },
    { key: 'cnc_drilling', name: 'Máy Khoan / Taro CNC', ratePerMinute: 3000 },
    { key: 'cnc_grinding', name: 'Máy Mài Tròn / Mài Phẳng', ratePerMinute: 4000 },
    { key: 'cnc_broaching', name: 'Máy Chuốt / Xọc Răng', ratePerMinute: 5000 },
  ];

  const handleAddDefaultOp = () => {
    const defaultType = cncMachineTypes[0];
    const systemRateObj = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === defaultType.key);
    const hourlyRate = (systemRateObj?.value || defaultType.ratePerMinute) * 60;

    onAddOp({
      name: defaultType.name,
      t_prep_min: 10,
      t_man_min: 2.0,
      DG_machine_hour: hourlyRate,
      C_tooling: 1500,
    });
  };

  const handleSelectMachineType = (index: number, key: string) => {
    const cncObj = cncMachineTypes.find((c) => c.key === key);
    const systemRateObj = INITIAL_SYSTEM_RATES.find((r) => r.rate_key === key);

    if (cncObj) {
      const ratePerMin = systemRateObj?.value || cncObj.ratePerMinute;
      const currentOp = operations[index];
      onUpdateOp(index, {
        ...currentOp,
        name: cncObj.name,
        DG_machine_hour: ratePerMin * 60,
      });
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-[10px] border border-[#EAEAEA] bg-white">
      <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2.5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#111111] stroke-[1.75]" />
          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Danh Mục Nguyên Công Gia Công Cơ Khí (CNC Ops)
          </h4>
        </div>
        <button
          type="button"
          onClick={handleAddDefaultOp}
          className="flex items-center space-x-1 px-2.5 py-1 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[5px] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Thêm công đoạn</span>
        </button>
      </div>

      {operations.length === 0 ? (
        <p className="text-xs text-[#787774] italic py-2 text-center">
          Chưa có nguyên công gia công nào. Nhấp "+ Thêm công đoạn" để chọn máy CNC.
        </p>
      ) : (
        <div className="space-y-2.5">
          {operations.map((op, idx) => {
            const matchedCncKey = cncMachineTypes.find((c) =>
              op.name?.includes('Tiện') ? c.key === 'cnc_turning' :
              op.name?.includes('Phay') ? c.key === 'cnc_milling' :
              op.name?.includes('Khoan') ? c.key === 'cnc_drilling' :
              op.name?.includes('Mài') ? c.key === 'cnc_grinding' :
              op.name?.includes('Chuốt') ? c.key === 'cnc_broaching' : false
            )?.key || 'cnc_turning';

            return (
              <div
                key={idx}
                className="p-3 rounded-[6px] border border-[#EAEAEA] bg-[#FBFBFA] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    {/* Machine Type Selection Dropdown */}
                    <select
                      value={matchedCncKey}
                      onChange={(e) => handleSelectMachineType(idx, e.target.value)}
                      className="flex-1 px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs focus:outline-none"
                    >
                      {cncMachineTypes.map((cnc) => (
                        <option key={cnc.key} value={cnc.key}>
                          {cnc.name} ({(cnc.ratePerMinute).toLocaleString('vi-VN')} VNĐ/phút)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveOp(idx)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                    title="Xóa công đoạn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Operation Details Input Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                      t_prep (Chuẩn bị / Gá đặt - Phút)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={op.t_prep_min}
                      onChange={(e) =>
                        onUpdateOp(idx, { ...op, t_prep_min: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-xs text-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                      t_man (Thời gian máy / SP - Phút)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={op.t_man_min}
                      onChange={(e) =>
                        onUpdateOp(idx, { ...op, t_man_min: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono font-bold text-xs text-[#111111]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#787774] mb-0.5">
                      C_tooling (Dao cụ / SP - VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={op.C_tooling}
                      onChange={(e) =>
                        onUpdateOp(idx, { ...op, C_tooling: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-[#EAEAEA] rounded-[4px] bg-white font-mono font-bold text-xs text-[#111111]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
