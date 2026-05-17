'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';
import { ProgressBar, ThinBar, Avatar, StatusEffectBar, StatusEffect } from '@/components/ui';
import { Heart, Zap, Shield, Sword } from 'lucide-react';

const { balance } = gameData;

const mockStatusEffects = [
  { icon: <Heart size={16} />, name: 'HP Regen', duration: 15000, variant: 'buff' as const, size: 'sm' as const },
  { icon: <Zap size={16} />, name: 'SP Regen', duration: 12000, variant: 'buff' as const, size: 'sm' as const },
];

export function PlayerFrame() {
  const player = useGameStore((state) => state.player);

  const hpPct = player.maxHp > 0 ? (player.hp / player.maxHp) * 100 : 0;
  const spPct = player.maxSp > 0 ? (player.sp / player.maxSp) * 100 : 0;
  const baseExpThreshold = player.baseLevel * balance.progression.baseLevelUpThreshold.multiplier;
  const jobExpThreshold = player.jobLevel * balance.progression.jobLevelUpThreshold.multiplier;
  const baseExpPct = baseExpThreshold > 0 ? Math.min(100, (player.baseExp / baseExpThreshold) * 100) : 0;
  const jobExpPct = jobExpThreshold > 0 ? Math.min(100, (player.jobExp / jobExpThreshold) * 100) : 0;

  return (
    <div className="pointer-events-auto select-none">
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar
          name={player.name}
          level={player.baseLevel}
          size="sm"
          ringColor="gradient"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-sm truncate drop-shadow-md">{player.name}</span>
            <span className="text-slate-400 text-[10px] font-medium">{player.jobClass}</span>
          </div>
          <div className="flex gap-1 mt-0.5">
            <ProgressBar value={player.hp} max={player.maxHp} color="hp" size="sm" className="flex-1" />
            <ProgressBar value={player.sp} max={player.maxSp} color="sp" size="sm" className="flex-1" />
          </div>
          <div className="flex gap-0.5 mt-0.5">
            <ThinBar value={baseExpPct} color="exp" className="flex-1" />
            <ThinBar value={jobExpPct} color="jobExp" className="flex-1" />
          </div>
        </div>
      </div>

      <StatusEffectBar effects={mockStatusEffects} />
    </div>
  );
}
