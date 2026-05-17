'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Badge } from '@/components/ui';

const typeBadges: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  town: { label: 'Safe Zone', variant: 'success' },
  field: { label: 'Field', variant: 'warning' },
  dungeon: { label: 'Dungeon', variant: 'danger' },
};

export function MapNameDisplay() {
  const mapName = useGameStore(state => state.currentMapName);
  const mapType = useGameStore(state => state.currentMapType);

  const typeInfo = typeBadges[mapType];

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <div className="bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700/40 flex items-center gap-2 shadow-lg">
        <span className="text-white/90 font-semibold text-xs">{mapName}</span>
        {typeInfo && (
          <Badge variant={typeInfo.variant} size="xs">{typeInfo.label}</Badge>
        )}
      </div>
    </div>
  );
}
