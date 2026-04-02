import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const toast = {
  success: (msg: string) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'success' } })),
  error: (msg: string) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'error' } })),
  info: (msg: string) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'info' } })),
};

const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { message, type } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`
              pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[24px] shadow-2xl backdrop-blur-xl border border-white/10 min-w-[320px] max-w-[450px]
              ${t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : ''}
              ${t.type === 'error' ? 'bg-red-500/20 text-red-400' : ''}
              ${t.type === 'info' ? 'bg-admin-accent/20 text-admin-accent' : ''}
            `}
          >
            <div className={`p-2 rounded-xl ${t.type === 'success' ? 'bg-emerald-500/10' : t.type === 'error' ? 'bg-red-500/10' : 'bg-admin-accent/10'}`}>
              {t.type === 'success' && <CheckCircle size={20} />}
              {t.type === 'error' && <AlertCircle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            
            <p className="flex-1 text-sm font-bold tracking-tight leading-snug">{t.message}</p>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/20 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;
