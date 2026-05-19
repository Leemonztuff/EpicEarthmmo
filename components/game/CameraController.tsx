'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { playerPosition } from '@/lib/playerPosition';
import * as THREE from 'three';

const FIXED_YAW = 0.85;
const FIXED_PITCH = 0.87;
const BASE_DIST = 14;
const MIN_DIST = 6;
const MAX_DIST = 25;

export function CameraController() {
  const { camera, size } = useThree();
  const camTarget = useRef(new THREE.Vector3());
  const currentDist = useRef(BASE_DIST);
  const targetDist = useRef(BASE_DIST);
  const initialized = useRef(false);

  useEffect(() => {
    const pp = playerPosition;
    const aspect = size.width / size.height;
    const portraitScale = Math.max(0.7, Math.min(1.3, (16 / 9) / aspect));
    const dist = BASE_DIST * portraitScale;

    const theta = FIXED_YAW;
    const phi = FIXED_PITCH;

    camera.position.set(
      pp.x + dist * Math.sin(phi) * Math.sin(theta),
      pp.y + dist * Math.cos(phi),
      pp.z + dist * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(pp.x, pp.y, pp.z);
    initialized.current = false;
  }, [camera, size]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDist.current = Math.min(MAX_DIST, Math.max(MIN_DIST, targetDist.current + e.deltaY * 0.01));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useFrame((_state, delta) => {
    const pp = playerPosition;
    const aspect = size.width / size.height;
    const portraitScale = Math.max(0.7, Math.min(1.3, (16 / 9) / aspect));
    const baseDist = BASE_DIST * portraitScale;

    currentDist.current += (targetDist.current - currentDist.current) * (1 - Math.pow(1 - 0.06, delta * 60));
    const dist = currentDist.current * (baseDist / BASE_DIST);

    const theta = FIXED_YAW;
    const phi = FIXED_PITCH;

    const targetX = pp.x + dist * Math.sin(phi) * Math.sin(theta);
    const targetY = pp.y + dist * Math.cos(phi);
    const targetZ = pp.z + dist * Math.sin(phi) * Math.cos(theta);

    camTarget.current.set(targetX, targetY, targetZ);
    const smoothLerp = 1 - Math.pow(1 - 0.06, delta * 60);
    camera.position.lerp(camTarget.current, smoothLerp);
    camera.lookAt(pp.x, pp.y + 0.5, pp.z);

    if (!initialized.current) {
      camera.position.copy(camTarget.current);
      initialized.current = true;
    }
  });

  return null;
}
