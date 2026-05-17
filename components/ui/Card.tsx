import React from 'react';
import { cn } from '@/lib/cn';

const cardVariants = {
  default: 'bg-slate-800/50 border-slate-700/40',
  elevated: 'bg-slate-900/90 border-slate-700/60 shadow-lg',
  glass: 'bg-slate-900/60 backdrop-blur-sm border-slate-700/40',
  outline: 'bg-transparent border-slate-600/50',
  danger: 'bg-red-900/20 border-red-500/30',
  success: 'bg-green-900/20 border-green-500/30',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }[padding];

  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
  }[rounded];

  return (
    <div
      className={cn(
        'border',
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
