'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui';
import { User, Backpack, Swords, Settings, MessageSquare } from 'lucide-react';

interface MenuBarProps {
  onToggleChat: () => void;
  onOpenSettings: () => void;
}

export function MenuBar({ onToggleChat, onOpenSettings }: MenuBarProps) {
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
        <Button variant="icon" size="icon" onClick={onToggleChat}>
          <MessageSquare size={18} />
        </Button>

        {buttons.map(btn => {
          const isOpen = ui[btn.id];
          const Icon = btn.icon;
          return (
            <Button
              key={btn.id}
              variant="icon"
              size="icon"
              active={isOpen}
              onClick={() => toggleUI(btn.id)}
              className={isOpen ? btn.color : ''}
            >
              <Icon size={18} />
            </Button>
          );
        })}

        <Button variant="icon" size="icon" onClick={onOpenSettings}>
          <Settings size={18} />
        </Button>
      </div>
    </div>
  );
}
