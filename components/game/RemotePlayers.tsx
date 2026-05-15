'use client';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody } from '@react-three/rapier';
import { Billboard, Text } from '@react-three/drei';
import { CanvasTexture } from 'three';

function drawRemotePlayerTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Hair
  ctx.fillStyle = '#6a4a2a';
  ctx.beginPath();
  ctx.arc(32, 18, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6a4a';
  for (let i = 0; i < 4; i++) {
    const angle = -Math.PI / 2 + (i - 1.5) * 0.4;
    ctx.beginPath();
    ctx.arc(32 + Math.cos(angle) * 10, 18 + Math.sin(angle) * 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#ffd5a0';
  ctx.beginPath();
  ctx.arc(32, 20, 9, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(27, 18, 3, 3);
  ctx.fillRect(34, 18, 3, 3);
  ctx.fillStyle = 'white';
  ctx.fillRect(28, 19, 1, 1);
  ctx.fillRect(35, 19, 1, 1);

  // Body
  ctx.fillStyle = '#4da6ff';
  ctx.beginPath();
  ctx.moveTo(22, 26);
  ctx.lineTo(42, 26);
  ctx.lineTo(44, 42);
  ctx.lineTo(20, 42);
  ctx.closePath();
  ctx.fill();

  // Belt
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(22, 37, 20, 2);

  // Legs
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(24, 42, 6, 10);
  ctx.fillRect(34, 42, 6, 10);

  // Shoes
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(23, 50, 8, 3);
  ctx.fillRect(33, 50, 8, 3);

  return new CanvasTexture(canvas);
}

export function RemotePlayers() {
  const remotePlayers = useNetworkStore(state => state.remotePlayers);
  const requestTrade = useNetworkStore(state => state.requestTrade);
  const player = useGameStore(state => state.player);

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return drawRemotePlayerTexture();
  }, []);

  return (
    <group>
      {Object.entries(remotePlayers).map(([id, state]) => (
        <group key={id} position={[state.x, state.y, state.z]}>
          <RigidBody type="kinematicPosition">
            <Billboard follow>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  requestTrade(id, player.name);
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  requestTrade(id, player.name);
                }}
              >
                <planeGeometry args={[1.3, 1.3]} />
                {texture ? (
                  <meshBasicMaterial map={texture} transparent />
                ) : (
                  <meshBasicMaterial color="blue" />
                )}
              </mesh>
              <Text position={[0, 1, 0]} fontSize={0.18} color="white" outlineWidth={0.02} outlineColor="black">
                {state.name}
              </Text>
            </Billboard>
          </RigidBody>
        </group>
      ))}
    </group>
  );
}
