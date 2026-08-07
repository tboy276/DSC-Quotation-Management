import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  maxWidthClass?: string;
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerExtra,
  children,
  footer,
  size = 'xl',
  maxWidthClass,
  hideHeader = false,
}) => {
  // Prevent background body scroll & support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl', // ~1024px
    '2xl': 'max-w-6xl', // ~1152px
    full: 'max-w-[95vw]',
  };

  const chosenWidth = maxWidthClass || sizeClasses[size] || 'max-w-5xl';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in-up">
      <div className={`bg-white rounded-[12px] border border-[#EAEAEA] shadow-2xl w-full ${chosenWidth} max-h-[88vh] flex flex-col overflow-hidden text-xs text-[#111111] animate-modal-scale-in`}>
        {/* Fixed Header */}
        {!hideHeader && (title || icon || headerExtra) && (
          <div className="flex items-center justify-between border-b border-[#EAEAEA] p-4 bg-white shrink-0">
            <div className="flex items-center space-x-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-[6px] bg-[#111111] text-white flex items-center justify-center font-bold shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {typeof title === 'string' ? (
                  <h3 className="text-sm font-bold text-[#111111] leading-snug">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-[10px] text-[#787774] mt-0.5">{subtitle}</div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                className="text-[#787774] hover:text-[#111111] p-1 rounded-md cursor-pointer transition-colors"
                title="Đóng cửa sổ (Esc)"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>

        {/* Fixed Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-2 p-4 border-t border-[#EAEAEA] bg-[#FBFBFA] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
