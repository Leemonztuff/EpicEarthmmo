'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { gameData } from '@/shared/loader';

const { balance } = gameData;

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
      <div className="flex items-center gap-2 mb-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">{player.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate drop-shadow-md">{player.name}</div>
          <div className="text-slate-300 text-[10px] font-medium">
            Lv.{player.baseLevel} {player.jobClass}
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        <Bar value={hpPct} color="from-green-500 to-green-600" label={`${Math.ceil(player.hp)}/${player.maxHp}`} />
        <Bar value={spPct} color="from-blue-500 to-blue-600" label={`${Math.ceil(player.sp)}/${player.maxSp}`} />
        <div className="flex gap-0.5">
          <div className="flex-1 h-1 bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-300" style={{ width: `${baseExpPct}%` }} />
          </div>
          <div className="flex-1 h-1 bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full transition-all duration-300" style={{ width: `${jobExpPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold text-white drop-shadow-md">{label}</span>
      </div>
    </div>
  );
}
