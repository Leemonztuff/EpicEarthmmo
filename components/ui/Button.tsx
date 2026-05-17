import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium touch-manipulation active:scale-95 transition-all select-none disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600/60',
        danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30',
        success: 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30',
        ghost: 'bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white',
        icon: 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/80 shadow-lg',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-xl',
        icon: 'w-10 h-10 rounded-xl',
        iconSm: 'w-8 h-8 rounded-lg',
        iconLg: 'w-12 h-12 rounded-xl',
        square: 'w-11 h-11 rounded-lg',
        squareLg: 'w-14 h-14 rounded-xl',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'icon',
        active: true,
        className: 'text-amber-400 border-amber-400/60 bg-slate-800/90',
      },
      {
        variant: 'primary',
        active: true,
        className: 'bg-blue-500 ring-2 ring-blue-400/50',
      },
      {
        variant: 'danger',
        active: true,
        className: 'bg-red-500 ring-2 ring-red-400/50',
      },
      {
        variant: 'success',
        active: true,
        className: 'bg-green-500 ring-2 ring-green-400/50',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      active: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export function Button({ className, variant, size, active, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, active, className })}
      {...props}
    />
  );
}
