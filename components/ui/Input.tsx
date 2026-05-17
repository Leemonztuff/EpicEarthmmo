import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  inputSize?: 'sm' | 'md' | 'lg';
}

export function Input({
  label,
  error,
  icon,
  variant = 'default',
  inputSize = 'md',
  className,
  ...props
}: InputProps) {
  const sizes = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4',
  };

  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
    filled: 'bg-slate-700/50 border-transparent text-white placeholder-slate-400 focus:bg-slate-700/70 focus:border-blue-500',
    outline: 'bg-transparent border-slate-600/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={cn(
    'w-full rounded-xl border transition-all outline-none touch-manipulation',
    sizes[inputSize],
            variantClasses[variant],
            icon && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-400 text-[10px] mt-1">{error}</p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
      )}
      <textarea
        className={cn(
          'w-full rounded-xl border bg-slate-800/50 border-slate-700/50 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none p-3 text-sm resize-none touch-manipulation',
          error && 'border-red-500',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-[10px] mt-1">{error}</p>
      )}
    </div>
  );
}
