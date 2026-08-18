import React from 'react';
import { Tooltip } from './Tooltip';

export interface ActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  variant: 'neutral' | 'positive' | 'danger' | 'primary';
  size?: 'sm' | 'md';
  icon?: React.ElementType | React.ReactElement | React.ReactNode | any;
  iconPosition?: 'left' | 'right';
  label?: string;
  disabledReason?: string;
  title?: string;
  group?: 'crud' | 'business';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  size = 'md',
  icon,
  iconPosition = 'left',
  label,
  disabledReason,
  className = '',
  title,
  group,
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
  const useTooltip = !label && finalTitle;

  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5 stroke-[2]' : 'w-4 h-4 stroke-[2]';

  const renderedIcon = icon ? (
    React.isValidElement(icon) ? (
      React.cloneElement(icon as React.ReactElement, {
        className: `${(icon as any).props?.className || ''} ${iconClasses}`.trim()
      } as any)
    ) : (
      React.createElement(icon as React.ElementType, {
        className: iconClasses,
      })
    )
  ) : null;

  const buttonElement = (
    <button
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {iconPosition === 'left' && renderedIcon}
      {label && <span>{label}</span>}
      {iconPosition === 'right' && renderedIcon}
    </button>
  );

  if (useTooltip) {
    return <Tooltip content={finalTitle}>{buttonElement}</Tooltip>;
  }

  // Still use standard title if there's a label but we want to show extra info
  if (finalTitle && label) {
    return React.cloneElement(buttonElement, { title: finalTitle } as any);
  }

  return buttonElement;
};
