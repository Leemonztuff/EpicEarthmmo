'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/cn';
import { X, Minus, ChevronUp } from 'lucide-react';
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

// Global active z-index counter to manage window layering on desktop
let globalZIndexCounter = 50;

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
  const [isMobile, setIsMobile] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [zIndex, setZIndex] = useState(50);
  const windowRef = useRef<HTMLDivElement>(null);

  // Detect mobile vs desktop screen sizes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard handler for closing with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bring window to front on click (desktop only)
  const bringToFront = () => {
    if (!isMobile) {
      globalZIndexCounter += 1;
      setZIndex(globalZIndexCounter);
    }
  };

  const sizeClasses = {
    sm: 'w-full max-w-sm sm:max-w-md md:max-w-sm',
    md: 'w-full max-w-md lg:max-w-lg',
    lg: 'w-full max-w-lg lg:max-w-2xl',
    full: 'w-full',
  };

  // Drag constraints on mobile (Framer Motion gesture handle swipe down to close)
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 150 || info.velocity.y > 400) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // MOBILE: Swipeable bottom sheet
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
            {/* Backdrop: Only captures clicks, allows game rendering behind */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
              onClick={onClose}
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 400 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className={cn(
                'relative w-full max-h-[85vh] ro-window-panel rounded-t-[2.5rem] pointer-events-auto flex flex-col overflow-hidden shadow-2xl ro-double-border select-none border-b-0 pb-safe',
                className
              )}
            >
              {/* Touch Drag Handle Bar */}
              <div className="w-full py-2 flex flex-col items-center justify-center cursor-row-resize flex-shrink-0">
                <div className="ro-drag-handle-bar" />
              </div>

              {/* Title & Actions */}
              {title && (
                <div className="flex items-center justify-between px-6 pb-2 pt-1 border-b border-white/5 bg-slate-950/20">
                  <div>
                    <h2 className="text-white font-black text-lg tracking-tight uppercase">{title}</h2>
                    {subtitle && <p className="text-slate-400 text-[9px] font-bold tracking-wider uppercase opacity-70 mt-0.5">{subtitle}</p>}
                  </div>
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all cursor-pointer shadow-lg"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Scrollable Panel Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-4 pb-10">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  // DESKTOP: Draggable, minimizable, non-blocking window
  return (
    <div
      onClick={bringToFront}
      onMouseDown={bringToFront}
      style={{ zIndex }}
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
    >
      {/* Container wraps window but DOES NOT prevent click-throughs to 3D canvas behind */}
      <motion.div
        ref={windowRef}
        drag
        dragMomentum={false}
        dragElastic={0}
        dragHandleClassName="ro-drag-handle"
        initial={position === 'bottom' ? { y: 200, opacity: 0 } : { scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 220 }}
        className={cn(
          'absolute pointer-events-auto ro-window-panel rounded-2xl flex flex-col shadow-2xl ro-double-border overflow-hidden select-none border border-slate-800',
          sizeClasses[size],
          isMinimized ? 'h-auto max-h-[46px]' : 'max-h-[80vh] min-h-[250px]',
          className
        )}
      >
        {/* RO Blue Metallic Titlebar */}
        <div
          onDoubleClick={() => setIsMinimized(!isMinimized)}
          className="ro-drag-handle ro-window-header flex items-center justify-between px-4 py-2 cursor-move flex-shrink-0 h-[44px]"
        >
          <div className="flex flex-col select-none">
            <h2 className="ro-window-title text-sm tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {title || 'Window'}
            </h2>
            {subtitle && !isMinimized && (
              <span className="text-[9px] text-slate-200/70 font-semibold tracking-tighter -mt-0.5 leading-none">
                {subtitle}
              </span>
            )}
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Minimize Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              title={isMinimized ? 'Expand' : 'Minimize'}
              className="w-6 h-6 rounded bg-slate-950/40 border border-slate-900/60 hover:bg-slate-950/70 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              {isMinimized ? <ChevronUp size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
            </button>

            {/* Close Button */}
            {showClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                title="Close"
                className="w-6 h-6 rounded bg-red-950/40 border border-red-950/60 hover:bg-red-700/80 flex items-center justify-center text-red-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Content (only shown when maximized) */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-4"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
