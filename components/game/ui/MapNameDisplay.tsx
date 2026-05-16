'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function MapNameDisplay() {
  const mapName = useGameStore(state => state.currentMapName);
  const mapType = useGameStore(state => state.currentMapType);

  const typeLabel = mapType === 'town' ? 'Safe Zone' : mapType === 'field' ? 'Field' : mapType === 'dungeon' ? 'Dungeon' : '';

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <div className="bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
        <span className="text-white font-bold text-sm">{mapName}</span>
        {typeLabel && (
          <span className="text-white/60 text-xs ml-2">[{typeLabel}]</span>
        )}
      </div>
    </div>
  );
}
