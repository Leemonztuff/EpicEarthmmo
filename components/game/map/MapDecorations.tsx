'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '@/store/useGameStore';
import type { MapDecoration, TileLayer } from '@/shared/schemas';

type DecoType = 'tree' | 'bush' | 'rock' | 'flower' | 'building' | 'fence' | 'well' | 'sign' | 'castle' | 'castle_tower_left' | 'castle_tower_right' | 'castle_gate' | 'building_large' | 'building_medium' | 'building_small' | 'fountain' | 'stone_path' | 'lamppost' | 'bench' | 'tree_ornamental' | 'torch' | 'pillar' | 'mushroom' | 'crack' | 'chest' | 'dungeon_wall' | 'dungeon_floor_tile';

const DECO_SHADOW_SIZES: Partial<Record<DecoType, number>> = {
  tree: 2, tree_ornamental: 1.5, bush: 1, rock: 0.6,
  castle: 6, castle_tower_left: 3, castle_tower_right: 3, castle_gate: 2.5,
  building_large: 3.5, building_medium: 2.5, building_small: 2,
  fountain: 1.8, lamppost: 0.5, bench: 1, fence: 1.5,
  well: 1, sign: 0.5, torch: 0.3, pillar: 0.8,
  mushroom: 0.4, chest: 0.8,
};

