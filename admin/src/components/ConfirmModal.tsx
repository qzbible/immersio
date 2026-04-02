import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmer", 
  cancelText = "Annuler",
  type = 'warning' 
}: ConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="relative bg-admin-card border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${
                  type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                  type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-admin-accent/10 text-admin-accent'
                }`}>
                  {type === 'danger' ? <Trash2 size={24} /> : 
                   type === 'warning' ? <AlertTriangle size={24} /> : 
                   <HelpCircle size={24} />}
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/20 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">{title}</h3>
              <p className="text-sm font-bold text-white/40 leading-relaxed mb-8">{message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                    type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' : 
                    type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 
                    'bg-admin-accent hover:bg-admin-accent/80 text-white shadow-admin-accent/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
