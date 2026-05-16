import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useNetworkStore } from '@/store/useNetworkStore';

interface WarpPortalProps {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  targetMapName: string;
  visual: string;
}

export function WarpPortal({ id, name, position, targetMapName, visual }: WarpPortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const requestWarp = useNetworkStore(state => state.requestWarp);
  const socketId = useNetworkStore(state => state.socketId);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handleInteract = () => {
    if (socketId) {
      requestWarp(id);
    }
  };

  const portalColor = visual === 'portal' ? '#8844ff' : visual === 'door' ? '#8B4513' : '#aaaaaa';

  return (
    <group position={[position.x, position.y, position.z]}>
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleInteract}
      >
        {visual === 'portal' && (
          <>
            <mesh>
              <torusGeometry args={[0.8, 0.15, 8, 32]} />
              <meshStandardMaterial
                color={portalColor}
                emissive={portalColor}
                emissiveIntensity={hovered ? 1.5 : 0.8}
                transparent
                opacity={0.9}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[0.7, 32]} />
              <meshStandardMaterial
                color="#6622cc"
                emissive="#4400aa"
                emissiveIntensity={hovered ? 1.0 : 0.5}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.9, 32]} />
              <meshStandardMaterial
                color="#aa66ff"
                emissive="#8844ff"
                emissiveIntensity={0.6}
                transparent
                opacity={0.4}
              />
            </mesh>
          </>
        )}

        {visual === 'door' && (
          <mesh>
            <boxGeometry args={[1.2, 2, 0.3]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        )}

        {visual === 'npc' && (
          <group>
            <mesh position={[0, 0.5, 0]}>
              <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
              <meshStandardMaterial color="#4488ff" />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial color="#ffcc88" />
            </mesh>
          </group>
        )}

        {visual === 'hidden' && (
          <mesh visible={hovered}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}
      </group>

      <Text
        position={[0, 1.5, 0]}
        fontSize={0.25}
        color={hovered ? '#ffff00' : '#ffffff'}
        outlineWidth={0.03}
        outlineColor="black"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {hovered && (
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.18}
          color="#aaddff"
          outlineWidth={0.02}
          outlineColor="black"
          anchorX="center"
          anchorY="middle"
        >
          Click to warp
        </Text>
      )}
    </group>
  );
}
