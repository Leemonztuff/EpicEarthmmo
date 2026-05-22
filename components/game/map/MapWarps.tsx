'use client';

import React from 'react';
import { WarpPortal } from '../WarpPortal';

interface WarpData {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetMapName: string;
  visual: string;
}

export function MapWarps({ warps }: { warps: WarpData[] }) {
  return (
    <group>
      {warps.map((w) => (
        <WarpPortal
          key={w.id}
          id={w.id}
          name={w.name}
          position={w.position}
          targetMapName={w.targetMapName}
          visual={w.visual}
        />
      ))}
    </group>
  );
}
