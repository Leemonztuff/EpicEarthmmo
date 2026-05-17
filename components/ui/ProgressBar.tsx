import React from 'react';
import { cn } from '@/lib/cn';

const barColors = {
  hp: 'from-green-500 to-green-600',
  sp: 'from-blue-500 to-blue-600',
  exp: 'from-yellow-400 to-yellow-500',
  jobExp: 'from-purple-400 to-purple-500',
  red: 'from-red-500 to-red-600',
  orange: 'from-orange-500 to-orange-600',
  cyan: 'from-cyan-400 to-cyan-500',
  pink: 'from-pink-400 to-pink-500',
};

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: keyof typeof barColors;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'hp',
  size = 'md',
  showLabel = true,
  label,
  className,
  animated = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  const heightClass = {
    sm: 'h-1',
    md: 'h-3',
    lg: 'h-4',
  }[size];

  const labelSize = {
    sm: 'text-[6px]',
    md: 'text-[8px]',
    lg: 'text-[10px]',
  }[size];

  const displayLabel = label ?? `${Math.ceil(value)}/${max}`;

  return (
    <div className={cn('relative bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50', heightClass, className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r',
          barColors[color],
          animated && 'transition-all duration-300'
        )}
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-white drop-shadow-md', labelSize)}>{displayLabel}</span>
        </div>
      )}
    </div>
  );
}

export function ThinBar({ value, max = 100, color = 'exp', className, animated = true }: Omit<ProgressBarProps, 'size' | 'showLabel'>) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-1 bg-slate-800/80 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r',
          barColors[color],
          animated && 'transition-all duration-300'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
