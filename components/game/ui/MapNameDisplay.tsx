'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function MapNameDisplay() {
  const mapName = useGameStore(state => state.currentMapName);
  const mapType = useGameStore(state => state.currentMapType);

  const typeLabel = mapType === 'town' ? 'Safe Zone' : mapType === 'field' ? 'Field' : mapType === 'dungeon' ? 'Dungeon' : '';

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <div className="bg-slate-900/60 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700/40">
        <span className="text-white/90 font-semibold text-xs">{mapName}</span>
        {typeLabel && (
          <span className="text-slate-400 text-[10px] ml-1.5">{typeLabel}</span>
        )}
      </div>
    </div>
  );
}
