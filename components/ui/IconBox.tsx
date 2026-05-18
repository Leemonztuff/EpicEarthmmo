import React from 'react';
import { cn } from '@/lib/cn';

const iconSizes = {
  xs: 'w-7 h-7',
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
};

const iconRounded = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-[1.25rem]',
};

const iconColors = {
  default: 'bg-slate-800 border-slate-700/50 text-slate-400',
  blue: 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]',
  green: 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]',
  red: 'bg-red-600/10 border-red-500/30 text-red-400 shadow-[0_0_15_rgba(239,68,68,0.2)]',
  yellow: 'bg-amber-600/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]',
  purple: 'bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]',
  amber: 'bg-amber-600/10 border-amber-500/30 text-amber-400',
  cyan: 'bg-cyan-600/10 border-cyan-500/30 text-cyan-400',
  pink: 'bg-pink-600/10 border-pink-500/30 text-pink-400',
  gradient: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-2 border-blue-400 shadow-lg',
};

export interface IconBoxProps {
  icon: React.ReactNode;
  size?: keyof typeof iconSizes;
  color?: keyof typeof iconColors;
  rounded?: keyof typeof iconRounded;
  className?: string;
  children?: React.ReactNode;
}

export function IconBox({ icon, size = 'md', color = 'default', rounded = 'md', className, children }: IconBoxProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 border transition-all duration-200',
        iconSizes[size],
        iconRounded[rounded],
        iconColors[color],
        className
      )}
    >
      <div className="relative z-10">{icon}</div>
      {children}
    </div>
  );
}
