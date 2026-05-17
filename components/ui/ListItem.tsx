import React from 'react';
import { cn } from '@/lib/cn';

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'clickable' | 'selected' | 'disabled';
  padding?: 'sm' | 'md';
  children?: React.ReactNode;
}

export function ListItem({
  className,
  icon,
  title,
  description,
  action,
  badge,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: ListItemProps) {
  const variantClasses = {
    default: 'bg-slate-800/50 border-slate-700/40',
    clickable: 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-700/50 cursor-pointer active:bg-slate-700/70',
    selected: 'bg-blue-900/20 border-blue-500/30',
    disabled: 'bg-slate-800/30 border-slate-700/30 opacity-60',
  };

  const paddingClasses = {
    sm: 'p-2',
    md: 'p-3',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border transition-all',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-white font-bold text-sm truncate">{title}</div>
        {description && <div className="text-slate-500 text-[10px] truncate">{description}</div>}
      </div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
      {action && <div className="flex-shrink-0">{action}</div>}
      {children}
    </div>
  );
}
