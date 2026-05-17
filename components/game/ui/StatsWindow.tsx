import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BottomSheet } from '../hud/BottomSheet';
import { Dumbbell, Wind, Heart, Brain, Crosshair, Clover } from 'lucide-react';

const statConfig = [
  { key: 'str' as const, icon: Dumbbell, label: 'STR', desc: 'Physical damage' },
  { key: 'agi' as const, icon: Wind, label: 'AGI', desc: 'Attack speed & flee' },
  { key: 'vit' as const, icon: Heart, label: 'VIT', desc: 'Defense & HP' },
  { key: 'int' as const, icon: Brain, label: 'INT', desc: 'Magic damage & SP' },
  { key: 'dex' as const, icon: Crosshair, label: 'DEX', desc: 'Accuracy & cast time' },
  { key: 'luk' as const, icon: Clover, label: 'LUK', desc: 'Critical & luck' },
];

export function StatsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const allocateStat = useGameStore((state) => state.allocateStat);

  return (
    <BottomSheet title="Status" onClose={onClose} subtitle={`Status Points: ${player.stats.statPoints}`}>
      <div className="space-y-2">
        {statConfig.map(({ key, icon: Icon, label, desc }) => (
          <div key={key} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center">
                <Icon size={16} className="text-slate-300" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">{label}</div>
                <div className="text-slate-500 text-[10px]">{desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg w-8 text-right">{player.stats[key]}</span>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => allocateStat(key)}
                  className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-lg font-bold touch-manipulation active:scale-95 transition-all"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
