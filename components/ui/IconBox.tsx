import React from 'react';
import { cn } from '@/lib/cn';

const iconSizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

const iconRounded = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-xl',
};

const iconColors = {
  default: 'bg-slate-700/50 text-slate-300',
  blue: 'bg-blue-600/20 text-blue-400',
  green: 'bg-green-600/20 text-green-400',
  red: 'bg-red-600/20 text-red-400',
  yellow: 'bg-yellow-600/20 text-yellow-400',
  purple: 'bg-purple-600/20 text-purple-400',
  amber: 'bg-amber-600/20 text-amber-400',
  cyan: 'bg-cyan-600/20 text-cyan-400',
  pink: 'bg-pink-600/20 text-pink-400',
  gradient: 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-2 border-blue-400',
};

export interface IconBoxProps {
  icon: React.ReactNode;
  size?: keyof typeof iconSizes;
  color?: keyof typeof iconColors;
  rounded?: keyof typeof iconRounded;
  className?: string;
  children?: React.ReactNode;
}

export function IconBox({ icon, size = 'md', color = 'default', rounded = 'md', className, children }: IconBoxProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        iconSizes[size],
        iconRounded[rounded],
        iconColors[color],
        className
      )}
    >
      {icon}
      {children}
    </div>
  );
}
