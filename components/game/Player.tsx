import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, CanvasTexture } from 'three';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { touchInput } from '@/lib/touchInput';
import { gameData } from '@/shared/loader';

const { balance, skills } = gameData;

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null);
  const planeRef = useRef<Mesh>(null);
  const flipX = useRef(1);

  const [initialPos] = useState(() => useGameStore.getState().position);
  const lastAttackTimeRef = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  const firstFrameRef = useRef(true);
  const prevInputRef = useRef({ x: 0, z: 0 });

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

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(32, 18, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.3;
      ctx.beginPath();
      ctx.arc(32 + Math.cos(angle) * 10, 18 + Math.sin(angle) * 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd5a0';
    ctx.beginPath();
    ctx.arc(32, 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(27, 18, 3, 3);
    ctx.fillRect(34, 18, 3, 3);
    ctx.fillStyle = '#c97';
    ctx.fillRect(30, 24, 4, 1);
    ctx.fillStyle = '#2a7a9e';
    ctx.beginPath();
    ctx.moveTo(22, 26);
    ctx.lineTo(42, 26);
    ctx.lineTo(44, 42);
    ctx.lineTo(20, 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(22, 37, 20, 2);
    ctx.fillStyle = '#ffd5a0';
    ctx.fillRect(16, 28, 6, 4);
    ctx.fillRect(42, 28, 6, 4);
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(24, 42, 6, 10);
    ctx.fillRect(34, 42, 6, 10);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(23, 50, 8, 3);
    ctx.fillRect(33, 50, 8, 3);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    }
  }, [texture]);

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

            if (planeRef.current) {
              const mat = planeRef.current.material;
              if (mat && 'color' in mat) {
                (mat as THREE.MeshBasicMaterial).color.setHex(0xffcccc);
                setTimeout(() => {
                  if (planeRef.current) {
                    const m2 = planeRef.current.material;
                    if (m2 && 'color' in m2) (m2 as THREE.MeshBasicMaterial).color.setHex(0xffffff);
                  }
                }, 80);
              }
            }
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

    setInputDirection({ x: inputDir.x, y: 0, z: inputDir.z });

    const isMoving = inputDir.x !== 0 || inputDir.z !== 0;
    if (isMoving) {
      rigidBodyRef.current.setTranslation({
        x: pos.x + inputDir.x * SPEED * delta,
        y: pos.y,
        z: pos.z + inputDir.z * SPEED * delta,
      }, true);
    }

    if (inputDir.x < -0.1) flipX.current = -1;
    else if (inputDir.x > 0.1) flipX.current = 1;

    if (meshRef.current) {
      meshRef.current.scale.x = flipX.current;

      if (isMoving) {
        const bob = Math.sin(state.clock.elapsedTime * 15);
        meshRef.current.position.y = Math.abs(bob) * 0.15;
        meshRef.current.rotation.z = bob * 0.05 * flipX.current;
      } else {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
        meshRef.current.rotation.z = 0;
      }

      if (isAttacking) {
        meshRef.current.position.x = flipX.current * 0.15;
        setTimeout(() => {
          if (meshRef.current) meshRef.current.position.x = 0;
        }, 80);
      }
    }

    prevInputRef.current = { x: inputDir.x, z: inputDir.z };
  });

  return (
    <RigidBody ref={rigidBodyRef} position={[initialPos.x, initialPos.y, initialPos.z]} enabledRotations={[false, false, false]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <group ref={meshRef}>
          <mesh ref={planeRef}>
            <planeGeometry args={[1.5, 1.5]} />
            {texture ? (
              <meshBasicMaterial map={texture} transparent={true} />
            ) : (
              <meshBasicMaterial color="red" />
            )}
          </mesh>
        </group>
      </Billboard>
    </RigidBody>
  );
}
