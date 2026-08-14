import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { FileText, AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((res) => {
      setOptions(opts);
      setResolve(() => res);
    });
  }, []);

  const handleClose = useCallback(() => {
    if (resolve) resolve(false);
    setOptions(null);
    setResolve(null);
  }, [resolve]);

  const handleConfirm = useCallback(() => {
    if (resolve) resolve(true);
    setOptions(null);
    setResolve(null);
  }, [resolve]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <Modal
          isOpen={true}
          onClose={handleClose}
          size="sm"
          icon={
            options.variant === 'danger'
              ? <AlertTriangle className="w-5 h-5 text-[#9F2F2D]" />
              : <FileText className="w-5 h-5 text-[#111111]" />
          }
          title={options.title || 'Xác nhận'}
          footer={
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-[#F0F0EE] hover:bg-[#E0E0DE] text-[#111111] font-semibold rounded-[6px] cursor-pointer"
              >
                {options.cancelLabel || 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-1.5 font-bold rounded-[6px] inline-flex items-center space-x-1 cursor-pointer ${
                  options.variant === 'danger'
                    ? 'bg-[#9F2F2D] hover:bg-[#7A2422] text-white'
                    : 'bg-[#111111] hover:bg-[#333333] text-white'
                }`}
              >
                <span>{options.confirmLabel || 'Xác nhận'}</span>
              </button>
            </>
          }
        >
          <div className="text-sm text-[#333333] whitespace-pre-wrap leading-relaxed">
            {options.message}
          </div>
        </Modal>
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context.confirm;
};
