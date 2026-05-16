'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';

export function CameraController() {
  const { camera, size } = useThree();
  const camTarget = useRef(new THREE.Vector3());
  const lookAtVec = useRef(new THREE.Vector3());

  const baseDist = 14;
  const aspect = size.width / size.height;
  const portraitScale = Math.max(0.7, Math.min(1.3, (16 / 9) / aspect));
  const dist = baseDist * portraitScale;
  const heightOff = dist * 0.7;
  const zOff = dist * 0.8;

  useEffect(() => {
    const playerPos = useGameStore.getState().position;
    camera.position.set(playerPos.x, playerPos.y + heightOff, playerPos.z + zOff);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
  }, [camera, heightOff, zOff]);

  useFrame((_state, delta) => {
    const playerPos = useGameStore.getState().position;
    const targetPos = camTarget.current.set(playerPos.x, playerPos.y + heightOff, playerPos.z + zOff);
    const lerpFactor = 1 - Math.pow(1 - 0.08, delta * 60);
    camera.position.lerp(targetPos, lerpFactor);

    const lookAtPos = lookAtVec.current.set(playerPos.x, playerPos.y + 0.5, playerPos.z);
    camera.lookAt(lookAtPos);
  });

  return null;
}
