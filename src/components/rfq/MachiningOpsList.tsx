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

  // Helper to convert index to Roman numerals (I, II, III, IV...)
  const toRoman = (num: number): string => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
    return roman[num] || (num + 1).toString();
  };

  const rightContent = operations.length === 0 ? (
    <p className="text-xs text-[#787774] italic py-2 text-center">
      Chưa có nguyên công gia công nào. Nhấp "+ Thêm nguyên công" để chọn máy CNC.
    </p>
  ) : (
    <div className="space-y-4">
      {operations.map((op, idx) => {
        const matchedCncKey = cncMachineTypes.find((c) =>
          op.name?.includes('Tiện') ? c.key === 'cnc_turning' :
          op.name?.includes('Phay') ? c.key === 'cnc_milling' :
          op.name?.includes('Khoan') ? c.key === 'cnc_drilling' :
          op.name?.includes('Mài') ? c.key === 'cnc_grinding' :
          op.name?.includes('Chuốt') ? c.key === 'cnc_broaching' : false
        )?.key || 'cnc_turning';

        // Calculate cost for this specific op
        const opCost = (op.t_prep_min + op.t_man_min) * (op.DG_machine_hour / 60);

        return (
          <div
            key={idx}
            className="rounded-[6px] border border-[#EAEAEA] bg-[#FBFBFA] overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              {/* Cột trái: Nhập liệu */}
              <div className="w-full md:w-1/2 p-3 space-y-3 bg-white border-b md:border-b-0 md:border-r border-[#EAEAEA]">
                <div className="flex items-center space-x-2">
                  <span className="w-6 font-bold text-[#787774] text-[11px] flex-shrink-0">
                    {toRoman(idx)}.
                  </span>
                  <select
                    value={matchedCncKey}
                    onChange={(e) => handleSelectMachineType(idx, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs focus:outline-none"
                  >
                    {cncMachineTypes.map((cnc) => (
                      <option key={cnc.key} value={cnc.key}>
                        {cnc.name} ({(cnc.ratePerMinute).toLocaleString('vi-VN')} VNĐ/phút)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787774] mb-1">
                      T.Gian Gia Công (Phút)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={op.t_man_min}
                      onChange={(e) =>
                        onUpdateOp(idx, { ...op, t_man_min: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono font-bold text-xs text-[#111111]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787774] mb-1">
                      T.Gian Gá Lắp (Phút)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={op.t_prep_min}
                      onChange={(e) =>
                        onUpdateOp(idx, { ...op, t_prep_min: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono font-bold text-xs text-[#111111]"
                    />
                  </div>
                </div>
              </div>

              {/* Cột phải: Phép tính & Kết quả */}
              <div className="w-full md:w-1/2 p-3 flex flex-col justify-between bg-[#FBFBFA]">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider">Chi phí nguyên công</p>
                    <p className="text-[11px] font-mono text-[#333333]">
                      ({op.t_man_min}p + {op.t_prep_min}p) × {(op.DG_machine_hour / 60).toLocaleString('vi-VN')} đ
                    </p>
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
                
                <div className="text-right mt-3">
                  <span className="font-mono font-bold text-[#111111] text-sm">
                    {Math.round(opCost).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
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
          placeholder="Ví dụ: Cần mua dao khoả đặc biệt, Cần mượn gá lắp từ khách hàng..."
          className="w-full px-3 py-2 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-mono text-[13px] h-20 resize-none focus:outline-none focus:border-[#111111]"
        />
      </div>

      <div className="border-t-2 border-[#111111] pt-3 flex flex-wrap gap-2 justify-between items-center font-mono">
        <span className="text-[13px] font-bold text-[#111111] uppercase font-sans">
          Tổng Chi Phí Gia Công / SP:
        </span>
        <span className="font-extrabold text-[#38517A] text-[15px]">
          {Math.round(totalMachiningCost).toLocaleString('vi-VN')} VNĐ
        </span>
      </div>
    </div>
  );

  return (
    <CostSectionCard
      icon={<Cpu className="w-5 h-5" />}
      title="SECTION 3: GIA CÔNG CƠ KHÍ (CNC OPS)"
      mainBlockTitle="Danh Sách Các Nguyên Công"
      mainLeftContent={
        <div>
          <button
            type="button"
            onClick={handleAddDefaultOp}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#111111] hover:bg-[#333333] active:scale-[0.98] text-white text-xs font-bold rounded-[4px] transition-all cursor-pointer shadow-sm w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm nguyên công</span>
          </button>
        </div>
      }
      mainRightContent={rightContent}
      footerTitle="Tổng Đơn Giá Gia Công (Phần C)"
      footerSubtitle="= Tổng chi phí các nguyên công cộng lại"
      footerTotal={Math.round(totalMachiningCost).toLocaleString('vi-VN')}
      footerTotalUnit="VNĐ/SP"
    />
  );
};