export function Decoration({ position, scale = 1, type = 'tree', hasCollision = false, lodDistance = 50 }: { position: [number, number, number]; scale?: number; type?: DecoType; hasCollision?: boolean; lodDistance?: number }) {
  const variant = useMemo(() => Math.floor(Math.random() * 3), []);
  const [visible, setVisible] = useState(true);
  const playerPos = useGameStore((state) => state.position);

  useEffect(() => {
    const dx = position[0] - playerPos.x;
    const dz = position[2] - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    setVisible(dist < lodDistance);
  }, [position, lodDistance, playerPos.x, playerPos.z]);

  if (!visible) return null;

  const shadowSize = DECO_SHADOW_SIZES[type];
  const shadow = shadowSize ? (
    <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[shadowSize * scale, shadowSize * scale]} />
      <meshBasicMaterial color="black" transparent opacity={0.15} depthWrite={false} />
    </mesh>
  ) : null;

  const content = (
    <>
      {shadow}
      {type === 'tree' && (
        <group position={position}>
          <mesh position={[0, 0.5 * scale, 0]} castShadow><cylinderGeometry args={[0.08 * scale, 0.15 * scale, 1 * scale, 6]} /><meshStandardMaterial color="#6B4226" /></mesh>
          <mesh position={[0, 1.2 * scale + 0.3 * scale, 0]} castShadow><coneGeometry args={[1.2 * scale, 1.0 * scale, 8]} /><meshStandardMaterial color={['#2d7d2d', '#358535', '#3d8d3d'][variant]} /></mesh>
          <mesh position={[0.2 * scale, 1.8 * scale, 0.2 * scale]} castShadow><coneGeometry args={[0.8 * scale, 0.8 * scale, 8]} /><meshStandardMaterial color={['#3d8d3d', '#459545', '#4d9d4d'][variant]} /></mesh>
        </group>
      )}
      {type === 'tree_ornamental' && (
        <group position={position}>
          <mesh position={[0, 0.4 * scale, 0]} castShadow><cylinderGeometry args={[0.06 * scale, 0.12 * scale, 0.8 * scale, 6]} /><meshStandardMaterial color="#8B6914" /></mesh>
          <mesh position={[0, 1.0 * scale, 0]} castShadow><sphereGeometry args={[0.6 * scale, 8, 6]} /><meshStandardMaterial color={['#3a8a3a', '#4a9a4a', '#2d7d2d'][variant]} /></mesh>
        </group>
      )}
      {type === 'bush' && <mesh position={position} castShadow><sphereGeometry args={[0.5 * scale, 6, 6]} /><meshStandardMaterial color={['#3a8a3a', '#4a9a4a', '#5aaa5a'][variant]} /></mesh>}
      {type === 'rock' && <mesh position={[position[0], position[1] + 0.15 * scale, position[2]]} castShadow><dodecahedronGeometry args={[0.3 * scale, 0]} /><meshStandardMaterial color={['#777', '#888', '#999'][variant]} roughness={0.9} /></mesh>}
      {type === 'flower' && (() => { const color = ['#ff6b8a', '#ffeb3b', '#ff8a65', '#e040fb', '#40c4ff'][variant]; return (<group position={position}><mesh position={[0, 0.15 * scale, 0]}><planeGeometry args={[0.2 * scale, 0.3 * scale]} /><meshBasicMaterial color="#4a8a3a" depthWrite={false} /></mesh><mesh position={[0, 0.35 * scale, 0]}><planeGeometry args={[0.3 * scale, 0.3 * scale]} /><meshBasicMaterial color={color} depthWrite={false} /></mesh></group>); })()}
      {type === 'castle' && (<group position={position}><mesh position={[0, 3 * scale, 0]} castShadow><boxGeometry args={[12 * scale, 6 * scale, 6 * scale]} /><meshStandardMaterial color="#d4c4a8" /></mesh><mesh position={[0, 6.5 * scale, 0]} castShadow><boxGeometry args={[13 * scale, 1 * scale, 7 * scale]} /><meshStandardMaterial color="#c4b498" /></mesh><mesh position={[0, 7 * scale, -1 * scale]} castShadow><coneGeometry args={[2 * scale, 2 * scale, 4]} /><meshStandardMaterial color="#8b0000" /></mesh></group>)}
      {type === 'castle_tower_left' && (<group position={position}><mesh position={[-5 * scale, 4 * scale, -2 * scale]} castShadow><cylinderGeometry args={[1.5 * scale, 1.8 * scale, 8 * scale, 8]} /><meshStandardMaterial color="#d4c4a8" /></mesh><mesh position={[-5 * scale, 8.5 * scale, -2 * scale]} castShadow><coneGeometry args={[2 * scale, 2 * scale, 8]} /><meshStandardMaterial color="#8b0000" /></mesh></group>)}
      {type === 'castle_tower_right' && (<group position={position}><mesh position={[5 * scale, 4 * scale, -2 * scale]} castShadow><cylinderGeometry args={[1.5 * scale, 1.8 * scale, 8 * scale, 8]} /><meshStandardMaterial color="#d4c4a8" /></mesh><mesh position={[5 * scale, 8.5 * scale, -2 * scale]} castShadow><coneGeometry args={[2 * scale, 2 * scale, 8]} /><meshStandardMaterial color="#8b0000" /></mesh></group>)}
      {type === 'castle_gate' && (<group position={position}><mesh position={[0, 1.5 * scale, -2.5 * scale]} castShadow><boxGeometry args={[4 * scale, 3 * scale, 1 * scale]} /><meshStandardMaterial color="#8B6914" /></mesh><mesh position={[0, 2.5 * scale, -2.8 * scale]}><boxGeometry args={[3 * scale, 2 * scale, 0.3 * scale]} /><meshStandardMaterial color="#5a4a2a" /></mesh></group>)}
      {type === 'building_large' && (<group position={position}><mesh position={[0, 2 * scale, 0]} castShadow><boxGeometry args={[5 * scale, 4 * scale, 4 * scale]} /><meshStandardMaterial color={['#c4a882', '#b89b78', '#d0b892'][variant]} /></mesh><mesh position={[0, 4.3 * scale, 0]} castShadow><coneGeometry args={[3.5 * scale, 1.5 * scale, 4]} /><meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} /></mesh><mesh position={[0, 1.5 * scale, 2.01 * scale]}><boxGeometry args={[1 * scale, 1.5 * scale, 0.1 * scale]} /><meshStandardMaterial color="#5a4a2a" /></mesh></group>)}
      {type === 'building_medium' && (<group position={position}><mesh position={[0, 1.5 * scale, 0]} castShadow><boxGeometry args={[4 * scale, 3 * scale, 3 * scale]} /><meshStandardMaterial color={['#c4a882', '#b89b78', '#d0b892'][variant]} /></mesh><mesh position={[0, 3.3 * scale, 0]} castShadow><coneGeometry args={[2.8 * scale, 1.2 * scale, 4]} /><meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} /></mesh></group>)}
      {type === 'building_small' && (<group position={position}><mesh position={[0, 1 * scale, 0]} castShadow><boxGeometry args={[3 * scale, 2 * scale, 2.5 * scale]} /><meshStandardMaterial color={['#d4b896', '#c4a882', '#b89b78'][variant]} /></mesh><mesh position={[0, 2.2 * scale, 0]} castShadow><coneGeometry args={[2.2 * scale, 0.8 * scale, 4]} /><meshStandardMaterial color={['#8b4513', '#a0522d', '#6b3410'][variant]} /></mesh></group>)}
      {type === 'fountain' && (<group position={position}><mesh position={[0, 0.3 * scale, 0]} castShadow><cylinderGeometry args={[1.5 * scale, 1.8 * scale, 0.6 * scale, 12]} /><meshStandardMaterial color="#999999" /></mesh><mesh position={[0, 0.6 * scale, 0]} castShadow><cylinderGeometry args={[1.3 * scale, 1.3 * scale, 0.1 * scale, 12]} /><meshStandardMaterial color="#4488cc" transparent opacity={0.7} /></mesh><mesh position={[0, 1.2 * scale, 0]} castShadow><cylinderGeometry args={[0.1 * scale, 0.15 * scale, 1.2 * scale, 6]} /><meshStandardMaterial color="#aaaaaa" /></mesh><mesh position={[0, 1.8 * scale, 0]} castShadow><sphereGeometry args={[0.3 * scale, 8, 8]} /><meshStandardMaterial color="#bbbbbb" /></mesh></group>)}
      {type === 'stone_path' && (<group position={position}><mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2 * scale, 2 * scale]} /><meshStandardMaterial color="#b8a898" roughness={0.9} /></mesh></group>)}
      {type === 'lamppost' && (<group position={position}><mesh position={[0, 1.5 * scale, 0]} castShadow><cylinderGeometry args={[0.05 * scale, 0.08 * scale, 3 * scale, 6]} /><meshStandardMaterial color="#444444" /></mesh><mesh position={[0, 3.1 * scale, 0]}><sphereGeometry args={[0.2 * scale, 8, 8]} /><meshStandardMaterial color="#ffdd88" emissive="#ffaa44" emissiveIntensity={0.5} /></mesh><pointLight position={[0, 3.1 * scale, 0]} intensity={0.5} distance={5} color="#ffdd88" /></group>)}
      {type === 'bench' && (<group position={position}><mesh position={[0, 0.3 * scale, 0]} castShadow><boxGeometry args={[1.5 * scale, 0.1 * scale, 0.5 * scale]} /><meshStandardMaterial color="#8B6914" /></mesh><mesh position={[-0.6 * scale, 0.15 * scale, 0]} castShadow><boxGeometry args={[0.1 * scale, 0.3 * scale, 0.5 * scale]} /><meshStandardMaterial color="#8B6914" /></mesh><mesh position={[0.6 * scale, 0.15 * scale, 0]} castShadow><boxGeometry args={[0.1 * scale, 0.3 * scale, 0.5 * scale]} /><meshStandardMaterial color="#8B6914" /></mesh></group>)}
      {type === 'fence' && (<group position={position}><mesh position={[0, 0.3 * scale, 0]} castShadow><boxGeometry args={[1.5 * scale, 0.6 * scale, 0.1 * scale]} /><meshStandardMaterial color="#8B7355" /></mesh><mesh position={[-0.6 * scale, 0.3 * scale, 0]} castShadow><boxGeometry args={[0.1 * scale, 0.8 * scale, 0.1 * scale]} /><meshStandardMaterial color="#8B7355" /></mesh><mesh position={[0.6 * scale, 0.3 * scale, 0]} castShadow><boxGeometry args={[0.1 * scale, 0.8 * scale, 0.1 * scale]} /><meshStandardMaterial color="#8B7355" /></mesh></group>)}
      {type === 'well' && (<group position={position}><mesh position={[0, 0.3 * scale, 0]} castShadow><cylinderGeometry args={[0.5 * scale, 0.5 * scale, 0.6 * scale, 8]} /><meshStandardMaterial color="#888888" /></mesh><mesh position={[0, 0.6 * scale, 0]} castShadow><torusGeometry args={[0.5 * scale, 0.05 * scale, 8, 16]} /><meshStandardMaterial color="#777777" /></mesh></group>)}
      {type === 'sign' && (<group position={position}><mesh position={[0, 0.5 * scale, 0]} castShadow><cylinderGeometry args={[0.05 * scale, 0.05 * scale, 1 * scale, 6]} /><meshStandardMaterial color="#6B4226" /></mesh><mesh position={[0, 0.9 * scale, 0]} castShadow><boxGeometry args={[0.6 * scale, 0.4 * scale, 0.05 * scale]} /><meshStandardMaterial color="#c4a882" /></mesh></group>)}
      {type === 'torch' && (<group position={position}><mesh position={[0, 1 * scale, 0]} castShadow><cylinderGeometry args={[0.04 * scale, 0.06 * scale, 2 * scale, 6]} /><meshStandardMaterial color="#5a4a2a" /></mesh><mesh position={[0, 2.1 * scale, 0]}><sphereGeometry args={[0.15 * scale, 6, 6]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1} transparent opacity={0.9} /></mesh><pointLight position={[0, 2.1 * scale, 0]} intensity={0.8} distance={6} color="#ff8844" /></group>)}
      {type === 'pillar' && (<group position={position}><mesh position={[0, 2 * scale, 0]} castShadow><cylinderGeometry args={[0.4 * scale, 0.5 * scale, 4 * scale, 8]} /><meshStandardMaterial color={['#666666', '#777777', '#555555'][variant]} /></mesh><mesh position={[0, 4.1 * scale, 0]} castShadow><boxGeometry args={[1.2 * scale, 0.3 * scale, 1.2 * scale]} /><meshStandardMaterial color="#666666" /></mesh></group>)}
      {type === 'mushroom' && (() => { const capColor = ['#cc4444', '#cc8844', '#aa66cc'][variant]; return (<group position={position}><mesh position={[0, 0.2 * scale, 0]} castShadow><cylinderGeometry args={[0.08 * scale, 0.1 * scale, 0.4 * scale, 6]} /><meshStandardMaterial color="#ddd8c8" /></mesh><mesh position={[0, 0.45 * scale, 0]} castShadow><sphereGeometry args={[0.25 * scale, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={capColor} /></mesh></group>); })()}
      {type === 'crack' && (<group position={position}><mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, variant * 0.5]}><planeGeometry args={[1.5 * scale, 0.3 * scale]} /><meshStandardMaterial color="#333333" roughness={1} /></mesh></group>)}
      {type === 'chest' && (<group position={position}><mesh position={[0, 0.3 * scale, 0]} castShadow><boxGeometry args={[0.8 * scale, 0.6 * scale, 0.5 * scale]} /><meshStandardMaterial color="#8B6914" /></mesh><mesh position={[0, 0.65 * scale, 0]} castShadow><boxGeometry args={[0.82 * scale, 0.15 * scale, 0.52 * scale]} /><meshStandardMaterial color="#a07818" /></mesh><mesh position={[0, 0.4 * scale, 0.26 * scale]}><boxGeometry args={[0.15 * scale, 0.1 * scale, 0.05 * scale]} /><meshStandardMaterial color="#ffcc00" emissive="#aa8800" emissiveIntensity={0.3} /></mesh></group>)}
      {type === 'dungeon_wall' && (<group position={position}><mesh position={[0, 2 * scale, 0]} castShadow><boxGeometry args={[4 * scale, 4 * scale, 0.5 * scale]} /><meshStandardMaterial color={['#444444', '#3a3a3a', '#555555'][variant]} roughness={0.95} /></mesh><mesh position={[-1.5 * scale, 2.5 * scale, 0.26 * scale]}><boxGeometry args={[0.8 * scale, 1 * scale, 0.05 * scale]} /><meshStandardMaterial color="#333333" /></mesh><mesh position={[1.5 * scale, 2.5 * scale, 0.26 * scale]}><boxGeometry args={[0.8 * scale, 1 * scale, 0.05 * scale]} /><meshStandardMaterial color="#333333" /></mesh></group>)}
      {type === 'dungeon_floor_tile' && (<group position={position}><mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3 * scale, 3 * scale]} /><meshStandardMaterial color={['#4a4a4a', '#555555', '#444444'][variant]} roughness={0.8} /></mesh></group>)}
    </>
  );

  if (hasCollision) {
    return <RigidBody type="fixed" colliders="trimesh">{content}</RigidBody>;
  }

  return <group>{content}</group>;
}

