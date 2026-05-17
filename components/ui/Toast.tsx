import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

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
  success: 'border-green-500/60 bg-green-900/80',
  error: 'border-red-500/60 bg-red-900/80',
  info: 'border-blue-500/60 bg-blue-900/80',
  warning: 'border-yellow-500/60 bg-yellow-900/80',
};

const toastIconColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
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

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {currentToasts.map(toast => {
        const Icon = toastIcons[toast.type ?? 'info'];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm animate-slide-down',
              toastColors[toast.type ?? 'info']
            )}
          >
            <Icon size={18} className={cn('flex-shrink-0', toastIconColors[toast.type ?? 'info'])} />
            <span className="text-white text-sm flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 touch-manipulation active:scale-95 transition-all flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
