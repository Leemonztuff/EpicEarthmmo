'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group as TGroup, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody, CuboidCollider, interactionGroups } from '@react-three/rapier';
import { Sprite } from './Sprite';
import { type AnimState } from '@/lib/spriteManager';
import { CollisionGroup } from '@/lib/collisionSystem';

const ENEMY_TO_ENTITY: Record<string, string> = {
  Poring: 'poring',
  Fabre: 'fabre',
  Pupa: 'pupa',
  Lunatic: 'lunatic',
  Wolf: 'wolf',
  Spore: 'spore',
};

export function Enemy({ id }: { id: string }) {
  const spriteRef = useRef<TGroup>(null);
  const groupRef = useRef<TGroup>(null);
  const enemy = useGameStore(state => state.enemies[id]);
  const setSelectedTargetId = useGameStore(state => state.setSelectedTargetId);
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const isSelected = selectedTargetId === id;

  const animStateRef = useRef<AnimState>('idle');

  const floatOffset = useRef(Math.random() * Math.PI * 2);
  const floatSpeed = useRef(0.8 + Math.random() * 0.4);
  const displayPos = useRef({ x: 0, y: 0.5, z: 0 });

  const entityId = ENEMY_TO_ENTITY[enemy?.name || 'Poring'] || 'poring';

  useFrame((state, delta) => {
    if (!enemy) return;

    const targetX = enemy.position.x;
    const targetY = enemy.position.y;
    const targetZ = enemy.position.z;

    const smoothing = enemy.isDead ? 1 : 6;
    displayPos.current.x += (targetX - displayPos.current.x) * smoothing * delta;
    displayPos.current.y += (targetY - displayPos.current.y) * smoothing * delta;
    displayPos.current.z += (targetZ - displayPos.current.z) * smoothing * delta;

    if (groupRef.current) {
      groupRef.current.position.set(displayPos.current.x, displayPos.current.y, displayPos.current.z);
    }

    if (spriteRef.current) {
      spriteRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed.current + floatOffset.current) * 0.06;
    }

    animStateRef.current = enemy.isDead ? 'dead' : 'idle';
  });

  if (!enemy || enemy.isDead) return null;

  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  const hpColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#facc15' : '#ef4444';

  return (
    <group ref={groupRef} position={[displayPos.current.x, displayPos.current.y, displayPos.current.z]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[0.4, 0.5, 0.4]}
          position={[0, 0.5, 0]}
          collisionGroups={interactionGroups([CollisionGroup.ENEMY], [CollisionGroup.WALL, CollisionGroup.PLAYER])}
        />
        <Billboard follow lockX={true} lockY={false} lockZ={true}>
          <group
            ref={spriteRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelectedTargetId(id);
            }}
          >
            {isSelected && (
              <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.55, 0.7, 32]} />
                <meshBasicMaterial color="#ffd700" transparent opacity={0.5} />
              </mesh>
            )}

            <Sprite
              entityId={entityId}
              state={animStateRef.current}
              direction="S"
              width={1.3}
              height={1.3}
              billboard={false}
            />

            <group position={[0, 0.95, 0]}>
              <Text position={[0, 0.15, 0]} fontSize={0.18} color="white" outlineWidth={0.02} outlineColor="black">
                {enemy.name} Lv.{enemy.level}
              </Text>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1, 0.08]} />
                <meshBasicMaterial color="#333" />
              </mesh>
              <mesh position={[-0.5 + hpRatio / 2, 0, 0.01]}>
                <planeGeometry args={[Math.max(0.02, hpRatio), 0.06]} />
                <meshBasicMaterial color={hpColor} />
              </mesh>
            </group>
          </group>
        </Billboard>
      </RigidBody>
    </group>
  );
}
