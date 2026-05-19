'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { User, Backpack, Swords, Settings, MessageSquare, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface MenuBarProps {
  onToggleChat: () => void;
  onOpenSettings: () => void;
  onOpenEquipment: () => void;
}

export function MenuBar({ onToggleChat, onOpenSettings, onOpenEquipment }: MenuBarProps) {
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);

  const buttons = [
    { id: 'chat', icon: MessageSquare, onClick: onToggleChat, active: false, color: 'blue' },
    { id: 'isStatsOpen', icon: User, onClick: () => toggleUI('isStatsOpen'), active: ui.isStatsOpen, color: 'amber' },
    { id: 'isInventoryOpen', icon: Backpack, onClick: () => toggleUI('isInventoryOpen'), active: ui.isInventoryOpen, color: 'emerald' },
    { id: 'isSkillsOpen', icon: Swords, onClick: () => toggleUI('isSkillsOpen'), active: ui.isSkillsOpen, color: 'purple' },
    { id: 'equipment', icon: Shield, onClick: onOpenEquipment, active: false, color: 'cyan' },
    { id: 'settings', icon: Settings, onClick: onOpenSettings, active: false, color: 'slate' },
  ];

  return (
    <div className="pointer-events-auto select-none max-w-full overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-slate-950/40 backdrop-blur-md rounded-xl sm:rounded-2xl border border-slate-800/60 shadow-2xl">
        {buttons.map((btn, index) => {
          const Icon = btn.icon;
          const activeBg: any = {
            blue: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
            amber: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
            emerald: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
            purple: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
            cyan: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
            slate: 'bg-slate-500/20 border-slate-500/40 text-slate-400',
          };

          return (
            <motion.button
              key={btn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={btn.onClick}
              className={cn(
                "group relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-90 flex-shrink-0",
                btn.active
                  ? activeBg[btn.color]
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-white"
              )}
            >
              <Icon size={18} className="sm:hidden" />
              <Icon size={20} className="hidden sm:block" />
              {btn.active && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute -bottom-1 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-current"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
