'use client';

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';

export function CameraController() {
  const { camera } = useThree();
  const vec = useRef(new THREE.Vector3());

  useEffect(() => {
    const playerPos = useGameStore.getState().position;
    camera.position.set(playerPos.x, playerPos.y + 15, playerPos.z + 15);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const playerPos = useGameStore.getState().position;
    const targetCameraPos = vec.current.set(playerPos.x, playerPos.y + 15, playerPos.z + 15);
    camera.position.lerp(targetCameraPos, 0.1);
    
    const lookAtPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    camera.lookAt(lookAtPos);
  });

  return null;
}
