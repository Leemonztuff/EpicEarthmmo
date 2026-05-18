'use client';

import React from 'react';
import { GameScene } from './GameScene';
import { HUD } from './HUD';
import { OrientationLock } from './OrientationLock';
import { DevToolsOverlay } from './ui/DevToolsOverlay';

export function GameWrapper({ characterName }: { characterName: string }) {
  return (
    <div className="w-full h-full relative bg-black overflow-hidden game-container">
      <OrientationLock />
      <GameScene characterName={characterName} />
      <HUD characterName={characterName} />
      <DevToolsOverlay />
    </div>
  );
}
