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

export default function GameScene() {
  return (
    <div className="w-full h-full" style={{ touchAction: 'none' }}>
      <NetworkManager />
      <Canvas shadows orthographic={false} dpr={[1, 2]} camera={{ fov: 50, position: [0, 14, 16], near: 0.1, far: 100 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#87CEEB']} />
          <fog attach="fog" args={['#c9e8f0', 20, 50]} />

          <hemisphereLight args={['#87CEEB', '#3a7d3a', 0.6]} />
          <ambientLight intensity={0.4} />
          <directionalLight
            castShadow
            position={[15, 25, 10]}
            intensity={1.2}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#b4d4ff" />

          <QuarksRenderer />

          <Physics debug={false}>
             <Map />
             <Player />
             <RemotePlayers />
          </Physics>

          <CameraController />

          <EffectComposer>
            <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.7} height={300} intensity={0.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <VirtualJoystick />
      <OrientationLock />
    </div>
  );
}

