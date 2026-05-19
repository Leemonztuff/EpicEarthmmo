import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';
import { RigidBody, CuboidCollider, interactionGroups } from '@react-three/rapier';
import { CollisionGroup } from '@/lib/collisionSystem';
import { Enemy } from './Enemy';
import { DamageNumbers } from './DamageNumbers';
import { WarpPortal } from './WarpPortal';
import { NPC } from './NPC';
import { Chest } from './Chest';

interface MapData {
  mapId: string;
  mapName: string;
  mapType: string;
  dimensions: { width: number; height: number };
  warps: Array<{ id: string; name: string; position: { x: number; y: number; z: number }; targetMapName: string; visual: string }>;
  safeZones: Array<{ id: string; center: { x: number; z: number }; radius: number; name?: string }>;
  decorations: Array<{ position: [number, number, number]; type: string; scale: number }>;
  npcs?: Array<{ id: string; name: string; sprite: string; dialogId: string; position: { x: number; y: number; z: number } }>;
  chests?: Array<{ id: string; position: { x: number; y: number; z: number }; lootTable: Array<{ itemId: string; chance: number; minAmount: number; maxAmount: number }>; respawnSeconds: number }>;
  colliders?: Array<{ position: [number, number, number]; size: [number, number, number] }>;
  grassTuftCount: number;
  grassTexture: { baseColor: string; repeatX: number; repeatY: number };
  floorColor: string;
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

