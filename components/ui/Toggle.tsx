import React from 'react';
import { cn } from '@/lib/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  toggleSize?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  toggleSize = 'md',
  disabled = false,
  className,
}: ToggleProps) {
  const trackSizes = {
    sm: 'w-9 h-5',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const translateX = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-7' : 'translate-x-0.5',
  };

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={cn(
          'rounded-full transition-colors duration-200',
          trackSizes[toggleSize],
          checked ? 'bg-blue-600' : 'bg-slate-700'
        )}>
          <div className={cn(
            'absolute top-0.5 left-0 rounded-full bg-white shadow-md transition-transform duration-200',
            thumbSizes[toggleSize],
            translateX[toggleSize]
          )} />
        </div>
      </div>
      {(label || description) && (
        <div>
          {label && <span className="text-white text-sm font-medium">{label}</span>}
          {description && <span className="text-slate-500 text-xs block">{description}</span>}
        </div>
      )}
    </label>
  );
}
