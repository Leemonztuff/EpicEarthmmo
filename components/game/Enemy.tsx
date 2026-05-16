import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group as TGroup } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody } from '@react-three/rapier';

function drawPoring(ctx: CanvasRenderingContext2D) {
  const w = 64, h = 64;
  // Body
  ctx.fillStyle = '#ff8cb0';
  ctx.beginPath();
  ctx.ellipse(32, 36, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lighter belly
  ctx.fillStyle = '#ffb0d0';
  ctx.beginPath();
  ctx.ellipse(32, 38, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 28, 6, 6);
  ctx.fillRect(40, 28, 6, 6);
  // Eye shine
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 29, 2, 2);
  ctx.fillRect(42, 29, 2, 2);
  // Mouth
  ctx.fillStyle = '#cc6688';
  ctx.beginPath();
  ctx.arc(32, 40, 4, 0.1, Math.PI - 0.1);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Cheeks
  ctx.fillStyle = '#ffb0b0';
  ctx.beginPath();
  ctx.arc(16, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(48, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  // Horns/ears
  ctx.fillStyle = '#e07090';
  ctx.beginPath();
  ctx.ellipse(14, 22, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(50, 22, 4, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFabre(ctx: CanvasRenderingContext2D) {
  // Caterpillar-like
  const segments = [
    { x: 32, y: 42, r: 8, color: '#6ab04c' },
    { x: 32, y: 34, r: 7, color: '#7dce5a' },
    { x: 32, y: 27, r: 6, color: '#8de06a' },
    { x: 32, y: 21, r: 5, color: '#9df07a' },
  ];
  for (const seg of segments) {
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(28, 20, 3, 4);
  ctx.fillRect(33, 20, 3, 4);
  // Antennae
  ctx.strokeStyle = '#5a9a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 17);
  ctx.lineTo(22, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, 17);
  ctx.lineTo(42, 10);
  ctx.stroke();
  // Antenna tips
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(22, 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(42, 10, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPupa(ctx: CanvasRenderingContext2D) {
  // Shell
  ctx.fillStyle = '#c4a87a';
  ctx.beginPath();
  ctx.ellipse(32, 34, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shell pattern
  ctx.strokeStyle = '#a08060';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.4;
    ctx.beginPath();
    ctx.moveTo(32, 34);
    ctx.lineTo(32 + Math.cos(angle) * 14, 34 + Math.sin(angle) * 14);
    ctx.stroke();
  }
  // Head peek
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.ellipse(32, 18, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(28, 16, 3, 3);
  ctx.fillRect(33, 16, 3, 3);
}

function drawEnemyTexture(name: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  switch (name) {
    case 'Fabre': drawFabre(ctx); break;
    case 'Pupa': drawPupa(ctx); break;
    default: drawPoring(ctx); break;
  }
  return new CanvasTexture(canvas);
}

export function Enemy({ id }: { id: string }) {
  const spriteRef = useRef<TGroup>(null);
  const enemy = useGameStore(state => state.enemies[id]);
  const setSelectedTargetId = useGameStore(state => state.setSelectedTargetId);
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const isSelected = selectedTargetId === id;

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return drawEnemyTexture(enemy?.name || 'Poring');
  }, [enemy?.name]);

  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const floatSpeed = useMemo(() => 0.8 + Math.random() * 0.4, []);

  useFrame((state) => {
    if (spriteRef.current) {
      spriteRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed + floatOffset) * 0.06;
    }
  });

  if (!enemy || enemy.isDead) return null;

  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  const hpColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#facc15' : '#ef4444';

  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      <RigidBody type="fixed">
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <group
            ref={spriteRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelectedTargetId(id);
            }}
          >
            {isSelected && (
              <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.55, 0.7, 32]} />
                <meshBasicMaterial color="#ffd700" transparent opacity={0.5} />
              </mesh>
            )}
            <mesh>
              <planeGeometry args={[1.3, 1.3]} />
              {texture ? (
                <meshBasicMaterial map={texture} transparent />
              ) : (
                <meshBasicMaterial color="pink" />
              )}
            </mesh>

            {/* Info bar */}
            <group position={[0, 0.95, 0]}>
              <Text position={[0, 0.15, 0]} fontSize={0.18} color="white" outlineWidth={0.02} outlineColor="black">
                {enemy.name}
              </Text>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1, 0.08]} />
                <meshBasicMaterial color="#333" />
              </mesh>
              <mesh position={[-0.5 + hpRatio / 2, 0, 0.01]}>
                <planeGeometry args={[Math.max(0.02, hpRatio), 0.06]} />
                <meshBasicMaterial color={hpColor} />
              </mesh>
            </group>
          </group>
        </Billboard>
      </RigidBody>
    </group>
  );
}
