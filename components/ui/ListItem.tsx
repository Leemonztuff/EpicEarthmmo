import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

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
    default: 'bg-slate-800/40 border-slate-700/30',
    clickable: 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/50 cursor-pointer active:scale-[0.98]',
    selected: 'bg-blue-600/20 border-blue-500/40 shadow-[0_0_15px_-5px_rgba(59,130,246,0.4)]',
    disabled: 'bg-slate-900/30 border-slate-800/30 opacity-40',
  };

  const paddingClasses = {
    sm: 'p-2.5',
    md: 'p-4',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3.5 rounded-2xl border transition-all duration-200 group',
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-slate-100 font-bold text-sm tracking-tight group-hover:text-white transition-colors">
          {title}
        </div>
        {description && (
          <div className="text-slate-500 text-[11px] font-medium leading-tight mt-0.5 line-clamp-2">
            {description}
          </div>
        )}
      </div>
      {(badge || action) && (
        <div className="flex flex-shrink-0 items-center gap-2">
          {badge && <div>{badge}</div>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
