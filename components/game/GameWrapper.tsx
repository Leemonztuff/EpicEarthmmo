'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const GameSceneNoSSR = dynamic(
  () => import('./GameScene'),
  { ssr: false }
);

export function GameWrapper({ characterName }: { characterName?: string }) {
  return <GameSceneNoSSR characterName={characterName} />;
}
