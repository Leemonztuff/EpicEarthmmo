import React from 'react';
import { cn } from '@/lib/cn';

const avatarSizes = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const levelBadgeSizes = {
  xs: 'w-4 h-4 text-[6px]',
  sm: 'w-5 h-5 text-[7px]',
  md: 'w-6 h-6 text-[8px]',
  lg: 'w-7 h-7 text-[9px]',
  xl: 'w-8 h-8 text-[10px]',
};

const ringColors = {
  default: 'from-slate-500 to-slate-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600',
  purple: 'from-purple-500 to-purple-600',
  gradient: 'from-blue-600 via-purple-500 to-pink-500',
};

export interface AvatarProps {
  name?: string;
  level?: number;
  image?: string;
  size?: keyof typeof avatarSizes;
  ringColor?: keyof typeof ringColors;
  showLevel?: boolean;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export function Avatar({
  name = '?',
  level,
  image,
  size = 'md',
  ringColor = 'gradient',
  showLevel = true,
  status,
  className,
}: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-slate-500',
    busy: 'bg-red-400',
    away: 'bg-yellow-400',
  };

  const statusSizes = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3 h-3 -bottom-0.5 -right-0.5',
    lg: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    xl: 'w-4 h-4 -bottom-0.5 -right-0.5',
  };

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <div className={cn(
        'rounded-full bg-gradient-to-br p-0.5',
        ringColors[ringColor]
      )}>
        <div className={cn(
          'rounded-full bg-slate-900 flex items-center justify-center overflow-hidden',
          avatarSizes[size]
        )}>
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold">{initials}</span>
          )}
        </div>
      </div>

      {showLevel && level !== undefined && (
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-slate-900 flex items-center justify-center shadow-md',
          levelBadgeSizes[size]
        )}>
          <span className="text-white font-black leading-none">{level}</span>
        </div>
      )}

      {status && (
        <div className={cn(
          'absolute rounded-full border-2 border-slate-900',
          statusColors[status],
          statusSizes[size]
        )} />
      )}
    </div>
  );
}
