'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { X } from 'lucide-react';

export function TargetFrame() {
  const selectedTargetId = useGameStore((state) => state.selectedTargetId);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);

  if (!selectedTargetId || !enemies[selectedTargetId]) return null;

  const enemy = enemies[selectedTargetId];
  const hpPct = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
  const hpColor = hpPct > 50 ? 'from-red-500 to-red-600' : hpPct > 25 ? 'from-orange-500 to-orange-600' : 'from-red-600 to-red-800';

  return (
    <div className="pointer-events-auto select-none mx-auto w-full max-w-[280px]">
      <div className="bg-slate-900/90 backdrop-blur-sm border border-red-500/40 rounded-lg p-2 shadow-lg shadow-red-900/20">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-700 to-red-900 border border-red-500/50 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{enemy.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-bold text-sm truncate drop-shadow-md">{enemy.name}</div>
              <div className="text-red-300 text-[10px]">Lv.{enemy.level}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedTargetId(null)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 touch-manipulation active:scale-95 transition-all"
          >
            <X size={14} />
          </button>
        </div>
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full bg-gradient-to-r ${hpColor} rounded-full transition-all duration-200`}
            style={{ width: `${Math.min(100, hpPct)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white drop-shadow-md">
              {Math.ceil(enemy.hp)}/{enemy.maxHp}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
