import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

const barColors = {
  hp: 'from-emerald-500 via-emerald-400 to-emerald-500',
  sp: 'from-blue-500 via-blue-400 to-blue-500',
  exp: 'from-amber-400 via-yellow-300 to-amber-400',
  jobExp: 'from-purple-500 via-purple-400 to-purple-500',
  red: 'from-red-500 via-red-400 to-red-500',
  orange: 'from-orange-500 via-orange-400 to-orange-500',
  cyan: 'from-cyan-400 via-cyan-300 to-cyan-400',
  pink: 'from-pink-500 via-pink-400 to-pink-500',
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
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-5',
  }[size];

  const labelSize = {
    sm: 'text-[7px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
  }[size];

  const displayLabel = label ?? `${Math.ceil(value)}/${max}`;

  return (
    <div className={cn('relative bg-slate-950/60 rounded-full overflow-hidden border border-slate-700/30 p-[1px]', heightClass, className)}>
      <motion.div
        className={cn(
          'h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(0,0,0,0.2)]',
          barColors[color]
        )}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={animated ? { type: 'spring', damping: 20, stiffness: 100 } : { duration: 0 }}
      >
        <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
      </motion.div>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={cn('font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tight uppercase', labelSize)}>
            {displayLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function ThinBar({ value, max = 100, color = 'exp', className, animated = true }: Omit<ProgressBarProps, 'size' | 'showLabel'>) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-1.5 bg-slate-950/60 rounded-full overflow-hidden p-[0.5px]', className)}>
      <motion.div
        className={cn(
          'h-full rounded-full bg-gradient-to-r',
          barColors[color]
        )}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={animated ? { type: 'spring', damping: 20, stiffness: 100 } : { duration: 0 }}
      />
    </div>
  );
}
