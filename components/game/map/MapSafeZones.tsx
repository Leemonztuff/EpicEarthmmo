'use client';

import React from 'react';
import * as THREE from 'three';

interface SafeZoneData {
  id: string;
  center: { x: number; z: number };
  radius: number;
  name?: string;
}

function SafeZoneIndicator({ zone }: { zone: SafeZoneData }) {
  return (
    <group position={[zone.center.x, 0.02, zone.center.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius - 0.1, zone.radius, 64]} />
        <meshBasicMaterial color="#44ff44" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function MapSafeZones({ safeZones }: { safeZones: SafeZoneData[] }) {
  return (
    <group>
      {safeZones.map((sz) => (
        <SafeZoneIndicator key={sz.id} zone={sz} />
      ))}
    </group>
  );
}
