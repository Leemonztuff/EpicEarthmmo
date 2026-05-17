import React from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = {
  default: 'bg-slate-700/60 text-slate-300',
  primary: 'bg-blue-600/30 text-blue-400',
  success: 'bg-green-600/30 text-green-400',
  danger: 'bg-red-600/30 text-red-400',
  warning: 'bg-yellow-600/30 text-yellow-400',
  purple: 'bg-purple-600/30 text-purple-400',
  amount: 'bg-slate-600/80 text-white font-bold',
  level: 'bg-amber-600/20 text-amber-400 font-bold',
  dot: '',
};

const badgeSizes = {
  xs: 'text-[8px] px-1 py-0.5 rounded',
  sm: 'text-[10px] px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2 py-0.5 rounded-md',
  lg: 'text-sm px-2.5 py-1 rounded-lg',
  dot: 'w-2 h-2 rounded-full',
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
        className={cn(badgeVariants[variant], badgeSizes[variant], className)}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(badgeVariants[variant], badgeSizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
