import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Enemy } from './Enemy';
import { DamageNumbers } from './DamageNumbers';

function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7ec850';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const shade = Math.random() * 60;
    ctx.fillStyle = `rgb(${100 + shade}, ${170 + shade}, ${60 + shade})`;
    ctx.fillRect(x, y, 2, 4 + Math.random() * 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}

function Decoration({ position, scale = 1, type = 'tree' }: { position: [number, number, number]; scale?: number; type?: 'tree' | 'bush' | 'rock' | 'flower' }) {
  const variant = useMemo(() => Math.floor(Math.random() * 3), []);

  if (type === 'tree') {
    return (
      <group position={position}>
        <mesh position={[0, 0.5 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.08 * scale, 0.15 * scale, 1 * scale, 6]} />
          <meshStandardMaterial color="#6B4226" />
        </mesh>
        <mesh position={[0, 1.2 * scale + 0.3 * scale, 0]} castShadow>
          <coneGeometry args={[1.2 * scale, 1.0 * scale, 8]} />
          <meshStandardMaterial color={['#2d7d2d', '#358535', '#3d8d3d'][variant]} />
        </mesh>
        <mesh position={[0.2 * scale, 1.8 * scale, 0.2 * scale]} castShadow>
          <coneGeometry args={[0.8 * scale, 0.8 * scale, 8]} />
          <meshStandardMaterial color={['#3d8d3d', '#459545', '#4d9d4d'][variant]} />
        </mesh>
      </group>
    );
  }

  if (type === 'bush') {
    return (
      <mesh position={position} castShadow>
        <sphereGeometry args={[0.5 * scale, 6, 6]} />
        <meshStandardMaterial color={['#3a8a3a', '#4a9a4a', '#5aaa5a'][variant]} />
      </mesh>
    );
  }

  if (type === 'rock') {
    return (
      <mesh position={[position[0], position[1] + 0.15 * scale, position[2]]} castShadow>
        <dodecahedronGeometry args={[0.3 * scale, 0]} />
        <meshStandardMaterial color={['#777', '#888', '#999'][variant]} roughness={0.9} />
      </mesh>
    );
  }

  if (type === 'flower') {
    const color = ['#ff6b8a', '#ffeb3b', '#ff8a65', '#e040fb', '#40c4ff'][variant];
    return (
      <group position={position}>
        <mesh position={[0, 0.15 * scale, 0]}>
          <planeGeometry args={[0.2 * scale, 0.3 * scale]} />
          <meshBasicMaterial color="#4a8a3a" depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.35 * scale, 0]}>
          <planeGeometry args={[0.3 * scale, 0.3 * scale]} />
          <meshBasicMaterial color={color} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  return null;
}

const decorations = [
  { pos: [-8, 0, -8], type: 'tree' as const, scale: 1.2 },
  { pos: [10, 0, -7], type: 'tree' as const, scale: 1 },
  { pos: [-9, 0, 6], type: 'tree' as const, scale: 1.3 },
  { pos: [8, 0, 9], type: 'tree' as const, scale: 1.1 },
  { pos: [-12, 0, 0], type: 'tree' as const, scale: 0.9 },
  { pos: [12, 0, 2], type: 'tree' as const, scale: 1 },
  { pos: [-4, 0, -10], type: 'bush' as const, scale: 0.8 },
  { pos: [6, 0, -11], type: 'bush' as const, scale: 0.7 },
  { pos: [-6, 0, 10], type: 'bush' as const, scale: 0.9 },
  { pos: [-3, 0, -8], type: 'rock' as const, scale: 1 },
  { pos: [7, 0, -6], type: 'rock' as const, scale: 0.8 },
  { pos: [-7, 0, 8], type: 'rock' as const, scale: 1.1 },
  { pos: [2, 0, -9], type: 'rock' as const, scale: 0.7 },
  { pos: [-2, 0, 3], type: 'flower' as const, scale: 1 },
  { pos: [3, 0, -4], type: 'flower' as const, scale: 1 },
  { pos: [-4, 0, -2], type: 'flower' as const, scale: 0.8 },
  { pos: [5, 0, 5], type: 'flower' as const, scale: 1 },
  { pos: [-5, 0, 4], type: 'flower' as const, scale: 0.9 },
  { pos: [1, 0, -5], type: 'flower' as const, scale: 0.7 },
  { pos: [4, 0, -2], type: 'flower' as const, scale: 1 },
  { pos: [4, 0, -9], type: 'bush' as const, scale: 0.6 },
  { pos: [-9, 0, -5], type: 'rock' as const, scale: 0.9 },
];

// Scattered grass tufts
function GrassTufts() {
  const count = 200;
  const instancedMesh = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.08, 0.15),
      new THREE.MeshBasicMaterial({ color: '#5aaa5a', transparent: true, opacity: 0.6, depthWrite: false }),
      count,
    );
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      if (Math.abs(x) < 6 && Math.abs(z) < 6) continue; // keep clear near spawn
      dummy.position.set(x, 0.06, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);
  return <primitive object={instancedMesh} />;
}

export function Map() {
  const setTargetPosition = useGameStore((state) => state.setTargetPosition);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);
  const texture = useMemo(createGrassTexture, []);

  const handlePointerDown = useCallback((e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const point = e.point;
    setTargetPosition({ x: point.x, y: 0.5, z: point.z });
    setSelectedTargetId(null);
  }, [setTargetPosition, setSelectedTargetId]);

  return (
    <group>
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onPointerDown={handlePointerDown} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial map={texture} roughness={0.8} metalness={0} />
        </mesh>
      </RigidBody>

      <GrassTufts />

      {decorations.map((d, i) => (
        <Decoration key={i} position={d.pos} type={d.type} scale={d.scale} />
      ))}

      {/* Render Enemies */}
      {Object.values(enemies).map((enemy) => (
        <Enemy key={enemy.id} id={enemy.id} />
      ))}

      {/* Render Damage Numbers */}
      <DamageNumbers />
    </group>
  );
}
