import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { DamageText } from '@/types/game';

function DamageNumber({ damage }: { damage: DamageText }) {
  const ref = useRef<any>(null);
  const startTime = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    ref.current.position.y = damage.position.y + elapsed * 2;
    ref.current.material.opacity = Math.max(0, 1 - elapsed * 1.5);
  });

  return (
    <Text
      ref={ref}
      position={[damage.position.x, damage.position.y, damage.position.z]}
      fontSize={0.5}
      color={damage.color}
      outlineWidth={0.05}
      outlineColor="black"
      fontWeight="bold"
      transparent
    >
      {damage.amount}
    </Text>
  );
}

export function DamageNumbers() {
  const damages = useGameStore((state) => state.damages);
  
  // Only render damages from the last 1.5 seconds
  const activeDamages = damages.filter(d => Date.now() - d.timestamp < 1500);

  return (
    <group>
      {activeDamages.map((d) => (
        <DamageNumber key={d.id} damage={d} />
      ))}
    </group>
  );
}
