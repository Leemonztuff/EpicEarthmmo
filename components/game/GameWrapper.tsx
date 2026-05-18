'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Stars } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import GameScene from './GameScene';
import { HUD } from './HUD';
import { CameraController } from './CameraController';
import { OrientationLock } from './OrientationLock';
import { NetworkManager } from './NetworkManager';
import { useGameStore } from '@/store/useGameStore';
import { DevToolsOverlay } from './ui/DevToolsOverlay';

export function GameWrapper({ characterName }: { characterName: string }) {
  const currentMapId = useGameStore((state) => state.currentMapId);

  return (
    <div className="w-full h-full relative bg-black overflow-hidden game-container">
      <OrientationLock />

      {/* GameScene already contains NetworkManager, VirtualJoystick, and its own Canvas setup */}
      <GameScene characterName={characterName} />

      <HUD characterName={characterName} />
      <DevToolsOverlay />
    </div>
  );
}
