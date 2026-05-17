import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  variant = 'default',
  className,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/40',
    card: 'bg-slate-800/50 border-slate-700/40 rounded-xl',
    minimal: 'bg-transparent border-transparent',
  };

  return (
    <div className={cn('border overflow-hidden', variantClasses[variant], className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left touch-manipulation active:bg-slate-700/30 transition-colors"
      >
        <span className="text-white font-semibold text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      <div className={cn(
        'overflow-hidden transition-all duration-300',
        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}
