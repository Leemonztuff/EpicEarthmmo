'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Player } from './Player';
import { Map } from './Map';
import { CameraController } from './CameraController';
import { NetworkManager } from './NetworkManager';
import { RemotePlayers } from './RemotePlayers';
import { QuarksRenderer } from './QuarksParticleSystem';
import { VirtualJoystick } from './VirtualJoystick';
import { OrientationLock } from './OrientationLock';
import { ScreenShake } from './ScreenShake';
import { useNetworkStore } from '@/store/useNetworkStore';

const defaultMapData = {
  mapId: 'prontera',
  mapName: 'Prontera',
  mapType: 'town',
  dimensions: { width: 80, height: 80 },
  warps: [],
  safeZones: [],
  decorations: [],
  grassTuftCount: 50,
  grassTexture: { baseColor: '#c4a882', repeatX: 20, repeatY: 20 },
  floorColor: '#c4a882',
};

function DynamicMap() {
  const mapData = useNetworkStore(state => state.currentMapData);
  return <Map mapData={mapData || defaultMapData} />;
}

function MapAtmosphere() {
  const mapType = useNetworkStore(state => state.currentMapData?.mapType);

  if (mapType === 'dungeon') {
    return (
      <>
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 5, 35]} />
        <ambientLight intensity={0.15} />
        <hemisphereLight args={['#2a2a3e', '#1a1a1a', 0.1]} />
      </>
    );
  }

  if (mapType === 'field') {
    return (
      <>
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#c9e8f0', 25, 60]} />
        <hemisphereLight args={['#87CEEB', '#3a7d3a', 0.7]} />
        <ambientLight intensity={0.5} />
      </>
    );
  }

  return (
    <>
      <color attach="background" args={['#a8d8ea']} />
      <fog attach="fog" args={['#d4e8f0', 20, 50]} />
      <hemisphereLight args={['#a8d8ea', '#5a9d5a', 0.6]} />
      <ambientLight intensity={0.4} />
    </>
  );
}

export default function GameScene({ characterName }: { characterName?: string }) {
  const mapType = useNetworkStore(state => state.currentMapData?.mapType);

  return (
    <div className="w-full h-full" style={{ touchAction: 'none' }}>
      <NetworkManager playerName={characterName || 'Player'} />
      <Canvas shadows orthographic={false} dpr={[1, 2]} camera={{ fov: 50, position: [0, 14, 16], near: 0.1, far: 100 }}>
        <Suspense fallback={null}>
          <MapAtmosphere />

          {mapType !== 'dungeon' && (
            <directionalLight
              castShadow
              position={[15, 25, 10]}
              intensity={mapType === 'field' ? 1.3 : 1.2}
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
            />
          )}

          {mapType !== 'dungeon' && (
            <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#b4d4ff" />
          )}

          <QuarksRenderer />

          <Physics debug={false}>
             <DynamicMap />
             <Player />
             <RemotePlayers />
          </Physics>

          <CameraController />
          <ScreenShake />

          <EffectComposer>
            <Bloom
              luminanceThreshold={mapType === 'dungeon' ? 0.3 : 0.8}
              luminanceSmoothing={0.7}
              height={300}
              intensity={mapType === 'dungeon' ? 0.8 : 0.5}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <VirtualJoystick />
      <OrientationLock />
    </div>
  );
}
