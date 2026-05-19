'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group as TGroup, Mesh } from 'three';
import { Billboard } from '@react-three/drei';
import { startInteraction } from '@/lib/interactionManager';

interface ChestProps {
  id: string;
  position: { x: number; y: number; z: number };
  isOpen?: boolean;
}

export function Chest({ id, position, isOpen = false }: ChestProps) {
  const groupRef = useRef<TGroup>(null);
  const lidRef = useRef<Mesh>(null);
  const targetRotation = useRef(isOpen ? -Math.PI / 2 : 0);

  useFrame((_state, delta) => {
    if (lidRef.current) {
      targetRotation.current += (isOpen ? -Math.PI / 2 - targetRotation.current : 0 - targetRotation.current) * delta * 4;
      lidRef.current.rotation.x = targetRotation.current;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <Billboard follow lockX lockY={false} lockZ={false}>
        <group
          ref={groupRef}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!isOpen) {
              startInteraction({ type: 'chest', id, position: { x: position.x, z: position.z } });
            }
          }}
        >
          {/* Chest body */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.5, 0.25, 0.4]} />
            <meshStandardMaterial color="#8B5E3C" />
          </mesh>
          {/* Chest lid */}
          <mesh ref={lidRef} position={[0, 0.4, -0.1]}>
            <boxGeometry args={[0.52, 0.08, 0.3]} />
            <meshStandardMaterial color="#A0714F" />
          </mesh>
          {/* Lock */}
          <mesh position={[0, 0.25, 0.21]}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color="#FFD700" />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}
