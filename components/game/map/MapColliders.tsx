'use client';

import React from 'react';
import { RigidBody } from '@react-three/rapier';
import type { Collider } from '@/shared/schemas';

export function MapColliders({ colliders }: { colliders: Collider[] }) {
  return (
    <group>
      {colliders.map((c, i) => (
        <RigidBody key={`collider-${i}`} type="fixed" position={c.position} colliders="cuboid">
          <mesh visible={false}>
            <boxGeometry args={c.size} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
