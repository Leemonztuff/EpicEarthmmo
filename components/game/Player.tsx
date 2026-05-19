'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group as TGroup } from 'three';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Sprite } from './Sprite';
import { directionFromAngle, type Direction, type AnimState } from '@/lib/spriteManager';
import { getMovementInput, getTargetDirection } from '@/lib/movementController';
import { createPlayerStateMachine, updatePlayerStateMachine } from '@/lib/playerStateMachine';
import { gameData } from '@/shared/loader';

const { balance } = gameData;

const JOB_TO_ENTITY: Record<string, string> = {
  Novice: 'novice_m',
  Swordsman: 'swordsman_m',
  Mage: 'mage_m',
  Archer: 'archer_m',
  Thief: 'thief_m',
  Acolyte: 'acolyte_m',
};

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<TGroup>(null);
  const [initialPos] = useState(() => useGameStore.getState().position);
  const firstFrameRef = useRef(true);
  const lastAttackTimeRef = useRef(0);

  const smRef = useRef(createPlayerStateMachine());
  const animStateRef = useRef<AnimState>('idle');
  const directionRef = useRef<Direction>('S');

  const jobClass = useGameStore(s => s.player.jobClass);
  const entityId = JOB_TO_ENTITY[jobClass] || 'novice_m';

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    if (firstFrameRef.current) {
      firstFrameRef.current = false;
      const pos = useGameStore.getState().position;
      rigidBodyRef.current.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
    }

    const gameStore = useGameStore.getState();
    const networkStore = useNetworkStore.getState();
    const {
      targetPosition, setTargetPosition, setInputDirection, position: storePos,
      selectedTargetId, enemies, player,
    } = gameStore;

    const SPEED = balance.movement.playerSpeed;
    const ATTACK_RANGE = balance.combat.attackRange;
    const ATTACK_COOLDOWN = Math.max(0.1, (balance.combat.attackCooldownMs / 1000));

    let pos = rigidBodyRef.current.translation();
    const currentVec = new Vector3(pos.x, pos.y, pos.z);

    // ── Server reconciliation ──
    const corrDx = storePos.x - pos.x;
    const corrDz = storePos.z - pos.z;
    const corrDistSq = corrDx * corrDx + corrDz * corrDz;
    if (corrDistSq > 0.1) {
      const corrSpeed = corrDistSq > 9.0 ? 1.0 : 0.08;
      pos = {
        x: pos.x + corrDx * corrSpeed,
        y: pos.y,
        z: pos.z + corrDz * corrSpeed,
      };
      rigidBodyRef.current.setTranslation(pos, true);
    }

    // ── Get input ──
    const { input: rawInput } = getMovementInput();
    let inputDir = { x: rawInput.x, z: rawInput.z };

    // ── Auto-follow enemy if selected ──
    let isAttacking = false;
    if (selectedTargetId) {
      const enemy = enemies[selectedTargetId];
      if (enemy && !enemy.isDead) {
        const enemyPos = new Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        const dist = currentVec.distanceTo(enemyPos);

        if (dist <= ATTACK_RANGE) {
          if (targetPosition) setTargetPosition(null);
          const now = state.clock.elapsedTime;
          if (now - lastAttackTimeRef.current >= ATTACK_COOLDOWN) {
            lastAttackTimeRef.current = now;
            isAttacking = true;
            networkStore.attackTarget(selectedTargetId);
          }
        } else {
          const dir = getTargetDirection(
            { x: pos.x, z: pos.z },
            { x: enemy.position.x, z: enemy.position.z },
          );
          if (dir.x !== 0 || dir.z !== 0) {
            inputDir = dir;
          }
        }
      }
    }

    // ── Click-to-move target ──
    if (inputDir.x === 0 && inputDir.z === 0 && targetPosition) {
      const dir = getTargetDirection(
        { x: pos.x, z: pos.z },
        { x: targetPosition.x, z: targetPosition.z },
      );
      if (dir.x !== 0 || dir.z !== 0) {
        inputDir = dir;
      } else {
        setTargetPosition(null);
      }
    }

    setInputDirection(inputDir);

    // ── Apply movement ──
    const isMoving = inputDir.x !== 0 || inputDir.z !== 0;
    if (isMoving) {
      rigidBodyRef.current.setTranslation({
        x: pos.x + inputDir.x * SPEED * delta,
        y: pos.y,
        z: pos.z + inputDir.z * SPEED * delta,
      }, true);
    }

    // ── Update state machine ──
    smRef.current = updatePlayerStateMachine(
      smRef.current,
      delta,
      inputDir,
      { x: pos.x, z: pos.z },
    );

    if (isAttacking) {
      animStateRef.current = 'attack';
    } else if (isMoving) {
      animStateRef.current = 'walk';
    } else {
      animStateRef.current = 'idle';
    }

    if (inputDir.x !== 0 || inputDir.z !== 0) {
      directionRef.current = directionFromAngle(inputDir.x, inputDir.z);
    }

    // ── Bob animation ──
    if (groupRef.current) {
      if (isMoving) {
        const bob = Math.sin(state.clock.elapsedTime * 15);
        groupRef.current.position.y = Math.abs(bob) * 0.15;
      } else {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
      }
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <RigidBody ref={rigidBodyRef} position={[initialPos.x, initialPos.y, initialPos.z]} enabledRotations={[false, false, false]}>
      <group ref={groupRef}>
        <Sprite
          entityId={entityId}
          state={animStateRef.current}
          direction={directionRef.current}
          width={1.5}
          height={1.5}
          billboard
        />
      </group>
    </RigidBody>
  );
}
