import React from 'react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'neutral' | 'positive' | 'danger' | 'primary';
  icon?: React.ElementType | React.ReactElement | React.ReactNode | any;
  iconPosition?: 'left' | 'right';
  label?: string;
  disabledReason?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  icon,
  iconPosition = 'left',
  label,
  disabledReason,
  className = '',
  title,
  ...props
}) => {
  let baseClasses =
    'inline-flex items-center justify-center p-2 rounded-[6px] transition-all cursor-pointer font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed';

  switch (variant) {
    case 'neutral':
      baseClasses += ' bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] border border-[#EAEAEA]';
      break;
    case 'positive':
      baseClasses += ' bg-[#EDF3EC] hover:bg-[#DDF0DC] text-[#346538] border border-[#C6E1C4]';
      break;
    case 'danger':
      baseClasses += ' bg-[#FDEBEC] hover:bg-[#F8C9CA] text-[#9F2F2D] border border-[#FADBDC]';
      break;
    case 'primary':
      baseClasses += ' bg-[#111111] hover:bg-[#333333] text-white shadow-xs';
      break;
  }

  // If label is present, we need horizontal padding
  if (label) {
    baseClasses += ' px-3.5 py-1.5 space-x-1.5';
  }

  const finalTitle = props.disabled && disabledReason ? disabledReason : title;

  const renderedIcon = icon ? (
    React.isValidElement(icon) ? (
      icon
    ) : (
      React.createElement(icon as React.ElementType, {
        className: 'w-4 h-4 stroke-[2]',
      })
    )
  ) : null;

  return (
    <button
      title={finalTitle}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {iconPosition === 'left' && renderedIcon}
      {label && <span>{label}</span>}
      {iconPosition === 'right' && renderedIcon}
    </button>
  );
};
