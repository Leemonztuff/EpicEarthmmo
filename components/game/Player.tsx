import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group as TGroup } from 'three';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { touchInput } from '@/lib/touchInput';
import { gameData } from '@/shared/loader';
import { Sprite } from './Sprite';
import { directionFromAngle, type Direction, type AnimState } from '@/lib/spriteManager';

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
  const lastAttackTimeRef = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  const firstFrameRef = useRef(true);

  const animStateRef = useRef<AnimState>('idle');
  const directionRef = useRef<Direction>('S');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
      selectedTargetId, enemies, player
    } = gameStore;

    const SPEED = balance.movement.playerSpeed;
    const ATTACK_RANGE = balance.combat.attackRange;
    const AGI_COOLDOWN_REDUCTION = Math.max(0, player.stats.agi) * 0.005;
    const ATTACK_COOLDOWN = Math.max(0.1, (balance.combat.attackCooldownMs / 1000) - AGI_COOLDOWN_REDUCTION);

    let pos = rigidBodyRef.current.translation();

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

    const current = new Vector3(pos.x, pos.y, pos.z);

    const keyLeft = keys.current['KeyA'] || keys.current['ArrowLeft'];
    const keyRight = keys.current['KeyD'] || keys.current['ArrowRight'];
    const keyUp = keys.current['KeyW'] || keys.current['ArrowUp'];
    const keyDown = keys.current['KeyS'] || keys.current['ArrowDown'];

    let inputDir = { x: 0, z: 0 };
    let hasKeyboardInput = false;

    if (keyLeft) { inputDir.x -= 1; hasKeyboardInput = true; }
    if (keyRight) { inputDir.x += 1; hasKeyboardInput = true; }
    if (keyUp) { inputDir.z -= 1; hasKeyboardInput = true; }
    if (keyDown) { inputDir.z += 1; hasKeyboardInput = true; }

    if (!hasKeyboardInput) {
      const joyX = touchInput.x;
      const joyZ = touchInput.z;
      if (Math.abs(joyX) > 0.1 || Math.abs(joyZ) > 0.1) {
        inputDir.x = joyX;
        inputDir.z = joyZ;
      }
    }

    if (inputDir.x !== 0 || inputDir.z !== 0) {
      const len = Math.sqrt(inputDir.x * inputDir.x + inputDir.z * inputDir.z);
      if (len > 0) {
        inputDir.x /= len;
        inputDir.z /= len;
      }
    }

    let isAttacking = false;

    if (selectedTargetId) {
      const enemy = enemies[selectedTargetId];
      if (enemy && !enemy.isDead) {
        const enemyObj = new Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        const distanceToEnemy = current.distanceTo(enemyObj);

        if (distanceToEnemy <= ATTACK_RANGE) {
          if (targetPosition) setTargetPosition(null);

          const now = state.clock.elapsedTime;
          if (now - lastAttackTimeRef.current >= ATTACK_COOLDOWN) {
            lastAttackTimeRef.current = now;
            isAttacking = true;
            networkStore.attackTarget(selectedTargetId);
          }
        } else {
          const dx = enemy.position.x - current.x;
          const dz = enemy.position.z - current.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.1) {
            inputDir.x = dx / dist;
            inputDir.z = dz / dist;
          }
        }
      }
    }

    if (inputDir.x === 0 && inputDir.z === 0 && targetPosition) {
      const dx = targetPosition.x - current.x;
      const dz = targetPosition.z - current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.3) {
        inputDir.x = dx / dist;
        inputDir.z = dz / dist;
      } else {
        setTargetPosition(null);
      }
    }

    setInputDirection({ x: inputDir.x, z: inputDir.z });

    const isMoving = inputDir.x !== 0 || inputDir.z !== 0;
    if (isMoving) {
      rigidBodyRef.current.setTranslation({
        x: pos.x + inputDir.x * SPEED * delta,
        y: pos.y,
        z: pos.z + inputDir.z * SPEED * delta,
      }, true);
    }

    // ── Update animation state ──
    animStateRef.current = isAttacking ? 'attack' : isMoving ? 'walk' : 'idle';

    if (inputDir.x !== 0 || inputDir.z !== 0) {
      directionRef.current = directionFromAngle(inputDir.x, inputDir.z);
    }

    // ── Visual effects (bob) ──
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
