'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const icons = { success: CheckCircle, error: AlertCircle, info: Info };

const colors = {
  success: 'bg-gum-green/10 border-gum-green text-gum-green',
  error: 'bg-gum-coral/10 border-gum-coral text-gum-coral',
  info: 'bg-gum-blue/10 border-gum-blue text-gum-blue',
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <ToastItem key={toast.id} id={toast.id} type={toast.type} message={toast.message} Icon={Icon} onRemove={removeToast} />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ id, type, message, Icon, onRemove }: {
  id: string; type: 'success' | 'error' | 'info'; message: string;
  Icon: React.ComponentType<{ className?: string }>; onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 min-w-[300px]',
        'border-3 border-gum-black shadow-brutal bg-bg-card',
        colors[type]
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm text-gum-black font-body font-medium flex-1">{message}</span>
      <button onClick={() => onRemove(id)} className="text-text-muted hover:text-gum-black"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}
