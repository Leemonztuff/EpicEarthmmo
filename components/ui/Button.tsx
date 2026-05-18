import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold touch-manipulation transition-all select-none disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_-2px_rgba(59,130,246,0.5)] hover:from-blue-400 hover:to-blue-500 border border-blue-400/20',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60 shadow-lg shadow-black/20',
        danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_-2px_rgba(239,68,68,0.5)] hover:from-red-400 hover:to-red-500 border border-red-400/20',
        success: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_4px_12px_-2px_rgba(16,185,129,0.5)] hover:from-emerald-400 hover:to-emerald-500 border border-emerald-400/20',
        ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white',
        outline: 'bg-transparent border-2 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white',
        icon: 'bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800/80 shadow-xl backdrop-blur-md',
      },
      size: {
        sm: 'h-8 px-3 text-[11px] rounded-lg',
        md: 'h-10 px-4 text-sm rounded-xl',
        lg: 'h-12 px-6 text-base rounded-2xl',
        icon: 'w-10 h-10 rounded-xl',
        iconSm: 'w-8 h-8 rounded-lg',
        iconLg: 'w-12 h-12 rounded-2xl',
        square: 'w-11 h-11 rounded-xl',
        squareLg: 'w-14 h-14 rounded-2xl',
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
        className: 'text-amber-400 border-amber-500/50 bg-slate-800/90 shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]',
      },
      {
        variant: 'primary',
        active: true,
        className: 'ring-2 ring-blue-400/50 brightness-110',
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
