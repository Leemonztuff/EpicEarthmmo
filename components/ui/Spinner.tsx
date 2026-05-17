import React from 'react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'blue' | 'white' | 'red' | 'green';
  className?: string;
}

const spinnerSizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-10 h-10 border-3',
  xl: 'w-12 h-12 border-3',
};

const spinnerColors = {
  default: 'border-slate-600 border-t-slate-300',
  blue: 'border-blue-800 border-t-blue-400',
  white: 'border-white/30 border-t-white',
  red: 'border-red-800 border-t-red-400',
  green: 'border-green-800 border-t-green-400',
};

export function Spinner({ size = 'md', color = 'default', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
    />
  );
}

export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <Spinner size="lg" color="blue" />
      {text && <p className="text-white text-sm mt-3 font-medium">{text}</p>}
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
