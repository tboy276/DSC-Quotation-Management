import type { MachiningOperation } from '../../lib/calculation-engine/types';
import { INITIAL_SYSTEM_RATES } from '../../lib/master-data-service';
import type { SystemUnitRate } from '../../types/master-data';
import { Plus, Trash2, Cpu, Lock } from 'lucide-react';
import { CostSectionCard } from '../ui/CostSectionCard';
import { ActionButton } from '../ui/ActionButton';
import { NumberTextInput } from '../../components/ui/NumberTextInput';


export interface SawingOpProps {
  t_cut_sec: number;
  DG_sawing_machine_hour: number;
  sawing_machine_type?: string;
  onUpdateSawingOp: (t_cut_sec: number, DG_sawing_machine_hour: number, sawing_machine_type?: string) => void;
  C_ops_sawing: number;
}

interface MachiningOpsListProps {
  operations: MachiningOperation[];
  totalMachiningCost: number;
  machiningNotes?: string;
  onAddOp: (op: MachiningOperation) => void;
  onUpdateOp: (index: number, op: MachiningOperation) => void;
  onRemoveOp: (index: number) => void;
  onUpdateNotes: (notes: string) => void;
  sawingOpProps?: SawingOpProps;
  systemRates?: SystemUnitRate[];
}

