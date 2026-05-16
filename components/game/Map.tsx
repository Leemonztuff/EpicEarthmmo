import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { Enemy } from './Enemy';
import { DamageNumbers } from './DamageNumbers';
import { WarpPortal } from './WarpPortal';
import { useNetworkStore } from '@/store/useNetworkStore';

interface MapData {
  mapId: string;
  mapName: string;
  mapType: string;
  dimensions: { width: number; height: number };
  warps: Array<{ id: string; name: string; position: { x: number; y: number; z: number }; targetMapName: string; visual: string }>;
  safeZones: Array<{ id: string; center: { x: number; z: number }; radius: number; name?: string }>;
  decorations: Array<{ position: [number, number, number]; type: string; scale: number }>;
  grassTuftCount: number;
  grassTexture: { baseColor: string; repeatX: number; repeatY: number };
  floorColor: string;
}

function createGrassTexture(grassTexture: { baseColor: string; repeatX: number; repeatY: number }): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = grassTexture.baseColor;
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
  tex.repeat.set(grassTexture.repeatX, grassTexture.repeatY);
  return tex;
}

function Decoration({ position, scale = 1, type = 'tree' }: { position: [number, number, number]; scale?: number; type?: 'tree' | 'bush' | 'rock' | 'flower' | 'building' | 'fence' | 'well' | 'sign' }) {
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

  if (type === 'building') {
    return (
      <group position={position}>
        <mesh position={[0, 1.5 * scale, 0]} castShadow>
          <boxGeometry args={[3 * scale, 3 * scale, 3 * scale]} />
          <meshStandardMaterial color={['#c4a882', '#b89b78', '#d0b892'][variant]} />
        </mesh>
        <mesh position={[0, 3.2 * scale, 0]} castShadow>
          <coneGeometry args={[2.2 * scale, 1.5 * scale, 4]} />
          <meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} />
        </mesh>
      </group>
    );
  }

  if (type === 'fence') {
    return (
      <group position={position}>
        <mesh position={[0, 0.3 * scale, 0]} castShadow>
          <boxGeometry args={[1.5 * scale, 0.6 * scale, 0.1 * scale]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
        <mesh position={[-0.6 * scale, 0.3 * scale, 0]} castShadow>
          <boxGeometry args={[0.1 * scale, 0.8 * scale, 0.1 * scale]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
        <mesh position={[0.6 * scale, 0.3 * scale, 0]} castShadow>
          <boxGeometry args={[0.1 * scale, 0.8 * scale, 0.1 * scale]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      </group>
    );
  }

  if (type === 'well') {
    return (
      <group position={position}>
        <mesh position={[0, 0.3 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.5 * scale, 0.5 * scale, 0.6 * scale, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
        <mesh position={[0, 0.6 * scale, 0]} castShadow>
          <torusGeometry args={[0.5 * scale, 0.05 * scale, 8, 16]} />
          <meshStandardMaterial color="#777777" />
        </mesh>
      </group>
    );
  }

  if (type === 'sign') {
    return (
      <group position={position}>
        <mesh position={[0, 0.5 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.05 * scale, 0.05 * scale, 1 * scale, 6]} />
          <meshStandardMaterial color="#6B4226" />
        </mesh>
        <mesh position={[0, 0.9 * scale, 0]} castShadow>
          <boxGeometry args={[0.6 * scale, 0.4 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#c4a882" />
        </mesh>
      </group>
    );
  }

  return null;
}

function GrassTufts({ count }: { count: number }) {
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
      if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
      dummy.position.set(x, 0.06, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [count]);
  return <primitive object={instancedMesh} />;
}

function SafeZoneIndicator({ zone }: { zone: { id: string; center: { x: number; z: number }; radius: number; name?: string } }) {
  return (
    <group position={[zone.center.x, 0.02, zone.center.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius - 0.1, zone.radius, 64]} />
        <meshBasicMaterial color="#44ff44" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Map({ mapData }: { mapData: MapData }) {
  const setTargetPosition = useGameStore((state) => state.setTargetPosition);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies);
  const texture = useMemo(() => createGrassTexture(mapData.grassTexture), [mapData.grassTexture]);

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
          <planeGeometry args={[mapData.dimensions.width, mapData.dimensions.height]} />
          <meshStandardMaterial map={texture} roughness={0.8} metalness={0} color={mapData.floorColor} />
        </mesh>
      </RigidBody>

      {mapData.grassTuftCount > 0 && <GrassTufts count={mapData.grassTuftCount} />}

      {mapData.decorations.map((d, i) => (
        <Decoration key={i} position={d.position} type={d.type as any} scale={d.scale} />
      ))}

      {mapData.warps.map((w) => (
        <WarpPortal
          key={w.id}
          id={w.id}
          name={w.name}
          position={w.position}
          targetMapName={w.targetMapName}
          visual={w.visual}
        />
      ))}

      {mapData.safeZones.map((sz) => (
        <SafeZoneIndicator key={sz.id} zone={sz} />
      ))}

      {Object.values(enemies).map((enemy) => (
        <Enemy key={enemy.id} id={enemy.id} />
      ))}

      <DamageNumbers />
    </group>
  );
}
