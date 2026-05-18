'use client';

import React, { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BatchedParticleRenderer,
  ParticleSystem,
  IntervalValue,
  ConstantValue,
  SphereEmitter,
  RenderMode,
  ColorRange,
// @ts-expect-error - three.quarks types are broken
} from 'three.quarks';

let globalRenderer: BatchedParticleRenderer | null = null;

export function QuarksRenderer() {
  const { scene } = useThree();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      globalRenderer = new BatchedParticleRenderer();
      scene.add(globalRenderer);
    } catch (e) {
      console.warn('Failed to init quarks renderer:', e);
    }

    return () => {
      if (globalRenderer) {
        try {
          scene.remove(globalRenderer);
        } catch (e) {}
        globalRenderer = null;
      }
    };
  }, [scene]);

  useFrame((state, delta) => {
    if (globalRenderer && typeof globalRenderer.update === 'function') {
      try {
        globalRenderer.update(delta);
      } catch (e) {}
    }
  });

  return null;
}

export function createHitEffect(position: {x: number, y: number, z: number}, color: string = '#ffaa00') {
  if (!globalRenderer || typeof window === 'undefined') return;

  try {
    const c = new THREE.Color(color);
    const system = new ParticleSystem({
      duration: 0.5,
      looping: false,
      instancingCount: 20,
      startLife: new IntervalValue(0.2, 0.4),
      startSpeed: new IntervalValue(2, 5),
      startSize: new IntervalValue(0.1, 0.3),
      startColor: new ColorRange(
        new THREE.Vector4(c.r, c.g, c.b, 1),
        new THREE.Vector4(c.r * 0.3, c.g * 0.3, c.b * 0.3, 0.5)
      ),
      worldSpace: true,
      emissionOverTime: new ConstantValue(0),
      emissionBursts: [{
        time: 0,
        count: new ConstantValue(20),
        cycle: 1,
        interval: 0.01,
        probability: 1,
      }],
      shape: new SphereEmitter({
        radius: 0.1,
        thickness: 1,
        arc: Math.PI * 2,
      }),
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending
      }),
      renderMode: RenderMode.BillBoard,
    });

    system.emitter.position.set(position.x, position.y, position.z);
    globalRenderer.addSystem(system);

    setTimeout(() => {
       if (globalRenderer) {
          try {
            globalRenderer.deleteSystem(system);
          } catch (e) {}
       }
    }, 1000);
  } catch (e) {
    console.warn('Particle system error:', e);
  }
}
