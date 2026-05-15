'use client';
import React, { useMemo, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody } from '@react-three/rapier';
import { Billboard, Text } from '@react-three/drei';
import { CanvasTexture } from 'three';

export function RemotePlayers() {
  const remotePlayers = useNetworkStore(state => state.remotePlayers);
  const requestTrade = useNetworkStore(state => state.requestTrade);
  const player = useGameStore(state => state.player);

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4da6ff';
      ctx.beginPath();
      ctx.arc(32, 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(20, 32, 24, 24);
    }
    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    return () => { texture?.dispose(); };
  }, [texture]);

  return (
    <group>
      {Object.entries(remotePlayers).map(([id, state]) => (
        <RigidBody key={id} position={[state.x, state.y, state.z]} type="kinematicPosition">
          <Billboard follow={true}>
            <mesh 
              onClick={(e) => {
                e.stopPropagation();
                // Check if right click (not perfectly native with R3F onClick but we'll request trade on normal click for mock purposes)
                requestTrade(id, player.name);
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                requestTrade(id, player.name);
              }}
            >
              <planeGeometry args={[1.5, 1.5]} />
              {texture ? (
                <meshBasicMaterial map={texture} transparent={true} />
              ) : (
                <meshBasicMaterial color="blue" />
              )}
            </mesh>
            <Text
              position={[0, 1.2, 0]}
              fontSize={0.2}
              color="white"
              outlineWidth={0.02}
              outlineColor="black"
            >
              {state.name}
            </Text>
          </Billboard>
        </RigidBody>
      ))}
    </group>
  );
}
