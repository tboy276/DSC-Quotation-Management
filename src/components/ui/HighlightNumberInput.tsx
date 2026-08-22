import React from 'react';
import { NumberTextInput } from './NumberTextInput';

interface HighlightNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | undefined;
  onChange: (value: number) => void;
  allowEmpty?: boolean;
  isRequired?: boolean;
  hasError?: boolean;
}

export const HighlightNumberInput: React.FC<HighlightNumberInputProps> = ({ 
  value, 
  onChange,
  allowEmpty = false,
  isRequired = true, 
  hasError = false,
  className = '', 
  ...props 
}) => {
  const isEmpty = isRequired && (!value || Number(value) === 0);
  
  const baseClasses = "w-20 px-2 py-1 rounded-[4px] font-mono text-xs font-bold text-right outline-none transition-colors";
  
  let stateClasses = "border border-[#EAEAEA] bg-white text-[#111111]";
  if (hasError) {
    stateClasses = "border border-red-500 bg-red-50 text-red-700";
  } else if (isEmpty) {
    stateClasses = "border border-amber-400 bg-amber-50 text-amber-900";
  }

  return (
    <NumberTextInput
      {...props}
      value={value}
      onChange={onChange}
      allowEmpty={allowEmpty}
      className={`${baseClasses} ${stateClasses} ${className}`}
    />
  );
};