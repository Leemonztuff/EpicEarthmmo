import React, { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom';
  showClose?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  position = 'bottom',
  showClose = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'w-full',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    bottom: 'items-end justify-center',
  };

  const contentClasses = {
    center: 'rounded-2xl',
    bottom: 'rounded-t-2xl w-full',
  };

  return (
    <div className={cn(
      'fixed inset-0 z-40 flex pointer-events-none',
      positionClasses[position]
    )}>
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />
      <div
        className={cn(
          'relative bg-slate-900/95 backdrop-blur-md border border-slate-700/60 shadow-2xl pointer-events-auto flex flex-col',
          sizeClasses[size],
          contentClasses[position],
          position === 'bottom' && 'max-h-[70dvh]',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
            <div>
              <h2 className="text-white font-bold text-base">{title}</h2>
              {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 touch-manipulation active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto', title ? 'px-4 py-3' : '')}>
          {children}
        </div>
        {position === 'bottom' && (
          <div className="h-1 bg-slate-700/40 mx-auto rounded-full w-10 mb-2 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
