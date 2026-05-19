'use client';

import React, { Suspense } from 'react';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import { OrientationLock } from './OrientationLock';
import { DevToolsOverlay } from './ui/DevToolsOverlay';

export function GameWrapper({ characterName }: { characterName: string }) {
  return (
    <div className="w-full h-full relative bg-black overflow-hidden game-container">
      <OrientationLock />
      <Suspense fallback={null}>
         <GameScene characterName={characterName} />
      </Suspense>
      <HUD characterName={characterName} />
      <DevToolsOverlay />
    </div>
  );
}
