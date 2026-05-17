'use client';

import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  subtitle?: string;
}

export function BottomSheet({ title, onClose, children, subtitle }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg max-h-[70dvh] bg-slate-900/95 backdrop-blur-md border-t border-slate-700/60 rounded-t-2xl shadow-2xl pointer-events-auto flex flex-col animate-slide-up"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
          <div>
            <h2 className="text-white font-bold text-base">{title}</h2>
            {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 touch-manipulation active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
        <div className="h-1 bg-slate-700/40 mx-auto rounded-full w-10 mb-2" />
      </div>
    </div>
  );
}
