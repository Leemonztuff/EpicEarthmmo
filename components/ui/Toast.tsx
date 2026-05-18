'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const toastColors = {
  success: 'border-emerald-500/50 bg-emerald-950/90 shadow-emerald-900/20',
  error: 'border-red-500/50 bg-red-950/90 shadow-red-900/20',
  info: 'border-blue-500/50 bg-blue-950/90 shadow-blue-900/20',
  warning: 'border-amber-500/50 bg-amber-950/90 shadow-amber-900/20',
};

const toastIconColors = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
};

let toastId = 0;
const listeners: Set<() => void> = new Set();
let toasts: Toast[] = [];

export function showToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = `toast-${++toastId}`;
  toasts = [...toasts, { id, message, type, duration }];
  listeners.forEach(fn => fn());
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(fn => fn());
}

export function useToasts() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = () => setCurrentToasts([...toasts]);
    listeners.add(fn);
    setCurrentToasts([...toasts]);
    return () => { listeners.delete(fn); };
  }, []);

  return currentToasts;
}

export function ToastContainer() {
  const currentToasts = useToasts();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-[320px] px-4">
      <AnimatePresence mode="popLayout">
        {currentToasts.map((toast) => {
          const Icon = toastIcons[toast.type ?? 'info'];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl',
                toastColors[toast.type ?? 'info']
              )}
            >
              <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-black/20', toastIconColors[toast.type ?? 'info'])}>
                <Icon size={18} />
              </div>
              <span className="text-white text-[13px] font-bold flex-1 leading-tight">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
