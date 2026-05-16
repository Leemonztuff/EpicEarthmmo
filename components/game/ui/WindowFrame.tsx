import React from 'react';
import { X } from 'lucide-react';

export function WindowFrame({ title, onClose, children, style }: { title: string, onClose: () => void, children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div className="absolute bg-slate-200 border-2 border-slate-400 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] rounded-t-sm pointer-events-auto flex flex-col" style={style}>
      <div className="h-7 bg-gradient-to-b from-blue-700 to-blue-900 border-b border-slate-400 flex items-center justify-between px-2 cursor-pointer">
         <span className="text-xs font-bold text-white drop-shadow-sm uppercase">{title}</span>
         <button onClick={onClose} className="text-white hover:text-red-400 flex items-center justify-center w-10 h-10 -mr-1 touch-manipulation">
            <X size={16} strokeWidth={3} />
          </button>
      </div>
      <div className="p-2 border-x-2 border-b-2 border-slate-400 border-t-0 bg-slate-100 flex-1 overflow-y-auto text-xs font-mono text-slate-800 flex flex-col gap-2">
         {children}
      </div>
    </div>
  )
}
