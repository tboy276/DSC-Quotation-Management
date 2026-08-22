import { NumberTextInput } from './NumberTextInput';
interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

export const SliderInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  unit = '%',
  description,
}: SliderInputProps) => {
  return (
    <div className="space-y-1.5 p-3 rounded-[8px] border border-[#EAEAEA] bg-white">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#111111] uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center space-x-1">
          <NumberTextInput
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e)}
            className="w-16 px-2 py-0.5 border border-[#EAEAEA] rounded-[4px] text-right font-mono font-bold text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
          />
          <span className="text-xs font-mono text-[#787774]">{unit}</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#F0F0EE] rounded-lg appearance-none cursor-pointer accent-[#111111]"
      />

      {description && <p className="text-[10px] text-[#787774]">{description}</p>}
    </div>
  );
};
