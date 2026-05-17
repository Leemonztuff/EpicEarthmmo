import React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-slate-800/60',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width ?? (variant === 'circular' ? '2rem' : '100%'),
        height: height ?? (variant === 'circular' ? '2rem' : variant === 'text' ? '1rem' : '4rem'),
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={12} />
          <Skeleton variant="text" height={8} width="60%" />
        </div>
      </div>
      <Skeleton variant="rounded" height={40} />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
