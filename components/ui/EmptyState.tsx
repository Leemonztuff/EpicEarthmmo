import React from 'react';
import { cn } from '@/lib/cn';
import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl"
      >
        {icon ?? <Inbox size={32} className="text-slate-700" />}
      </motion.div>
      <h3 className="text-white font-black text-lg mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm font-medium max-w-[240px] leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
}
