'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui';
import { User, Backpack, Swords, Settings, MessageSquare, Shield } from 'lucide-react';

interface MenuBarProps {
  onToggleChat: () => void;
  onOpenSettings: () => void;
  onOpenEquipment: () => void;
}

export function MenuBar({ onToggleChat, onOpenSettings, onOpenEquipment }: MenuBarProps) {
  const ui = useGameStore((state) => state.ui);
  const toggleUI = useGameStore((state) => state.toggleUI);

  const buttons = [
    { id: 'isStatsOpen' as const, icon: User, color: 'text-amber-400' },
    { id: 'isInventoryOpen' as const, icon: Backpack, color: 'text-emerald-400' },
    { id: 'isSkillsOpen' as const, icon: Swords, color: 'text-purple-400' },
  ];

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleChat}
          className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 touch-manipulation active:scale-95 transition-all shadow-lg"
        >
          <MessageSquare size={18} />
        </button>

        {buttons.map(btn => {
          const isOpen = ui[btn.id];
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={() => toggleUI(btn.id)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center touch-manipulation active:scale-95 transition-all shadow-lg ${
                isOpen
                  ? `${btn.color} border-current bg-slate-800/90`
                  : 'text-slate-400 border-slate-700/60 bg-slate-900/80 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <button
          onClick={onOpenEquipment}
          className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 touch-manipulation active:scale-95 transition-all shadow-lg"
        >
          <Shield size={18} />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 touch-manipulation active:scale-95 transition-all shadow-lg"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
