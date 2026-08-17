import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-[#EDF3EC] border-[#C6E1C4] text-[#346538]',
          icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
        };
      case 'error':
        return {
          container: 'bg-[#FDEBEC] border-[#FADBDC] text-[#9F2F2D]',
          icon: <XCircle className="w-4 h-4 flex-shrink-0" />,
        };
      case 'info':
        return {
          container: 'bg-[#F0F0EE] border-[#EAEAEA] text-[#111111]',
          icon: <Info className="w-4 h-4 flex-shrink-0" />,
        };
    }
  };

  const styles = getStyles(toast.type);

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-2 border rounded-[8px] px-3 py-2.5 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.03)] animate-fade-in-up w-80 max-w-[calc(100vw-2rem)] ${styles.container}`}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1 whitespace-pre-wrap break-words">{toast.message}</div>
      <button
        onClick={onRemove}
        className="mt-0.5 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
