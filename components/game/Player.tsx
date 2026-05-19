'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group as TGroup } from 'three';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Sprite } from './Sprite';
import { directionFromAngle, type Direction, type AnimState } from '@/lib/spriteManager';
import { getMovementInput } from '@/lib/movementController';
import { createPlayerStateMachine, updatePlayerStateMachine } from '@/lib/playerStateMachine';
import { createPathFollower, setPathTarget, getPathDirection, type PathFollower } from '@/lib/pathFollower';
import { performInteraction } from '@/lib/interactionManager';
import { playerPosition } from '@/lib/playerPosition';
import { gameData } from '@/shared/loader';

const { balance } = gameData;
const FIXED_YAW = 0.85;
const COSYAW = Math.cos(-FIXED_YAW);
const SINYAW = Math.sin(-FIXED_YAW);

const JOB_TO_ENTITY: Record<string, string> = {
  Novice: 'novice_m',
  Swordsman: 'swordsman_m',
  Mage: 'mage_m',
  Archer: 'archer_m',
  Thief: 'thief_m',
  Acolyte: 'acolyte_m',
};

function rotateInput(input: { x: number; z: number }) {
  return {
    x: input.x * COSYAW - input.z * SINYAW,
    z: input.x * SINYAW + input.z * COSYAW,
  };
}

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<TGroup>(null);
  const [initialPos] = useState(() => useGameStore.getState().position);
  const firstFrameRef = useRef(true);
  const lastAttackTimeRef = useRef(0);

  const smRef = useRef(createPlayerStateMachine());
  const pathRef = useRef<PathFollower>(createPathFollower());
  const animStateRef = useRef<AnimState>('idle');
  const directionRef = useRef<Direction>('S');
  const reconciledRef = useRef(false);
  const velocityRef = useRef({ x: 0, z: 0 });

  const jobClass = useGameStore(s => s.player.jobClass);
  const entityId = JOB_TO_ENTITY[jobClass] || 'novice_m';

  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.position !== prev.position && rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(state.position, true);
        playerPosition.x = state.position.x;
        playerPosition.y = state.position.y;
        playerPosition.z = state.position.z;
      }
    });
    return unsub;
  }, []);

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
      selectedTargetId, enemies, player, collisionGrid,
    } = gameStore;

    const SPEED = balance.movement.playerSpeed;
    const ACCEL = SPEED * 8;
    const FRICTION = 10;
    const ATTACK_RANGE = balance.combat.attackRange;
    const ATTACK_COOLDOWN = Math.max(0.1, (balance.combat.attackCooldownMs / 1000));

    let pos = rigidBodyRef.current.translation();
    const currentVec = new Vector3(pos.x, pos.y, pos.z);

    // ── Get input ──
    const { input: rawInput, hasKeyboardInput } = getMovementInput();
    let inputDir = { x: rawInput.x, z: rawInput.z };

    // ── Camera-relative rotation ──
    inputDir = rotateInput(inputDir);

    // ── Direct input clears pathfinding target ──
    if (hasKeyboardInput && (inputDir.x !== 0 || inputDir.z !== 0)) {
      if (targetPosition) setTargetPosition(null);
      pathRef.current = createPathFollower();
    }

    // ── Auto-follow enemy if selected ──
    let isAttacking = false;
    if (selectedTargetId) {
      const enemy = enemies[selectedTargetId];
      if (enemy && !enemy.isDead) {
        const enemyPos = new Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        const dist = currentVec.distanceTo(enemyPos);

        if (dist <= ATTACK_RANGE) {
          if (targetPosition) setTargetPosition(null);
          pathRef.current = createPathFollower();
          const now = state.clock.elapsedTime;
          if (now - lastAttackTimeRef.current >= ATTACK_COOLDOWN) {
            lastAttackTimeRef.current = now;
            isAttacking = true;
            networkStore.attackTarget(selectedTargetId);
          }
          if (inputDir.x === 0 && inputDir.z === 0) {
            inputDir = { x: 0, z: 0 };
          }
        } else {
          const dx = enemy.position.x - pos.x;
          const dz = enemy.position.z - pos.z;
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len > 0.3) {
            inputDir = { x: dx / len, z: dz / len };
          }
        }
      }
    }

    // ── Click-to-move with pathfinding ──
    if (inputDir.x === 0 && inputDir.z === 0 && targetPosition && !selectedTargetId) {
      const arrived = pathRef.current.arrived;
      const targetChanged =
        pathRef.current.target &&
        (Math.abs(pathRef.current.target.x - targetPosition.x) > 0.1 ||
         Math.abs(pathRef.current.target.z - targetPosition.z) > 0.1);

      if (targetChanged || (!pathRef.current.target && !arrived)) {
        pathRef.current = setPathTarget(
          pathRef.current,
          collisionGrid,
          pos.x, pos.z,
          targetPosition.x, targetPosition.z,
        );
      }

      const dir = getPathDirection(pathRef.current, pos.x, pos.z, 0.5);
      if (dir.x !== 0 || dir.z !== 0) {
        inputDir = dir;
      } else if (pathRef.current.arrived) {
        setTargetPosition(null);
      }
    }

    // ── If path finished, perform interaction or clear target ──
    if (pathRef.current.arrived && targetPosition && !selectedTargetId) {
      const interactionTarget = gameStore.interactionTarget;
      if (interactionTarget) {
        performInteraction(interactionTarget);
      } else {
        setTargetPosition(null);
      }
    }

    setInputDirection(inputDir);

    // ── Velocity-based movement (RO-style accel/decel) ──
    const isMoving = inputDir.x !== 0 || inputDir.z !== 0;
    if (isMoving) {
      velocityRef.current.x += (inputDir.x * SPEED - velocityRef.current.x) * Math.min(1, ACCEL * delta);
      velocityRef.current.z += (inputDir.z * SPEED - velocityRef.current.z) * Math.min(1, ACCEL * delta);
      reconciledRef.current = false;
    } else {
      velocityRef.current.x -= velocityRef.current.x * Math.min(1, FRICTION * delta);
      velocityRef.current.z -= velocityRef.current.z * Math.min(1, FRICTION * delta);
      if (Math.abs(velocityRef.current.x) < 0.001) velocityRef.current.x = 0;
      if (Math.abs(velocityRef.current.z) < 0.001) velocityRef.current.z = 0;
    }

    const hasVelocity = velocityRef.current.x !== 0 || velocityRef.current.z !== 0;
    if (hasVelocity) {
      pos = {
        x: pos.x + velocityRef.current.x * delta,
        y: pos.y,
        z: pos.z + velocityRef.current.z * delta,
      };
      rigidBodyRef.current.setTranslation(pos, true);
    }

    // ── Update shared position for camera ──
    playerPosition.x = pos.x;
    playerPosition.y = pos.y;
    playerPosition.z = pos.z;

    // ── Server reconciliation (only when connected + not moving) ──
    const socketConnected = networkStore.socket?.connected;
    if (!isMoving && !reconciledRef.current && socketConnected) {
      const corrDx = storePos.x - pos.x;
      const corrDz = storePos.z - pos.z;
      const corrDistSq = corrDx * corrDx + corrDz * corrDz;
      if (corrDistSq > 0.5) {
        pos = {
          x: pos.x + corrDx * 0.5,
          y: pos.y,
          z: pos.z + corrDz * 0.5,
        };
        rigidBodyRef.current.setTranslation(pos, true);
        playerPosition.x = pos.x;
        playerPosition.z = pos.z;
      } else if (corrDistSq < 0.1) {
        reconciledRef.current = true;
      }
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
    } else if (hasVelocity) {
      animStateRef.current = 'walk';
    } else {
      animStateRef.current = 'idle';
    }

    if (hasVelocity) {
      directionRef.current = directionFromAngle(velocityRef.current.x, velocityRef.current.z);
    }

    // ── Bob animation ──
    if (groupRef.current) {
      if (hasVelocity) {
        const bob = Math.sin(state.clock.elapsedTime * 12) * 0.08;
        groupRef.current.position.y = bob;
      } else {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
    }
  });

  return (
    <RigidBody ref={rigidBodyRef} type="kinematicPosition" position={[initialPos.x, initialPos.y, initialPos.z]} enabledRotations={[false, false, false]}>
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
