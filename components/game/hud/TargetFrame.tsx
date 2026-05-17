'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ProgressBar, Avatar, Button, Card } from '@/components/ui';
import { X, Crosshair } from 'lucide-react';

export function TargetFrame() {
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);

  if (!selectedTargetId || !enemies[selectedTargetId]) return null;

  const enemy = enemies[selectedTargetId];
  const hpPct = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
  const barColor = hpPct > 50 ? 'red' : hpPct > 25 ? 'orange' : 'red';

  return (
    <div className="pointer-events-auto select-none mx-auto w-full max-w-[260px]">
      <Card variant="danger" padding="sm" rounded="lg" className="shadow-lg shadow-red-900/20">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar name={enemy.name} size="sm" ringColor="red" showLevel={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Crosshair size={10} className="text-red-400 flex-shrink-0" />
                <span className="text-white font-bold text-sm truncate drop-shadow-md">{enemy.name}</span>
              </div>
              <span className="text-red-300/70 text-[10px]">Lv.{enemy.level}</span>
            </div>
          </div>
          <Button variant="ghost" size="iconSm" onClick={() => setSelectedTargetId(null)}>
            <X size={14} />
          </Button>
        </div>
        <ProgressBar value={enemy.hp} max={enemy.maxHp} color={barColor} size="sm" />
      </Card>
    </div>
  );
}