  if (type === 'tree_ornamental') {
    return (
      <group position={position}>
        <mesh position={[0, 0.4 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.06 * scale, 0.12 * scale, 0.8 * scale, 6]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[0, 1.0 * scale, 0]} castShadow>
          <sphereGeometry args={[0.6 * scale, 8, 6]} />
          <meshStandardMaterial color={['#3a8a3a', '#4a9a4a', '#2d7d2d'][variant]} />
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

  if (type === 'castle') {
    return (
      <group position={position}>
        <mesh position={[0, 3 * scale, 0]} castShadow>
          <boxGeometry args={[12 * scale, 6 * scale, 6 * scale]} />
          <meshStandardMaterial color="#d4c4a8" />
        </mesh>
        <mesh position={[0, 6.5 * scale, 0]} castShadow>
          <boxGeometry args={[13 * scale, 1 * scale, 7 * scale]} />
          <meshStandardMaterial color="#c4b498" />
        </mesh>
        <mesh position={[0, 7 * scale, -1 * scale]} castShadow>
          <coneGeometry args={[2 * scale, 2 * scale, 4]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
      </group>
    );
  }

  if (type === 'castle_tower_left') {
    return (
      <group position={position}>
        <mesh position={[-5 * scale, 4 * scale, -2 * scale]} castShadow>
          <cylinderGeometry args={[1.5 * scale, 1.8 * scale, 8 * scale, 8]} />
          <meshStandardMaterial color="#d4c4a8" />
        </mesh>
        <mesh position={[-5 * scale, 8.5 * scale, -2 * scale]} castShadow>
          <coneGeometry args={[2 * scale, 2 * scale, 8]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
      </group>
    );
  }

  if (type === 'castle_tower_right') {
    return (
      <group position={position}>
        <mesh position={[5 * scale, 4 * scale, -2 * scale]} castShadow>
          <cylinderGeometry args={[1.5 * scale, 1.8 * scale, 8 * scale, 8]} />
          <meshStandardMaterial color="#d4c4a8" />
        </mesh>
        <mesh position={[5 * scale, 8.5 * scale, -2 * scale]} castShadow>
          <coneGeometry args={[2 * scale, 2 * scale, 8]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
      </group>
    );
  }

  if (type === 'castle_gate') {
    return (
      <group position={position}>
        <mesh position={[0, 1.5 * scale, -2.5 * scale]} castShadow>
          <boxGeometry args={[4 * scale, 3 * scale, 1 * scale]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[0, 2.5 * scale, -2.8 * scale]}>
          <boxGeometry args={[3 * scale, 2 * scale, 0.3 * scale]} />
          <meshStandardMaterial color="#5a4a2a" />
        </mesh>
      </group>
    );
  }

  if (type === 'building_large') {
    return (
      <group position={position}>
        <mesh position={[0, 2 * scale, 0]} castShadow>
          <boxGeometry args={[5 * scale, 4 * scale, 4 * scale]} />
          <meshStandardMaterial color={['#c4a882', '#b89b78', '#d0b892'][variant]} />
        </mesh>
        <mesh position={[0, 4.3 * scale, 0]} castShadow>
          <coneGeometry args={[3.5 * scale, 1.5 * scale, 4]} />
          <meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} />
        </mesh>
        <mesh position={[0, 1.5 * scale, 2.01 * scale]}>
          <boxGeometry args={[1 * scale, 1.5 * scale, 0.1 * scale]} />
          <meshStandardMaterial color="#5a4a2a" />
        </mesh>
      </group>
    );
  }

  if (type === 'building_medium') {
    return (
      <group position={position}>
        <mesh position={[0, 1.5 * scale, 0]} castShadow>
          <boxGeometry args={[4 * scale, 3 * scale, 3 * scale]} />
          <meshStandardMaterial color={['#c4a882', '#b89b78', '#d0b892'][variant]} />
        </mesh>
        <mesh position={[0, 3.3 * scale, 0]} castShadow>
          <coneGeometry args={[2.8 * scale, 1.2 * scale, 4]} />
          <meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} />
        </mesh>
      </group>
    );
  }

  if (type === 'building_small') {
    return (
      <group position={position}>
        <mesh position={[0, 1 * scale, 0]} castShadow>
          <boxGeometry args={[3 * scale, 2 * scale, 2.5 * scale]} />
          <meshStandardMaterial color={['#d4b896', '#c4a882', '#b89b78'][variant]} />
        </mesh>
        <mesh position={[0, 2.2 * scale, 0]} castShadow>
          <coneGeometry args={[2.2 * scale, 0.8 * scale, 4]} />
          <meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} />
        </mesh>
      </group>
    );
  }

  if (type === 'fountain') {
    return (
      <group position={position}>
        <mesh position={[0, 0.3 * scale, 0]} castShadow>
          <cylinderGeometry args={[1.5 * scale, 1.8 * scale, 0.6 * scale, 12]} />
          <meshStandardMaterial color="#999999" />
        </mesh>
        <mesh position={[0, 0.6 * scale, 0]} castShadow>
          <cylinderGeometry args={[1.3 * scale, 1.3 * scale, 0.1 * scale, 12]} />
          <meshStandardMaterial color="#4488cc" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 1.2 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.1 * scale, 0.15 * scale, 1.2 * scale, 6]} />
          <meshStandardMaterial color="#aaaaaa" />
        </mesh>
        <mesh position={[0, 1.8 * scale, 0]} castShadow>
          <sphereGeometry args={[0.3 * scale, 8, 8]} />
          <meshStandardMaterial color="#bbbbbb" />
        </mesh>
      </group>
    );
  }

