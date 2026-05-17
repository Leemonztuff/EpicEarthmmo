import React from 'react';
import { cn } from '@/lib/cn';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center mb-4">
        {icon ?? <Inbox size={28} className="text-slate-600" />}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 text-xs max-w-[200px]">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
