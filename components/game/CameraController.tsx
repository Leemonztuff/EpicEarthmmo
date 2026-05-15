'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';

export function CameraController() {
  const { camera, size } = useThree();
  const camTarget = useRef(new THREE.Vector3());
  const lookAtVec = useRef(new THREE.Vector3());

  const baseDist = 15;
  const aspect = size.width / size.height;
  const portraitScale = Math.max(0.7, Math.min(1.3, (16 / 9) / aspect));
  const dist = baseDist * portraitScale;

  useEffect(() => {
    const playerPos = useGameStore.getState().position;
    camera.position.set(playerPos.x, playerPos.y + dist, playerPos.z + dist);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
  }, [camera, dist]);

  useFrame((_state, delta) => {
    const playerPos = useGameStore.getState().position;
    const targetPos = camTarget.current.set(playerPos.x, playerPos.y + dist, playerPos.z + dist);
    const lerpFactor = 1 - Math.pow(1 - 0.1, delta * 60);
    camera.position.lerp(targetPos, lerpFactor);

    const lookAtPos = lookAtVec.current.set(playerPos.x, playerPos.y, playerPos.z);
    camera.lookAt(lookAtPos);
  });

  return null;
}
