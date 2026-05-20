'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MapRegion, BakedLighting, Tile } from '@/shared/schemas';

const textureCache: Record<string, THREE.CanvasTexture> = {};

function createTerrainTexture(terrainType: string, baseColor: string): THREE.CanvasTexture {
  const key = `${terrainType}_${baseColor}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 128, 128);

  const noiseCount = terrainType === 'water' ? 500 : 2000;
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const shade = Math.random() * 40 - 20;

    if (terrainType === 'water') {
      const waveOffset = Math.sin(x * 0.1) * 10;
      ctx.fillStyle = `rgba(${100 + shade}, ${150 + shade + waveOffset}, ${200 + shade}, 0.6)`;
      ctx.fillRect(x, y, 3, 2);
    } else if (terrainType === 'grass') {
      ctx.fillStyle = `rgb(${80 + shade}, ${140 + shade}, ${50 + shade})`;
      ctx.fillRect(x, y, 2, 4 + Math.random() * 3);
    } else if (terrainType === 'dirt') {
      ctx.fillStyle = `rgb(${120 + shade}, ${90 + shade}, ${60 + shade})`;
      ctx.fillRect(x, y, 3, 3);
    } else if (terrainType === 'stone') {
      ctx.fillStyle = `rgb(${130 + shade}, ${130 + shade}, ${135 + shade})`;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    } else if (terrainType === 'sand') {
      ctx.fillStyle = `rgb(${210 + shade}, ${190 + shade}, ${140 + shade})`;
      ctx.fillRect(x, y, 2, 2);
    } else if (terrainType === 'snow') {
      ctx.fillStyle = `rgb(${240 + shade}, ${245 + shade}, ${250 + shade})`;
      ctx.fillRect(x, y, 2, 2);
    } else if (terrainType === 'ice') {
      ctx.fillStyle = `rgba(${180 + shade}, ${220 + shade}, ${240 + shade}, 0.7)`;
      ctx.fillRect(x, y, 4, 2);
    } else if (terrainType === 'swamp') {
      ctx.fillStyle = `rgb(${80 + shade}, ${100 + shade}, ${60 + shade})`;
      ctx.fillRect(x, y, 3, 3);
    } else if (terrainType === 'wood') {
      ctx.fillStyle = `rgb(${140 + shade}, ${100 + shade}, ${60 + shade})`;
      ctx.fillRect(x, y, 8, 2);
    } else if (terrainType === 'carpet') {
      ctx.fillStyle = `rgb(${160 + shade}, ${60 + shade}, ${60 + shade})`;
      ctx.fillRect(x, y, 2, 2);
    } else if (terrainType === 'lava') {
      ctx.fillStyle = `rgb(${200 + shade}, ${80 + shade}, ${20 + shade})`;
      ctx.fillRect(x, y, 3, 3);
    } else {
      ctx.fillStyle = `rgb(${128 + shade}, ${128 + shade}, ${128 + shade})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  textureCache[key] = tex;
  return tex;
}

