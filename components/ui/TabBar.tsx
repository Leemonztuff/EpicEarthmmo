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
  variant = 'default',
  size = 'md',
  className,
}: TabBarProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 bg-slate-950/40 rounded-2xl border border-slate-800/60', className)}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-all relative touch-manipulation cursor-pointer',
                size === 'sm' ? 'py-2 px-2' : 'py-2.5 px-3',
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-[0_4px_15px_-3px_rgba(37,99,235,0.4)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn(
                  'relative z-10 min-w-[18px] h-4.5 rounded-full text-[9px] font-black flex items-center justify-center px-1.5',
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

  // Fallback to simple default if needed, but pill is best for mobile
  return (
    <div className={cn('flex gap-2 overflow-x-auto no-scrollbar pb-1', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center justify-center gap-2 font-bold text-xs transition-all rounded-xl border relative touch-manipulation px-4 py-2 flex-shrink-0 cursor-pointer',
              isActive
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
