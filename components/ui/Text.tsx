import React from 'react';
import { cn } from '@/lib/cn';

const textVariants = {
  heading: 'text-white font-bold',
  subheading: 'text-slate-300 font-semibold',
  body: 'text-slate-300',
  bodySm: 'text-slate-300 text-sm',
  bodyXs: 'text-slate-400 text-xs',
  caption: 'text-slate-500 text-[10px]',
  label: 'text-slate-400 text-xs font-medium',
  value: 'text-white font-bold',
  valueLg: 'text-white font-bold text-lg',
  error: 'text-red-400 text-xs',
  success: 'text-green-400 text-xs',
  warning: 'text-yellow-400 text-xs',
  info: 'text-blue-400 text-xs',
};

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof textVariants;
  children: React.ReactNode;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
}

export function Text({ className, variant = 'body', children, as: Component = 'span', ...props }: TextProps) {
  return (
    <Component className={cn(textVariants[variant], className)} {...props}>
      {children}
    </Component>
  );
}
