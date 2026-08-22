import { useState, useEffect, useRef } from 'react';
import { parseFlexibleNumber } from '../../lib/parse-flexible-number';

interface NumberTextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | undefined;
  onChange: (value: number) => void;
  allowEmpty?: boolean; // Nếu true, cho phép rỗng -> onChange(NaN) khi xoá hết, để component cha tự quyết định giá trị mặc định
}

export function NumberTextInput({ value, onChange, allowEmpty = false, className, ...rest }: NumberTextInputProps) {
  const [raw, setRaw] = useState<string>(value !== undefined && !Number.isNaN(value) ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  // Chỉ đồng bộ lại từ prop value khi KHÔNG đang focus (tránh giật/mất ký tự đang gõ dở)
  useEffect(() => {
    if (!isFocused.current) {
      setRaw(value !== undefined && !Number.isNaN(value) ? String(value) : '');
    }
  }, [value]);

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className={className}
      value={raw}
      onFocus={(e) => {
        isFocused.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setRaw(v);
        const parsed = parseFlexibleNumber(v);
        if (!Number.isNaN(parsed)) {
          onChange(parsed);
        } else if (allowEmpty && v === '') {
          onChange(NaN);
        }
      }}
      onBlur={(e) => {
        isFocused.current = false;
        // Khi rời ô, chuẩn hoá lại chuỗi hiển thị theo giá trị số đã parse (VD "12," -> "12")
        const parsed = parseFlexibleNumber(raw);
        setRaw(!Number.isNaN(parsed) ? String(parsed) : '');
        rest.onBlur?.(e);
      }}
    />
  );
}