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
    <div className="pointer-events-auto select-none">
      <div className="flex items-center gap-2 p-2 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/60 shadow-2xl">
        {buttons.map((btn, index) => {
          const Icon = btn.icon;
          const colors: any = {
            blue: 'text-blue-400 group-hover:text-blue-300',
            amber: 'text-amber-400 group-hover:text-amber-300',
            emerald: 'text-emerald-400 group-hover:text-emerald-300',
            purple: 'text-purple-400 group-hover:text-purple-300',
            cyan: 'text-cyan-400 group-hover:text-cyan-300',
            slate: 'text-slate-400 group-hover:text-slate-300',
          };

          const activeBg: any = {
            blue: 'bg-blue-500/20 border-blue-500/40',
            amber: 'bg-amber-500/20 border-amber-500/40',
            emerald: 'bg-emerald-500/20 border-emerald-500/40',
            purple: 'bg-purple-500/20 border-purple-500/40',
            cyan: 'bg-cyan-500/20 border-cyan-500/40',
            slate: 'bg-slate-500/20 border-slate-500/40',
          };

          return (
            <motion.button
              key={btn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={btn.onClick}
              className={cn(
                "group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer active:scale-90",
                btn.active
                  ? activeBg[btn.color]
                  : "bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
              )}
            >
              <Icon size={20} className={cn("transition-transform duration-200 group-hover:scale-110", btn.active ? "scale-110" : colors[btn.color])} />
              {btn.active && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-current"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
