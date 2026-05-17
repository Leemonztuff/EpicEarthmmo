import React from 'react';
import { cn } from '@/lib/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'w-px',
          variant === 'dashed' && 'border-l border-dashed',
          variant === 'dotted' && 'border-l border-dotted',
          variant === 'solid' && 'border-l',
          'border-slate-700/50',
          className
        )}
      />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn(
          'flex-1 h-px bg-slate-700/50',
          variant === 'dashed' && 'border-t border-dashed border-slate-700/50 bg-transparent',
          variant === 'dotted' && 'border-t border-dotted border-slate-700/50 bg-transparent',
        )} />
        <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">{label}</span>
        <div className={cn(
          'flex-1 h-px bg-slate-700/50',
          variant === 'dashed' && 'border-t border-dashed border-slate-700/50 bg-transparent',
          variant === 'dotted' && 'border-t border-dotted border-slate-700/50 bg-transparent',
        )} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-px bg-slate-700/50',
        variant === 'dashed' && 'border-t border-dashed border-slate-700/50 bg-transparent',
        variant === 'dotted' && 'border-t border-dotted border-slate-700/50 bg-transparent',
        className
      )}
    />
  );
}
