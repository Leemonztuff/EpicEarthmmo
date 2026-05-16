import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { WindowFrame } from './WindowFrame';

export function StatsWindow({ onClose }: { onClose: () => void }) {
  const player = useGameStore((state) => state.player);
  const allocateStat = useGameStore((state) => state.allocateStat);
  const statNames = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

  return (
    <WindowFrame title="Status" onClose={onClose} style={{ left: '10px', top: '10px', width: 'min(50vw, 260px)', height: 'auto' }}>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        {statNames.map(s => (
          <div key={s} className="flex justify-between items-center group">
            <span className="uppercase font-bold text-sm w-8">{s}</span>
            <div className="flex items-center gap-2">
               <span className="w-8 text-right text-sm">{player.stats[s]}</span>
               {player.stats.statPoints > 0 && (
                 <button
                   onClick={() => allocateStat(s)}
                   className="w-10 h-10 bg-blue-500 rounded-md text-white flex items-center justify-center text-lg font-bold hover:bg-blue-400 active:scale-95 touch-manipulation"
                 >
                   +
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-blue-900 mt-2">
        <span>Status Point</span>
        <span>{player.stats.statPoints}</span>
      </div>
    </WindowFrame>
  );
}
