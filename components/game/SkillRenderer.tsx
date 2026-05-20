import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Circle } from '@react-three/drei';
import * as THREE from 'three';
import { useNetworkStore } from '@/store/useNetworkStore';

interface ActiveGroundEffect {
  id: string;
  definitionId: string;
  casterId: string;
  x: number;
  z: number;
  createdAt: number;
  expiresAt: number;
  angle?: number;
  length?: number;
}

interface PendingSkillVFX {
  id: string;
  position: [number, number, number];
  animationId?: string;
  vfxId?: string;
  soundId?: string;
  isCritical?: boolean;
  damage?: number;
  heal?: number;
  createdAt: number;
  duration: number;
}

const GROUND_EFFECT_COLORS: Record<string, { color: string; opacity: number }> = {
  fire_wall_ge: { color: '#ff4400', opacity: 0.5 },
  safety_wall_ge: { color: '#44aaff', opacity: 0.4 },
};

const GROUND_EFFECT_RADII: Record<string, number> = {
  fire_wall_ge: 3,
  safety_wall_ge: 4,
};

function GroundEffectRenderer({ effect }: { effect: ActiveGroundEffect }) {
  const ref = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const mountTime = useRef(Date.now());
  const colors = GROUND_EFFECT_COLORS[effect.definitionId] ?? { color: '#ff4444', opacity: 0.4 };
  const radius = GROUND_EFFECT_RADII[effect.definitionId] ?? 2;

  useFrame(() => {
    if (!ref.current || !meshRef.current) return;
    const now = Date.now();
    const remaining = effect.expiresAt - now;

    if (remaining <= 0) {
      ref.current.visible = false;
      return;
    }

    const elapsed = now - mountTime.current;
    const pulse = Math.sin(elapsed * 0.005) * 0.1 + 1;
    meshRef.current.scale.setScalar(pulse);
    const fadeOut = remaining < 2000 ? remaining / 2000 : 1;
    meshRef.current.material.opacity = colors.opacity * fadeOut;
  });

  const posX = Number(effect.x) || 0;
  const posZ = Number(effect.z) || 0;

  return (
    <group ref={ref} position={[posX, 0.05, posZ]}>
      <Circle ref={meshRef} args={[radius, 32]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={colors.color}
          transparent
          opacity={colors.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Circle>
    </group>
  );
}

function SkillVFX({ vfx }: { vfx: PendingSkillVFX }) {
  const ref = useRef<any>(null);
  const startTime = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;
    const progress = elapsed / (vfx.duration / 1000);

    if (progress >= 1) {
      ref.current.visible = false;
      return;
    }

    const scale = vfx.isCritical ? 1.5 + Math.sin(elapsed * 15) * 0.3 : 1 + progress * 0.5;
    ref.current.scale.setScalar(scale);

    const opacity = progress < 0.3 ? 1 : 1 - (progress - 0.3) / 0.7;
    ref.current.material.opacity = Math.max(0, opacity);

    ref.current.position.y = vfx.position[1] + elapsed * 2;
  });

  const color = vfx.heal ? '#4ade80' : vfx.isCritical ? '#ffcc00' : '#ff4444';
  const posX = Number(vfx.position[0]) || 0;
  const posY = Number(vfx.position[1]) || 1;
  const posZ = Number(vfx.position[2]) || 0;

  return (
    <mesh ref={ref} position={[posX, posY, posZ]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.8}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export function SkillRenderer() {
  const socket = useNetworkStore((s) => s.socket);
  const [groundEffects, setGroundEffects] = useState<ActiveGroundEffect[]>([]);
  const [vfxList, setVfxList] = useState<PendingSkillVFX[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleGroundEffectCreated = (data: ActiveGroundEffect) => {
      setGroundEffects(prev => [...prev, data]);
    };

    const handleGroundEffectsUpdate = (data: ActiveGroundEffect[]) => {
      setGroundEffects(data);
    };

    const handleSkillCastResult = (data: {
      casterId: string;
      skillId: string;
      damage?: number;
      heal?: number;
      isCritical?: boolean;
      targetsHit?: string[];
      targetPositions?: Record<string, { x: number; z: number }>;
      animationId?: string;
      vfxId?: string;
      soundId?: string;
    }) => {
      const targets = data.targetsHit ?? [];
      const positions = data.targetPositions ?? {};

      if (targets.length > 0 && Object.keys(positions).length > 0) {
        for (const tid of targets) {
          const pos = positions[tid];
          if (!pos) continue;
          const vfx: PendingSkillVFX = {
            id: `vfx_${Date.now()}_${Math.random()}`,
            position: [pos.x, 1, pos.z],
            animationId: data.animationId,
            vfxId: data.vfxId,
            soundId: data.soundId,
            isCritical: data.isCritical,
            damage: data.damage,
            heal: data.heal,
            createdAt: Date.now(),
            duration: 800,
          };
          setVfxList(prev => [...prev, vfx]);
        }
      } else {
        const vfx: PendingSkillVFX = {
          id: `vfx_${Date.now()}_${Math.random()}`,
          position: [0, 1, 0],
          animationId: data.animationId,
          vfxId: data.vfxId,
          soundId: data.soundId,
          isCritical: data.isCritical,
          damage: data.damage,
          heal: data.heal,
          createdAt: Date.now(),
          duration: 800,
        };
        setVfxList(prev => [...prev, vfx]);
      }

      if (data.soundId) {
        try {
          const audio = new Audio(`/sounds/${data.soundId}.mp3`);
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
    };

    socket.on('groundEffectCreated', handleGroundEffectCreated);
    socket.on('groundEffectsUpdate', handleGroundEffectsUpdate);
    socket.on('skillCastResult', handleSkillCastResult);

    return () => {
      socket.off('groundEffectCreated', handleGroundEffectCreated);
      socket.off('groundEffectsUpdate', handleGroundEffectsUpdate);
      socket.off('skillCastResult', handleSkillCastResult);
    };
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGroundEffects(prev => prev.filter(ge => ge.expiresAt > now));
      setVfxList(prev => prev.filter(v => now - v.createdAt < v.duration));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {groundEffects.map(ge => (
        <GroundEffectRenderer key={ge.id} effect={ge} />
      ))}
      {vfxList.map(vfx => (
        <SkillVFX key={vfx.id} vfx={vfx} />
      ))}
    </group>
  );
}
