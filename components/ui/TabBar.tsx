import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pill' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pill',
  size = 'md',
  className,
}: TabBarProps) {
  return (
    <div className={cn(
      'flex gap-1 p-1 bg-slate-950/40 rounded-xl sm:rounded-2xl border border-slate-800/60 overflow-x-auto no-scrollbar',
      className
    )}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl font-bold transition-all relative touch-manipulation cursor-pointer flex-shrink-0 min-w-fit px-3',
              size === 'sm' ? 'py-1.5 sm:py-2 text-[10px] sm:text-xs' : 'py-2 sm:py-2.5 text-xs sm:text-sm',
              isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-blue-600 rounded-lg sm:rounded-xl shadow-[0_4px_15px_-3px_rgba(37,99,235,0.4)]"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 scale-90 sm:scale-100">{tab.icon}</span>
            <span className="relative z-10 uppercase tracking-tight">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                'relative z-10 min-w-[16px] sm:min-w-[18px] h-4 sm:h-4.5 rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center px-1',
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
