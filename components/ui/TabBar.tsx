import React, { useState } from 'react';
import { cn } from '@/lib/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pill' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className,
}: TabBarProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 bg-slate-800/50 rounded-xl', className)}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg font-medium text-xs transition-all touch-manipulation active:scale-95',
                size === 'sm' ? 'py-1.5 px-2' : 'py-2 px-3',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn(
                  'min-w-[16px] h-4 rounded-full text-[8px] font-bold flex items-center justify-center px-1',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
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

  if (variant === 'underline') {
    return (
      <div className={cn('flex border-b border-slate-700/50', className)}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 font-medium text-xs transition-all relative touch-manipulation active:scale-95',
                size === 'sm' ? 'py-2' : 'py-3',
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />
              )}
              {tab.badge !== undefined && (
                <span className="min-w-[16px] h-4 rounded-full bg-slate-700 text-slate-400 text-[8px] font-bold flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 font-medium text-xs transition-all rounded-lg touch-manipulation active:scale-95',
              size === 'sm' ? 'py-1.5 px-3' : 'py-2 px-4',
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                'min-w-[16px] h-4 rounded-full text-[8px] font-bold flex items-center justify-center px-1',
                isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
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
