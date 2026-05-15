import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, CanvasTexture } from 'three';
import { Billboard } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null);
  const flipX = useRef(1);
  
  const [initialPos] = useState(() => useGameStore.getState().position);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const keys = useRef<{ [key: string]: boolean }>({});

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
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(32, 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(20, 32, 24, 24);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => {
      texture?.dispose();
    }
  }, [texture]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return;

    const gameStore = useGameStore.getState();
    const networkStore = useNetworkStore.getState();
    const { 
      targetPosition, setPosition, setTargetPosition,
      selectedTargetId, enemies, player
    } = gameStore;

    const SPEED = 5;
    const ATTACK_RANGE = 1.5;
    const ATTACK_COOLDOWN = Math.max(0.2, 1.0 - (player.stats.agi * 0.02)); // Faster with AGI

    const pos = rigidBodyRef.current.translation();
    const current = new Vector3(pos.x, pos.y, pos.z);

    let isMoving = false;

    // Movement WASD override
    const keyLeft = keys.current['KeyA'] || keys.current['ArrowLeft'];
    const keyRight = keys.current['KeyD'] || keys.current['ArrowRight'];
    const keyUp = keys.current['KeyW'] || keys.current['ArrowUp'];
    const keyDown = keys.current['KeyS'] || keys.current['ArrowDown'];

    let inputDirection = new Vector3(0, 0, 0);
    if (keyLeft) inputDirection.x -= 1;
    if (keyRight) inputDirection.x += 1;
    if (keyUp) inputDirection.z -= 1;
    if (keyDown) inputDirection.z += 1;

    if (inputDirection.lengthSq() > 0) {
      inputDirection.normalize();
      setTargetPosition(null); // Cancel click-to-move if using WASD
    }

    // Combat Logic
    if (selectedTargetId) {
      const enemy = enemies[selectedTargetId];
      if (enemy && !enemy.isDead) {
        const enemyObj = new Vector3(enemy.position.x, enemy.position.y, enemy.position.z);
        const distanceToEnemy = current.distanceTo(enemyObj);

        if (distanceToEnemy <= ATTACK_RANGE) {
          // Attacking
          if (targetPosition) setTargetPosition(null);
          
          const now = state.clock.getElapsedTime();
          if (now - lastAttackTime >= ATTACK_COOLDOWN) {
            setLastAttackTime(now);

            // Emit attack via network
            networkStore.attackTarget(selectedTargetId);
            
            // Visual effect feedback
            if (meshRef.current) {
                const mat = (meshRef.current.children[0] as any).material;
                if (mat) {
                    mat.color.setHex(0xcccccc);
                    setTimeout(() => {
                        if (meshRef.current) {
                            const m2 = (meshRef.current.children[0] as any).material;
                            if (m2) m2.color.setHex(0xffffff);
                        }
                    }, 100);
                }
            }
          }
        } else if (inputDirection.lengthSq() === 0) {
          // Move towards enemy if no WASD input
          setTargetPosition({ x: enemy.position.x, y: 0.5, z: enemy.position.z });
        }
      }
    }

    // Movement Physics
    const targetVelocity = new Vector3(0, 0, 0);

    if (inputDirection.lengthSq() > 0) {
      targetVelocity.copy(inputDirection.multiplyScalar(SPEED));
      isMoving = true;
    } else if (targetPosition) {
      const target = new Vector3(targetPosition.x, current.y, targetPosition.z);
      const distance = current.distanceTo(target);
      
      if (distance > 0.1) {
        const direction = target.clone().sub(current).normalize();
        
        // Stop a little short if targeting an enemy
        if (selectedTargetId && distance <= ATTACK_RANGE) {
          setTargetPosition(null);
        } else {
          targetVelocity.copy(direction.multiplyScalar(SPEED));
          isMoving = true;
        }
      } else {
        setTargetPosition(null);
      }
    }

    // Smooth velocity interpolation for responsive and smooth movement
    const currentLinvel = rigidBodyRef.current.linvel();
    const lerpFactor = 15 * delta;
    
    rigidBodyRef.current.setLinvel({
      x: currentLinvel.x + (targetVelocity.x - currentLinvel.x) * lerpFactor,
      y: currentLinvel.y,
      z: currentLinvel.z + (targetVelocity.z - currentLinvel.z) * lerpFactor
    }, true);

    if (targetVelocity.x < -0.1) flipX.current = -1;
    else if (targetVelocity.x > 0.1) flipX.current = 1;

    // Animations (Bobbing, idle breathing, and sprite flipping)
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
    }

    setPosition({ x: pos.x, y: pos.y, z: pos.z });
  });

  return (
    <RigidBody ref={rigidBodyRef} position={[initialPos.x, initialPos.y, initialPos.z]} enabledRotations={[false, false, false]}>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
         <group ref={meshRef}>
          <mesh>
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
