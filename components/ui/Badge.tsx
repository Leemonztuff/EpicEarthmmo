import React from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = {
  default: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
  primary: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  success: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
  danger: 'bg-red-600/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
  purple: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
  amount: 'bg-slate-950/80 text-white font-black border-slate-700/50',
  level: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-2',
  dot: '',
};

const badgeSizes = {
  xs: 'text-[9px] px-1.5 py-0.5 rounded-md font-bold',
  sm: 'text-[11px] px-2 py-0.5 rounded-lg font-bold',
  md: 'text-xs px-2.5 py-1 rounded-xl font-bold',
  lg: 'text-sm px-3 py-1.5 rounded-2xl font-bold',
  dot: 'w-2.5 h-2.5 rounded-full ring-2 ring-black/20',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  children: React.ReactNode;
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  if (variant === 'dot') {
    return (
      <span
        className={cn('inline-block', badgeVariants[variant], badgeSizes[variant], className)}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border leading-none tracking-tight',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