  if (type === 'stone_path') {
    return (
      <group position={position}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2 * scale, 2 * scale]} />
          <meshStandardMaterial color="#b8a898" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (type === 'lamppost') {
    return (
      <group position={position}>
        <mesh position={[0, 1.5 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.05 * scale, 0.08 * scale, 3 * scale, 6]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        <mesh position={[0, 3.1 * scale, 0]}>
          <sphereGeometry args={[0.2 * scale, 8, 8]} />
          <meshStandardMaterial color="#ffdd88" emissive="#ffaa44" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0, 3.1 * scale, 0]} intensity={0.5} distance={5} color="#ffdd88" />
      </group>
    );
  }

  if (type === 'bench') {
    return (
      <group position={position}>
        <mesh position={[0, 0.3 * scale, 0]} castShadow>
          <boxGeometry args={[1.5 * scale, 0.1 * scale, 0.5 * scale]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[-0.6 * scale, 0.15 * scale, 0]} castShadow>
          <boxGeometry args={[0.1 * scale, 0.3 * scale, 0.5 * scale]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[0.6 * scale, 0.15 * scale, 0]} castShadow>
          <boxGeometry args={[0.1 * scale, 0.3 * scale, 0.5 * scale]} />
          <meshStandardMaterial color="#8B6914" />
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

  if (type === 'torch') {
    return (
      <group position={position}>
        <mesh position={[0, 1 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.04 * scale, 0.06 * scale, 2 * scale, 6]} />
          <meshStandardMaterial color="#5a4a2a" />
        </mesh>
        <mesh position={[0, 2.1 * scale, 0]}>
          <sphereGeometry args={[0.15 * scale, 6, 6]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[0, 2.1 * scale, 0]} intensity={0.8} distance={6} color="#ff8844" />
      </group>
    );
  }

  if (type === 'pillar') {
    return (
      <group position={position}>
        <mesh position={[0, 2 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.4 * scale, 0.5 * scale, 4 * scale, 8]} />
          <meshStandardMaterial color={['#666666', '#777777', '#555555'][variant]} />
        </mesh>
        <mesh position={[0, 4.1 * scale, 0]} castShadow>
          <boxGeometry args={[1.2 * scale, 0.3 * scale, 1.2 * scale]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
    );
  }

  if (type === 'mushroom') {
    const capColor = ['#cc4444', '#cc8844', '#aa66cc'][variant];
    return (
      <group position={position}>
        <mesh position={[0, 0.2 * scale, 0]} castShadow>
          <cylinderGeometry args={[0.08 * scale, 0.1 * scale, 0.4 * scale, 6]} />
          <meshStandardMaterial color="#ddd8c8" />
        </mesh>
        <mesh position={[0, 0.45 * scale, 0]} castShadow>
          <sphereGeometry args={[0.25 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={capColor} />
        </mesh>
      </group>
    );
  }

  if (type === 'crack') {
    return (
      <group position={position}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, variant * 0.5]}>
          <planeGeometry args={[1.5 * scale, 0.3 * scale]} />
          <meshStandardMaterial color="#333333" roughness={1} />
        </mesh>
      </group>
    );
  }

  if (type === 'chest') {
    return (
      <group position={position}>
        <mesh position={[0, 0.3 * scale, 0]} castShadow>
          <boxGeometry args={[0.8 * scale, 0.6 * scale, 0.5 * scale]} />
          <meshStandardMaterial color="#8B6914" />
        </mesh>
        <mesh position={[0, 0.65 * scale, 0]} castShadow>
          <boxGeometry args={[0.82 * scale, 0.15 * scale, 0.52 * scale]} />
          <meshStandardMaterial color="#a07818" />
        </mesh>
        <mesh position={[0, 0.4 * scale, 0.26 * scale]}>
          <boxGeometry args={[0.15 * scale, 0.1 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#ffcc00" emissive="#aa8800" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }

  if (type === 'dungeon_wall') {
    return (
      <group position={position}>
        <mesh position={[0, 2 * scale, 0]} castShadow>
          <boxGeometry args={[4 * scale, 4 * scale, 0.5 * scale]} />
          <meshStandardMaterial color={['#444444', '#3a3a3a', '#555555'][variant]} roughness={0.95} />
        </mesh>
        <mesh position={[-1.5 * scale, 2.5 * scale, 0.26 * scale]}>
          <boxGeometry args={[0.8 * scale, 1 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.5 * scale, 2.5 * scale, 0.26 * scale]}>
          <boxGeometry args={[0.8 * scale, 1 * scale, 0.05 * scale]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    );
  }

  if (type === 'dungeon_floor_tile') {
    return (
      <group position={position}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3 * scale, 3 * scale]} />
          <meshStandardMaterial color={['#4a4a4a', '#555555', '#444444'][variant]} roughness={0.8} />
        </mesh>
      </group>
    );
  }

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

      {(mapData.npcs || []).map((npc) => (
        <NPC
          key={npc.id}
          id={npc.id}
          name={npc.name}
          sprite={npc.sprite}
          dialogId={npc.dialogId}
          position={npc.position}
        />
      ))}

      {(mapData.chests || []).map((chest) => (
        <Chest
          key={chest.id}
          id={chest.id}
          position={chest.position}
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
