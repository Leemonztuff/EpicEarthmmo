import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, CanvasTexture } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';

export function Enemy({ id }: { id: string }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const enemy = useGameStore(state => state.enemies[id]);
  const setSelectedTargetId = useGameStore(state => state.setSelectedTargetId);
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const isSelected = selectedTargetId === id;

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff8cb0';
      ctx.beginPath();
      ctx.arc(32, 40, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.fillRect(20, 35, 4, 4);
      ctx.fillRect(40, 35, 4, 4);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => { texture?.dispose(); };
  }, [texture]);

  if (!enemy || enemy.isDead) return null;

  return (
    <RigidBody 
      ref={rigidBodyRef} 
      position={[enemy.position.x, enemy.position.y, enemy.position.z]} 
      enabledRotations={[false, false, false]}
      type="fixed"
    >
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <group 
          onPointerDown={(e) => {
            e.stopPropagation();
            setSelectedTargetId(id);
          }}
        >
          {isSelected && (
            <mesh position={[0, -0.6, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0.5, 0.6, 32]} />
              <meshBasicMaterial color="yellow" transparent opacity={0.6} />
            </mesh>
          )}

          <mesh>
            <planeGeometry args={[1.2, 1.2]} />
            {texture ? (
              <meshBasicMaterial map={texture} transparent={true} />
            ) : (
              <meshBasicMaterial color="pink" />
            )}
          </mesh>

          {/* Enemy Name & HP */}
          <group position={[0, 1, 0]}>
            <Text
              position={[0, 0.2, 0]}
              fontSize={0.2}
              color="white"
              outlineWidth={0.02}
              outlineColor="black"
            >
              {enemy.name}
            </Text>
            {/* HP Bar Background */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 0.1]} />
              <meshBasicMaterial color="black" />
            </mesh>
            {/* HP Bar Foreground */}
            {enemy.maxHp > 0 && (
              <mesh position={[-0.5 + (enemy.hp / enemy.maxHp) / 2, 0, 0.01]}>
                <planeGeometry args={[Math.max(0, enemy.hp / enemy.maxHp), 0.08]} />
                <meshBasicMaterial color={(enemy.hp / enemy.maxHp) < 0.3 ? "red" : "green"} />
              </mesh>
            )}
          </group>
        </group>
      </Billboard>
    </RigidBody>
  );
}
