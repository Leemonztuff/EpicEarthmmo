import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
import { RigidBody, CuboidCollider, interactionGroups } from '@react-three/rapier';
import { CollisionGroup } from '@/lib/collisionSystem';
import { Enemy } from './Enemy';
import { DamageNumbers } from './DamageNumbers';
import { WarpPortal } from './WarpPortal';

interface WallCollider {
  position: [number, number, number];
  size: [number, number, number];
}

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
  colliders?: WallCollider[];
}

function createGrassTexture(grassTexture: { baseColor: string; repeatX: number; repeatY: number }): THREE.CanvasTexture {
  if (typeof document === 'undefined') return new THREE.CanvasTexture(new HTMLCanvasElement());
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = grassTexture.baseColor || '#5a9d5a';
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
  tex.repeat.set(grassTexture.repeatX || 1, grassTexture.repeatY || 1);
  return tex;
}

type DecoType = 'tree' | 'bush' | 'rock' | 'flower' | 'building' | 'fence' | 'well' | 'sign' | 'castle' | 'castle_tower_left' | 'castle_tower_right' | 'castle_gate' | 'building_large' | 'building_medium' | 'building_small' | 'fountain' | 'stone_path' | 'lamppost' | 'bench' | 'tree_ornamental' | 'torch' | 'pillar' | 'mushroom' | 'crack' | 'chest' | 'dungeon_wall' | 'dungeon_floor_tile';

function Decoration({ position, scale = 1, type = 'tree' }: { position: [number, number, number]; scale?: number; type?: DecoType }) {
  const variant = useMemo(() => Math.floor(Math.random() * 3), []);
  // simplified for brevity... (implement full decorations if needed)
  return null;
}

function GrassTufts({ count }: { count: number }) {
  const instancedMesh = useMemo(() => {
    const mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.08, 0.15),
      new THREE.MeshBasicMaterial({ color: '#5aaa5a', transparent: true, opacity: 0.6, depthWrite: false }),
      count || 1,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      dummy.position.set(x, 0.06, z);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
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
    <group position={[zone.center.x || 0, 0.02, zone.center.z || 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(zone.radius || 1) - 0.1, zone.radius || 1, 64]} />
        <meshBasicMaterial color="#44ff44" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Map({ mapData }: { mapData: MapData }) {
  const setTargetPosition = useGameStore((state) => state.setTargetPosition);
  const setSelectedTargetId = useGameStore((state) => state.setSelectedTargetId);
  const enemies = useGameStore((state) => state.enemies || {});
  const texture = useMemo(() => createGrassTexture(mapData.grassTexture || {}), [mapData.grassTexture]);

  const handlePointerDown = useCallback((e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const point = e.point;
    setTargetPosition({ x: point.x, z: point.z });
    setSelectedTargetId(null);
  }, [setTargetPosition, setSelectedTargetId]);

  return (
    <group>
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onPointerDown={handlePointerDown} receiveShadow>
          <planeGeometry args={[mapData.dimensions?.width || 80, mapData.dimensions?.height || 80]} />
          <meshStandardMaterial map={texture} roughness={0.8} metalness={0} color={mapData.floorColor} />
        </mesh>
      </RigidBody>

      {(mapData.grassTuftCount || 0) > 0 && <GrassTufts count={mapData.grassTuftCount} />}

      {(mapData.decorations || []).map((d, i) => (
        <Decoration key={i} position={d.position} type={d.type as any} scale={d.scale} />
      ))}

      {(mapData.warps || []).map((w) => (
        <WarpPortal
          key={w.id}
          id={w.id}
          name={w.name}
          position={w.position}
          targetMapName={w.targetMapName}
          visual={w.visual}
        />
      ))}

      {(mapData.safeZones || []).map((sz) => (
        <SafeZoneIndicator key={sz.id} zone={sz} />
      ))}

      {(mapData.colliders || []).map((c, i) => (
        <RigidBody key={i} type="fixed" colliders={false}>
          <CuboidCollider
            args={[c.size[0] / 2, c.size[1] / 2, c.size[2] / 2]}
            position={c.position}
            collisionGroups={interactionGroups([CollisionGroup.WALL], [CollisionGroup.PLAYER, CollisionGroup.ENEMY, CollisionGroup.NPC])}
          />
        </RigidBody>
      ))}

      {Object.values(enemies || {}).map((enemy) => (
        <Enemy key={enemy.id} id={enemy.id} />
      ))}

      <DamageNumbers />
    </group>
  );
}
