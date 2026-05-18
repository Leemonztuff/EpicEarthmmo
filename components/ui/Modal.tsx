import React, { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'w-full',
  };

  const positionClasses = {
    center: 'items-center justify-center p-4',
    bottom: 'items-end justify-center',
  };

  const contentClasses = {
    center: 'rounded-2xl',
    bottom: 'rounded-t-3xl w-full',
  };

  const animationVariants = {
    center: {
      initial: { opacity: 0, scale: 0.95, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 10 },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn(
          'fixed inset-0 z-50 flex pointer-events-none',
          positionClasses[position]
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            variants={animationVariants[position]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative bg-slate-900/95 border border-slate-700/60 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col overflow-hidden',
              sizeClasses[size],
              contentClasses[position],
              position === 'bottom' ? 'max-h-[85dvh]' : 'max-h-[90dvh]',
              className
            )}
          >
            {position === 'bottom' && (
              <div className="w-12 h-1.5 bg-slate-700/60 mx-auto rounded-full mt-3 mb-1 flex-shrink-0" />
            )}

            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-slate-900/50">
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">{title}</h2>
                  {subtitle && <p className="text-slate-400 text-xs font-medium mt-0.5">{subtitle}</p>}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-90 transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            <div className={cn('flex-1 overflow-y-auto custom-scrollbar', !title && 'pt-4')}>
              <div className={cn('px-5 pb-6', title ? 'pt-2' : '')}>
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
