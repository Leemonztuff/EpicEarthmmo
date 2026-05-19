'use client';

import React, { useRef } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Billboard, Text } from '@react-three/drei';
import { Sprite } from './Sprite';
import { type AnimState, type Direction } from '@/lib/spriteManager';

export function RemotePlayers() {
  const remotePlayers = useNetworkStore(state => state.remotePlayers || {});

  return (
    <>
      {Object.entries(remotePlayers || {}).map(([id, player]) => (
        <RemotePlayerSprite key={id} id={id} player={player} />
      ))}
    </>
  );
}

function RemotePlayerSprite({ id, player }: { id: string; player: { x: number; y: number; z: number; name?: string } }) {
  const animStateRef = useRef<AnimState>('idle');
  const directionRef = useRef<Direction>('S');

  return (
    <group position={[player.x || 0, player.y || 0.5, player.z || 0]}>
      <Billboard follow>
        <Sprite
          entityId="novice_m"
          state={animStateRef.current}
          direction={directionRef.current}
          width={1.2}
          height={1.2}
          billboard={false}
        />
        <group position={[0, 0.8, 0]}>
          <Text fontSize={0.15} color="white" outlineWidth={0.02} outlineColor="black">
            {player.name || 'Stranger'}
          </Text>
        </group>
      </Billboard>
    </group>
  );
}