function createBlendedTexture(
  baseType: string,
  baseColor: string,
  blends: { north: number; south: number; east: number; west: number },
  neighborTypes: { north?: string; south?: string; east?: string; west?: string },
): THREE.CanvasTexture {
  const baseTex = createTerrainTexture(baseType, baseColor);
  const hasBlend = blends.north > 0 || blends.south > 0 || blends.east > 0 || blends.west > 0;
  if (!hasBlend) return baseTex;

  const key = `blend_${baseType}_${JSON.stringify(blends)}_${JSON.stringify(neighborTypes)}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(baseTex.image as HTMLCanvasElement, 0, 0);

  const blendColor = (x: number, y: number, blendAmount: number, type: string) => {
    if (blendAmount <= 0) return;
    const neighborTex = createTerrainTexture(type, '#888888');
    ctx.globalAlpha = blendAmount * 0.5;
    ctx.drawImage(neighborTex.image as HTMLCanvasElement, 0, 0);
    ctx.globalAlpha = 1;
  };

  const edgeSize = 16;
  if (blends.north > 0 && neighborTypes.north) {
    const gradient = ctx.createLinearGradient(0, 0, 0, edgeSize);
    gradient.addColorStop(0, `rgba(0,0,0,${blends.north * 0.4})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, edgeSize);
  }
  if (blends.south > 0 && neighborTypes.south) {
    const gradient = ctx.createLinearGradient(0, 128 - edgeSize, 0, 128);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${blends.south * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 128 - edgeSize, 128, edgeSize);
  }
  if (blends.east > 0 && neighborTypes.east) {
    const gradient = ctx.createLinearGradient(128 - edgeSize, 0, 128, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${blends.east * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(128 - edgeSize, 0, edgeSize, 128);
  }
  if (blends.west > 0 && neighborTypes.west) {
    const gradient = ctx.createLinearGradient(0, 0, edgeSize, 0);
    gradient.addColorStop(0, `rgba(0,0,0,${blends.west * 0.4})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, edgeSize, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  textureCache[key] = tex;
  return tex;
}

const TERRAIN_COLORS: Record<string, string> = {
  grass: '#5a9a3a', dirt: '#8a6a4a', stone: '#888890', sand: '#d4b87a',
  snow: '#e8eef4', water: '#4488aa', lava: '#cc4400', wood: '#8a6432',
  carpet: '#aa3a3a', ice: '#aaddcc', swamp: '#5a6a3a', bridge: '#9a7a5a',
};

interface TileInstanceProps {
  tile: Tile;
  tileSize: number;
  worldOffsetX: number;
  worldOffsetZ: number;
  neighbors?: { north?: string; south?: string; east?: string; west?: string };
}

function TileInstance({ tile, tileSize, worldOffsetX, worldOffsetZ, neighbors }: TileInstanceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const color = TERRAIN_COLORS[tile.terrainType] ?? '#888888';
    if (tile.blendNorth || tile.blendSouth || tile.blendEast || tile.blendWest) {
      return createBlendedTexture(tile.terrainType, color, {
        north: tile.blendNorth, south: tile.blendSouth,
        east: tile.blendEast, west: tile.blendWest,
      }, neighbors ?? {});
    }
    return createTerrainTexture(tile.terrainType, color);
  }, [tile.terrainType, tile.blendNorth, tile.blendSouth, tile.blendEast, tile.blendWest, neighbors]);

  const wx = tile.position[0] * tileSize + worldOffsetX + tileSize / 2;
  const wz = tile.position[1] * tileSize + worldOffsetZ + tileSize / 2;
  const y = tile.height;

  return (
    <mesh ref={meshRef} position={[wx, y - 0.01, wz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[tileSize, tileSize]} />
      <meshStandardMaterial map={tex} roughness={0.8} metalness={0} />
    </mesh>
  );
}

interface TerrainRendererProps {
  tiles: Tile[];
  tileSize?: number;
  worldOffsetX?: number;
  worldOffsetZ?: number;
  dimensions: { width: number; height: number };
}

export function TerrainRenderer({ tiles, tileSize = 1, worldOffsetX = 0, worldOffsetZ = 0, dimensions }: TerrainRendererProps) {
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    for (const tile of tiles) {
      map.set(`${tile.position[0]},${tile.position[1]}`, tile);
    }
    return map;
  }, [tiles]);

  const tileInstances = useMemo(() => {
    const instances: Array<{ tile: Tile; neighbors: { north?: string; south?: string; east?: string; west?: string } }> = [];

    for (const tile of tiles) {
      const [tx, tz] = tile.position;
      const north = tileMap.get(`${tx},${tz - 1}`);
      const south = tileMap.get(`${tx},${tz + 1}`);
      const east = tileMap.get(`${tx + 1},${tz}`);
      const west = tileMap.get(`${tx - 1},${tz}`);

      instances.push({
        tile,
        neighbors: {
          north: north?.terrainType,
          south: south?.terrainType,
          east: east?.terrainType,
          west: west?.terrainType,
        },
      });
    }

    return instances;
  }, [tiles, tileMap]);

  if (tiles.length === 0) {
    const halfW = dimensions.width / 2;
    const halfH = dimensions.height / 2;
    return (
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dimensions.width, dimensions.height]} />
        <meshStandardMaterial color="#5a9a3a" roughness={0.8} />
      </mesh>
    );
  }

  return (
    <group>
      {tileInstances.map(({ tile, neighbors }, i) => (
        <TileInstance
          key={i}
          tile={tile}
          tileSize={tileSize}
          worldOffsetX={worldOffsetX}
          worldOffsetZ={worldOffsetZ}
          neighbors={neighbors}
        />
      ))}
    </group>
  );
}
