'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Billboard, Text } from '@react-three/drei';
import { Sprite } from './Sprite';
import { type AnimState, type Direction } from '@/lib/spriteManager';
import type { PeerPlayerState } from '@/shared/types/network';

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

const smoothing = 6;

function RemotePlayerSprite({ id, player }: { id: string; player: PeerPlayerState }) {
  const groupRef = useRef<THREE.Group>(null);
  const displayPos = useRef({ x: player.x || 0, y: player.y || 0.5, z: player.z || 0 });
  const directionRef = useRef<Direction>((player.direction as Direction) || 'S');
  const animStateRef = useRef<AnimState>((player.animState as AnimState) || 'idle');

  useFrame((_state, delta) => {
    displayPos.current.x += ((player.x || 0) - displayPos.current.x) * smoothing * delta;
    displayPos.current.y += ((player.y || 0.5) - displayPos.current.y) * smoothing * delta;
    displayPos.current.z += ((player.z || 0) - displayPos.current.z) * smoothing * delta;

    if (groupRef.current) {
      groupRef.current.position.set(displayPos.current.x, displayPos.current.y, displayPos.current.z);
    }

    if (player.direction) {
      directionRef.current = player.direction as Direction;
    }
    if (player.animState) {
      animStateRef.current = player.animState as AnimState;
    }
  });

  return (
    <group ref={groupRef}>
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
