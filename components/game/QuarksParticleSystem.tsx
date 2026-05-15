import React, { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BatchedParticleRenderer,
  QuarksLoader,
  ParticleSystem,
  IntervalValue,
  ConstantValue,
  SphereEmitter,
  RenderMode,
  ColorRange,
  PiecewiseBezier,
} from 'three.quarks';

let globalRenderer: BatchedParticleRenderer | null = null;

export function QuarksRenderer() {
  const { scene } = useThree();

  useEffect(() => {
    globalRenderer = new BatchedParticleRenderer();
    scene.add(globalRenderer);

    return () => {
      if (globalRenderer) {
        scene.remove(globalRenderer);
        globalRenderer = null;
      }
    };
  }, [scene]);

  useFrame((state, delta) => {
    if (globalRenderer) {
      globalRenderer.update(delta);
    }
  });

  return null;
}

export function createHitEffect(position: {x: number, y: number, z: number}, color: string = '#ffaa00') {
  if (!globalRenderer) return;

  const c = new THREE.Color(color);
  const system = new ParticleSystem({
    duration: 0.5,
    looping: false,
    instancingCount: 20,
    startLife: new IntervalValue(0.2, 0.4),
    startSpeed: new IntervalValue(2, 5),
    startSize: new IntervalValue(0.1, 0.3),
    startColor: new ColorRange({r: c.r, g: c.g, b: c.b, a: 1}, {r: c.r * 0.3, g: c.g * 0.3, b: c.b * 0.3, a: 0.5}),
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
        globalRenderer.deleteSystem(system);
     }
  }, 1000);
}
