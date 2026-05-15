'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Player } from './Player';
import { Map } from './Map';
import { CameraController } from './CameraController';
import { NetworkManager } from './NetworkManager';
import { RemotePlayers } from './RemotePlayers';
import { QuarksRenderer } from './QuarksParticleSystem';
import { VirtualJoystick } from './VirtualJoystick';
import { OrientationLock } from './OrientationLock';

export default function GameScene() {
  return (
    <div className="w-full h-full" style={{ touchAction: 'none' }}>
      <NetworkManager />
      <Canvas shadows orthographic={false} dpr={[1, 2]} camera={{ fov: 45, position: [0, 15, 15] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight castShadow position={[10, 20, 10]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
          
          <QuarksRenderer />

          <Physics debug={false}>
             <Map />
             <Player />
             <RemotePlayers />
          </Physics>
          
          <CameraController />

          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <VirtualJoystick />
      <OrientationLock />
    </div>
  );
}

