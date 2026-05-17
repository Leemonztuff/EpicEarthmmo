import React from 'react';
import { cn } from '@/lib/cn';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'divider';
}

export function Section({ className, title, icon, children, variant = 'default', ...props }: SectionProps) {
  if (variant === 'card') {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {title && (
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className="text-white font-semibold text-sm">{title}</h3>
          </div>
        )}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
          {children}
        </div>
      </div>
    );
  }

  if (variant === 'divider') {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {title && (
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-white font-semibold text-sm">{title}</h3>
          </div>
        )}
        <div className="border-t border-slate-700/40 pt-3">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {title && (
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="text-white font-semibold text-sm">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