const LAYER_ORDER: TileLayer[] = ['terrain', 'shadows', 'decorations', 'effects', 'ceiling', 'entities'];

export function MapDecorations({ decorations, playerPosition }: { decorations: MapDecoration[]; playerPosition: { x: number; y: number; z: number } }) {
  const layers = useMemo(() => {
    const grouped: Record<string, MapDecoration[]> = {};
    for (const layer of LAYER_ORDER) {
      grouped[layer] = [];
    }

    for (const deco of decorations) {
      const layer = deco.layer ?? 'decorations';
      if (!grouped[layer]) grouped[layer] = [];
      grouped[layer].push(deco);
    }

    return grouped;
  }, [decorations]);

  return (
    <group>
      {LAYER_ORDER.map((layerName) => {
        const items = layers[layerName] ?? [];
        if (items.length === 0) return null;

        return (
          <group key={layerName} name={`layer-${layerName}`}>
            {items.map((deco, i) => {
              const dx = deco.position[0] - playerPosition.x;
              const dz = deco.position[2] - playerPosition.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist > deco.lodFar) return null;

              return (
                <Decoration
                  key={`${layerName}-${i}`}
                  position={deco.position}
                  type={deco.type as any}
                  scale={deco.scale}
                  hasCollision={deco.hasCollision}
                  lodDistance={deco.lodFar}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
