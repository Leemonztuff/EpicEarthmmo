import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group as TGroup } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { RigidBody } from '@react-three/rapier';

function drawPoring(ctx: CanvasRenderingContext2D) {
  const w = 64, h = 64;
  ctx.fillStyle = '#ff8cb0';
  ctx.beginPath();
  ctx.ellipse(32, 36, 18, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb0d0';
  ctx.beginPath();
  ctx.ellipse(32, 38, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(18, 28, 6, 6);
  ctx.fillRect(40, 28, 6, 6);
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 29, 2, 2);
  ctx.fillRect(42, 29, 2, 2);
  ctx.fillStyle = '#cc6688';
  ctx.beginPath();
  ctx.arc(32, 40, 4, 0.1, Math.PI - 0.1);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffb0b0';
  ctx.beginPath();
  ctx.arc(16, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(48, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e07090';
  ctx.beginPath();
  ctx.ellipse(14, 22, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(50, 22, 4, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFabre(ctx: CanvasRenderingContext2D) {
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
  ctx.fillStyle = '#333';
  ctx.fillRect(28, 20, 3, 4);
  ctx.fillRect(33, 20, 3, 4);
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
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(22, 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(42, 10, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPupa(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#c4a87a';
  ctx.beginPath();
  ctx.ellipse(32, 34, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a08060';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.4;
    ctx.beginPath();
    ctx.moveTo(32, 34);
    ctx.lineTo(32 + Math.cos(angle) * 14, 34 + Math.sin(angle) * 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a7a5a';
  ctx.beginPath();
  ctx.ellipse(32, 18, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(28, 16, 3, 3);
  ctx.fillRect(33, 16, 3, 3);
}

function drawLunatic(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath();
  ctx.ellipse(32, 36, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.ellipse(32, 38, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(22, 28, 5, 5);
  ctx.fillRect(37, 28, 5, 5);
  ctx.fillStyle = 'white';
  ctx.fillRect(24, 29, 2, 2);
  ctx.fillRect(39, 29, 2, 2);
  ctx.fillStyle = '#ff8cb0';
  ctx.beginPath();
  ctx.arc(32, 38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.ellipse(16, 20, 5, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 20, 5, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath();
  ctx.ellipse(16, 14, 3, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 14, 3, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawWolf(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.ellipse(32, 36, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.ellipse(32, 38, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.ellipse(48, 28, 8, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(50, 26, 3, 3);
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(44, 22);
  ctx.lineTo(42, 14);
  ctx.lineTo(48, 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(52, 22);
  ctx.lineTo(54, 14);
  ctx.lineTo(50, 20);
  ctx.fill();
  ctx.fillStyle = '#777';
  ctx.beginPath();
  ctx.ellipse(14, 36, 6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpore(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(32, 42, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CD853F';
  ctx.beginPath();
  ctx.ellipse(32, 26, 16, 10, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.ellipse(32, 26, 12, 7, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(26, 32, 3, 3);
  ctx.fillRect(35, 32, 3, 3);
  ctx.fillStyle = '#ff8';
  ctx.beginPath();
  ctx.arc(20, 22, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(44, 22, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemyTexture(name: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  switch (name) {
    case 'Fabre': drawFabre(ctx); break;
    case 'Pupa': drawPupa(ctx); break;
    case 'Lunatic': drawLunatic(ctx); break;
    case 'Wolf': drawWolf(ctx); break;
    case 'Spore': drawSpore(ctx); break;
    default: drawPoring(ctx); break;
  }
  return new CanvasTexture(canvas);
}

export function Enemy({ id }: { id: string }) {
  const spriteRef = useRef<TGroup>(null);
  const groupRef = useRef<TGroup>(null);
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

  const displayPos = useRef({ x: 0, y: 0.5, z: 0 });

  useFrame((state, delta) => {
    if (!enemy) return;

    const targetX = enemy.position.x;
    const targetY = enemy.position.y;
    const targetZ = enemy.position.z;

    const smoothing = enemy.isDead ? 1 : 6;
    displayPos.current.x += (targetX - displayPos.current.x) * smoothing * delta;
    displayPos.current.y += (targetY - displayPos.current.y) * smoothing * delta;
    displayPos.current.z += (targetZ - displayPos.current.z) * smoothing * delta;

    if (groupRef.current) {
      groupRef.current.position.set(displayPos.current.x, displayPos.current.y, displayPos.current.z);
    }

    if (spriteRef.current) {
      spriteRef.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed + floatOffset) * 0.06;
    }
  });

  if (!enemy || enemy.isDead) return null;

  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
  const hpColor = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#facc15' : '#ef4444';

  return (
    <group ref={groupRef} position={[displayPos.current.x, displayPos.current.y, displayPos.current.z]}>
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

            <group position={[0, 0.95, 0]}>
              <Text position={[0, 0.15, 0]} fontSize={0.18} color="white" outlineWidth={0.02} outlineColor="black">
                {enemy.name} Lv.{enemy.level}
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
