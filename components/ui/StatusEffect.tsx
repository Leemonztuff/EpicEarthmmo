import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';

export interface StatusEffectProps {
  icon: React.ReactNode;
  name: string;
  duration?: number;
  variant?: 'buff' | 'debuff' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  stackCount?: number;
  className?: string;
}

export function StatusEffect({
  icon,
  name,
  duration,
  variant = 'neutral',
  size = 'md',
  stackCount,
  className,
}: StatusEffectProps) {
  const [timeLeft, setTimeLeft] = useState(duration ?? 0);

  useEffect(() => {
    if (duration === undefined) return;
    setTimeLeft(duration);
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [duration]);

  const variantBorders = {
    buff: 'border-green-500/60 shadow-green-900/30',
    debuff: 'border-red-500/60 shadow-red-900/30',
    neutral: 'border-slate-600/60 shadow-slate-900/30',
  };

  const variantBg = {
    buff: 'bg-green-900/40',
    debuff: 'bg-red-900/40',
    neutral: 'bg-slate-800/60',
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const timerTextSizes = {
    sm: 'text-[6px]',
    md: 'text-[7px]',
    lg: 'text-[8px]',
  };

  const formatTime = (ms: number) => {
    const sec = Math.ceil(ms / 1000);
    if (sec >= 60) return `${Math.floor(sec / 60)}m`;
    return `${sec}s`;
  };

  return (
    <div className={cn('relative group', className)}>
      <div className={cn(
        'rounded-lg border-2 shadow-md flex items-center justify-center relative overflow-hidden',
        sizes[size],
        variantBg[variant],
        variantBorders[variant]
      )}>
        {duration !== undefined && timeLeft > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/40 transition-all duration-1000"
            style={{ height: `${(timeLeft / duration) * 100}%` }}
          />
        )}
        <div className="relative z-10">
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSizes[size] })
            : icon}
        </div>

        {duration !== undefined && timeLeft > 0 && (
          <div className={cn(
            'absolute bottom-0.5 right-0.5 font-bold text-white drop-shadow-md z-10',
            timerTextSizes[size]
          )}>
            {formatTime(timeLeft)}
          </div>
        )}

        {stackCount !== undefined && stackCount > 1 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border border-slate-900 flex items-center justify-center shadow-md">
            <span className="text-[7px] text-white font-black">{stackCount}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
        {name}
      </div>
    </div>
  );
}

export function StatusEffectBar({ effects }: { effects: StatusEffectProps[] }) {
  if (effects.length === 0) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {effects.map((effect, i) => (
        <StatusEffect key={i} {...effect} />
      ))}
    </div>
  );
}
