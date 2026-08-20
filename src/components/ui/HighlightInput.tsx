import React from 'react';

interface HighlightInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: number | string | undefined;
  isRequired?: boolean;
  hasError?: boolean;
}

export const HighlightInput: React.FC<HighlightInputProps> = ({ 
  value, 
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
    <div className="relative inline-flex flex-col items-end">
      {isEmpty && !hasError && (
        <span className="absolute -top-3.5 right-0 text-[8px] font-bold text-amber-600 px-1 whitespace-nowrap pointer-events-none">
          Bắt buộc nhập
        </span>
      )}
      <input
        {...props}
        value={value ?? ''}
        className={`${baseClasses} ${stateClasses} ${className}`}
      />
    </div>
  );
};

