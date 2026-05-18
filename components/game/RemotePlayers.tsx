'use client';

import React from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Avatar } from '@/components/ui';
import { Billboard, Text } from '@react-three/drei';

export function RemotePlayers() {
  const remotePlayers = useNetworkStore(state => state.remotePlayers || {});

  return (
    <>
      {Object.entries(remotePlayers).map(([id, player]) => (
        <group key={id} position={[player.x || 0, player.y || 0.5, player.z || 0]}>
          <Billboard follow>
            <mesh>
              <planeGeometry args={[1.2, 1.2]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} />
            </mesh>
            <group position={[0, 0.8, 0]}>
               <Text fontSize={0.15} color="white" outlineWidth={0.02} outlineColor="black">
                  {player.name || 'Stranger'}
               </Text>
            </group>
          </Billboard>
        </group>
      ))}
    </>
  );
}
