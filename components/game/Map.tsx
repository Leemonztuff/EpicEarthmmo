import React, { useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Enemy } from './Enemy';
import { DamageNumbers } from './DamageNumbers';

export function Map() {
  const setTargetPosition = useGameStore((state) => state.setTargetPosition);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);

  const handlePointerDown = useCallback((e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const point = e.point;
    setTargetPosition({ x: point.x, y: 0.5, z: point.z });
    setSelectedTargetId(null); // Clear selected enemy on ground click
  }, [setTargetPosition, setSelectedTargetId]);

  return (
    <group>
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onPointerDown={handlePointerDown} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#8fd162" />
          <gridHelper args={[100, 100, 0x000000, 0x000000]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} material-opacity={0.1} material-transparent={true} />
        </mesh>
      </RigidBody>
      
      {/* Obstacles */}
      <RigidBody type="fixed">
        <mesh position={[-5, 1, -5]} castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed">
        <mesh position={[5, 1.5, 3]} castShadow>
          <cylinderGeometry args={[1, 1, 3, 16]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </RigidBody>

      {/* Render Enemies */}
      {Object.values(enemies).map((enemy) => (
        <Enemy key={enemy.id} id={enemy.id} />
      ))}

      {/* Render Damage Numbers */}
      <DamageNumbers />
    </group>
  );
}
