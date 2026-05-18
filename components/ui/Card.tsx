import React from 'react';
import { cn } from '@/lib/cn';

const cardVariants = {
  default: 'bg-slate-800/40 border-slate-700/40 backdrop-blur-sm',
  elevated: 'bg-slate-900/90 border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.5)]',
  glass: 'bg-slate-950/40 backdrop-blur-md border-slate-800/60',
  outline: 'bg-transparent border-slate-700/50',
  danger: 'bg-red-950/20 border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]',
  success: 'bg-emerald-950/20 border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  rounded = 'xl',
  children,
  ...props
}: CardProps) {
  const paddingClass = {
    none: '',
    xs: 'p-1.5',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    '3xl': 'rounded-[2rem]',
  }[rounded];

  return (
    <div
      className={cn(
        'border transition-colors duration-200',
        cardVariants[variant],
        paddingClass,
        roundedClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