export const MachiningOpsList = ({
  operations,
  totalMachiningCost,
  machiningNotes,
  onAddOp,
  onUpdateOp,
  onRemoveOp,
  onUpdateNotes,
  sawingOpProps,
  systemRates = INITIAL_SYSTEM_RATES,
}: MachiningOpsListProps) => {
  const cncMachineTypes = [
    { key: 'cnc_type_1', name: 'Loại I: TT Gia công tổ hợp, ngang, đứng', ratePerHour: 390000, ratePerMinute: 6500 },
    { key: 'cnc_type_2', name: 'Loại II: Máy tiện đứng, phay 3 trục,...', ratePerHour: 338000, ratePerMinute: 338000 / 60 },
    { key: 'cnc_type_3', name: 'Loại III: Máy tiện, phay CNC', ratePerHour: 234000, ratePerMinute: 3900 },
    { key: 'cnc_type_4', name: 'Loại IV: Máy khoan cần, máy cũ,..', ratePerHour: 182000, ratePerMinute: 182000 / 60 },
  ];

  const bandSawRate = systemRates.find((r) => r.rate_key === 'sawing_machine')?.value || 120000;
  const trimmingRate = systemRates.find((r) => r.rate_key === 'trimming_machine')?.value || 180000;

  const handleAddDefaultOp = () => {
    const defaultType = cncMachineTypes[2]; // Default to Loại III: Máy tiện, phay CNC
    const systemRateObj = systemRates.find((r) => r.rate_key === defaultType.key);
    const hourlyRate = systemRateObj?.value || defaultType.ratePerHour;

    const opNum = sawingOpProps ? operations.length + 2 : operations.length + 1;
    onAddOp({
      name: `Nguyên công ${opNum}`,
      t_prep_min: 2.0,
      t_man_min: 3.0,
      DG_machine_hour: hourlyRate,
    });
  };

  const handleSelectMachineType = (index: number, key: string) => {
    const cncObj = cncMachineTypes.find((c) => c.key === key);
    const systemRateObj = systemRates.find((r) => r.rate_key === key);

    if (cncObj) {
      const hourlyRate = systemRateObj?.value || cncObj.ratePerHour;
      const currentOp = operations[index];
      onUpdateOp(index, {
        ...currentOp,
        DG_machine_hour: hourlyRate,
      });
    }
  };

  const currentSawingMachineType = sawingOpProps?.sawing_machine_type || (sawingOpProps?.DG_sawing_machine_hour === trimmingRate ? 'punch_cut' : 'band_saw');

  const rightContent = (operations.length === 0 && !sawingOpProps) ? (
    <p className="text-xs text-[#787774] italic py-2 text-center">
      Chưa có nguyên công gia công nào. Nhấp "+ Thêm nguyên công" để chọn nhóm máy CNC.
    </p>
  ) : (
    <div className="space-y-3">
      {/* Locked First Operation for Sawing if present */}
      {sawingOpProps && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 p-4 rounded-[6px] border border-[#EAEAEA] bg-[#FBFBFA] text-xs">
          <div className="flex flex-wrap gap-4 flex-1">
            {/* 1. Tên Nguyên Công */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Tên Nguyên Công
              </label>
              <input
                type="text"
                value="Cắt phôi cưa"
                readOnly
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-[#F0F0EE] text-[#111111] font-bold text-xs cursor-not-allowed"
              />
            </div>

            {/* 2. Máy Gia Công (Dropdown từ Master Data) */}
            <div className="flex-[1.5] min-w-[200px]">
              <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Máy Gia Công
              </label>
              <select
                value={currentSawingMachineType}
                onChange={(e) => {
                  const newType = e.target.value;
                  const rate = newType === 'punch_cut' ? trimmingRate : bandSawRate;
                  sawingOpProps.onUpdateSawingOp(sawingOpProps.t_cut_sec, rate, newType);
                }}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-[#F0F0EE] text-[#111111] font-bold text-xs focus:outline-none"
              >
                <option value="band_saw">
                  Máy cưa vòng ({Math.round(bandSawRate / 1000)}k/h • {Math.round(bandSawRate / 60).toLocaleString('vi-VN')} đ/p)
                </option>
                <option value="punch_cut">
                  Máy cắt đột ({Math.round(trimmingRate / 1000)}k/h • {Math.round(trimmingRate / 60).toLocaleString('vi-VN')} đ/p)
                </option>
              </select>
            </div>

            {/* 3. Thời Gian Cắt (Giây) */}
            <div className="w-[140px]">
              <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                Thời Gian Cắt (Giây)
              </label>
              <NumberTextInput
                min="0"
                value={sawingOpProps.t_cut_sec}
                onChange={(e) => sawingOpProps.onUpdateSawingOp(Math.max(0, e), sawingOpProps.DG_sawing_machine_hour, currentSawingMachineType)}
                className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white font-mono text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* 4. Kết quả (Cột Phải) */}
          <div className="flex items-center justify-end gap-3 min-w-[150px]">
            <div className="text-right">
              <p className="text-[10px] font-mono font-medium text-[#787774] mb-1">
                ({sawingOpProps.t_cut_sec}s ÷ 3600) × {Math.round(sawingOpProps.DG_sawing_machine_hour / 1000)}k
              </p>
              <p className="font-mono font-extrabold text-[#111111] text-sm">
                {Math.round(sawingOpProps.C_ops_sawing).toLocaleString('vi-VN')} <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#787774]">VNĐ</span>
              </p>
            </div>
            <button
              type="button"
              disabled
              className="p-1.5 text-[#787774] cursor-not-allowed rounded opacity-50 self-end mb-0.5"
              title="Nguyên công cắt phôi bắt buộc (Không thể xóa)"
            >
              <Lock className="w-4 h-4 text-[#787774]" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic CNC operations */}
      {operations.map((op, idx) => {
        // Find matching CNC type based on rate, or default to Loại III
        const matchedCncKey = cncMachineTypes.find((c) => {
          const sysRate = INITIAL_SYSTEM_RATES.find(r => r.rate_key === c.key)?.value || c.ratePerHour;
          return sysRate === op.DG_machine_hour;
        })?.key || 'cnc_type_3';
        const actualRatePerMin = op.DG_machine_hour / 60;
        const ratePerMin = actualRatePerMin >= 1000 ? `${Math.round(actualRatePerMin / 1000)}k` : Math.round(actualRatePerMin);

        // Calculate cost for this specific op
        const opCost = ((op.t_prep_min || 0) + (op.t_man_min || 0)) * (op.DG_machine_hour / 60);
        const opDisplayNum = sawingOpProps ? idx + 2 : idx + 1;

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
                  placeholder={`Nguyên công ${opDisplayNum}`}
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
                  className="w-full px-2.5 py-1.5 border border-[#EAEAEA] rounded-[4px] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:border-[#111111]"
                >
                  {cncMachineTypes.map((type) => {
                    const rateObj = systemRates.find((r) => r.rate_key === type.key);
                    const ratePerHour = rateObj?.value || type.ratePerHour;
                    const ratePerMinute = ratePerHour / 60;
                    return (
                      <option key={type.key} value={type.key}>
                        {type.name} ({Math.round(ratePerHour / 1000)}k/h • {Math.round(ratePerMinute).toLocaleString('vi-VN')} đ/p)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Thời gian gia công */}
              <div className="w-[120px]">
                <label className="block text-[9px] font-bold text-[#787774] uppercase tracking-wider mb-1.5">
                  Gia Công (Phút)
                </label>
                <div className="flex items-center">
                  <NumberTextInput
                    allowEmpty
                    min="0.1"
                    step="0.1"
                    value={op.t_man_min}
                    onChange={(v) => onUpdateOp(idx, { ...op, t_man_min: Number.isNaN(v) ? undefined : Math.max(0.1, v) })}
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
                  <NumberTextInput
                    min="0"
                    step="0.5"
                    value={op.t_prep_min}
                    onChange={(e) => onUpdateOp(idx, { ...op, t_prep_min: Number.isNaN(e) ? undefined : Math.max(0, e) })}
                    allowEmpty
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

  const grandTotalCost = sawingOpProps
    ? Math.round(sawingOpProps.C_ops_sawing + totalMachiningCost)
    : Math.round(totalMachiningCost);

  return (
    <CostSectionCard
      icon={<Cpu className="w-5 h-5" />}
      title={sawingOpProps ? "SECTION 3: QUY TRÌNH CẮT PHÔI & GIA CÔNG CƠ KHÍ" : "SECTION 3: GIA CÔNG CƠ KHÍ (CNC OPS)"}
      mainBlockTitle="Danh Sách Các Nguyên Công"
      mainBlockHeaderRight={
        <ActionButton
          type="button"
          onClick={handleAddDefaultOp}
          variant="primary"
          icon={Plus}
          label="Thêm nguyên công"
        />
      }
      mainRightContent={rightContent}
      footerTitle={sawingOpProps ? "TỔNG CHI PHÍ QUY TRÌNH CẮT & GIA CÔNG" : "TỔNG CHI PHÍ GIA CÔNG (PHẦN C)"}
      footerTotal={grandTotalCost.toLocaleString('vi-VN')}
      footerTotalUnit="VNĐ / CHI TIẾT"
      isFinalTotal={true}
    />
  );
};
