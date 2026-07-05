import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = {
              success: CheckCircle2,
              error: AlertCircle,
              info: Info,
            }[toast.type];

            const colors = {
              success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              error: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
              info: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl pointer-events-auto ${colors}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {toast.message}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
