'use client';

import React from 'react';

interface MapLightingProps {
  mapType: string;
  ambientColor?: string;
  ambientIntensity?: number;
  sunColor?: string;
  sunIntensity?: number;
  sunDirection?: [number, number, number];
  hemisphereSky?: string;
  hemisphereGround?: string;
  fakeAOIntensity?: number;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
}

function getDefaults(mapType: string) {
  if (mapType === 'dungeon') {
    return {
      ambientColor: '#444466', ambientIntensity: 0.15,
      sunColor: '#666688', sunIntensity: 0.3,
      hemisphereSky: '#2a2a3e', hemisphereGround: '#1a1a1a',
      fogColor: '#1a1a2e', fogNear: 5, fogFar: 30,
    };
  }
  if (mapType === 'field') {
    return {
      ambientColor: '#888888', ambientIntensity: 0.5,
      sunColor: '#ffffff', sunIntensity: 1.3,
      hemisphereSky: '#87CEEB', hemisphereGround: '#3a7d3a',
      fogColor: '#c9e8f0', fogNear: 20, fogFar: 50,
    };
  }
  return {
    ambientColor: '#888888', ambientIntensity: 0.4,
    sunColor: '#ffffff', sunIntensity: 1.2,
    hemisphereSky: '#a8d8ea', hemisphereGround: '#5a9d5a',
    fogColor: '#d4e8f0', fogNear: 20, fogFar: 50,
  };
}

export function MapLighting({
  mapType,
  ambientColor,
  ambientIntensity,
  sunColor,
  sunIntensity,
  hemisphereSky,
  hemisphereGround,
  fogColor,
  fogNear,
  fogFar,
}: MapLightingProps) {
  const d = getDefaults(mapType);

  return (
    <>
      <fog attach="fog" args={[fogColor ?? d.fogColor, fogNear ?? d.fogNear, fogFar ?? d.fogFar]} />
      <color attach="background" args={[fogColor ?? d.fogColor]} />

      <ambientLight
        color={ambientColor ?? d.ambientColor}
        intensity={ambientIntensity ?? d.ambientIntensity}
      />
      <hemisphereLight
        args={[hemisphereSky ?? d.hemisphereSky, hemisphereGround ?? d.hemisphereGround, 0.6]}
      />
      {mapType !== 'dungeon' && (
        <>
          <directionalLight
            castShadow
            position={[15, 25, 10]}
            intensity={sunIntensity ?? d.sunIntensity}
            color={sunColor ?? d.sunColor}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={25}
            shadow-camera-bottom={-25}
          />
          <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#b4d4ff" />
        </>
      )}
    </>
  );
}
