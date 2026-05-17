'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import * as THREE from 'three';

export function CameraController() {
  const { camera, size } = useThree();
  const camTarget = useRef(new THREE.Vector3());
  const lookAtVec = useRef(new THREE.Vector3());
  const smoothInput = useRef({ x: 0, z: 0 });
  const initialized = useRef(false);

  const baseDist = 14;
  const baseHeight = 0.7;
  const baseZOffset = 0.8;

  useEffect(() => {
    const playerPos = useGameStore.getState().position;
    camera.position.set(playerPos.x, playerPos.y + 10, playerPos.z + 12);
    camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    initialized.current = false;
  }, [camera]);

  useFrame((_state, delta) => {
    const playerPos = useGameStore.getState().position;
    const inputDir = useGameStore.getState().inputDirection;

    const aspect = size.width / size.height;
    const portraitScale = Math.max(0.7, Math.min(1.3, (16 / 9) / aspect));
    const dist = baseDist * portraitScale;

    const inputMag = Math.sqrt(inputDir.x * inputDir.x + inputDir.z * inputDir.z);
    const moveBoost = Math.min(inputMag * 2, 3);

    const heightOff = (baseHeight * dist) + moveBoost * 0.3;
    const zOff = (baseZOffset * dist) + moveBoost * 0.4;

    const smoothLerp = 1 - Math.pow(1 - 0.06, delta * 60);
    smoothInput.current.x += (inputDir.x - smoothInput.current.x) * smoothLerp;
    smoothInput.current.z += (inputDir.z - smoothInput.current.z) * smoothLerp;

    const rotOffset = Math.atan2(smoothInput.current.x, smoothInput.current.z) * 0.15;

    const targetX = playerPos.x + Math.sin(rotOffset) * dist * 0.1;
    const targetY = playerPos.y + heightOff;
    const targetZ = playerPos.z + Math.cos(rotOffset) * dist * 0.1 + zOff * 0.5;

    camTarget.current.set(targetX, targetY, targetZ);
    camera.position.lerp(camTarget.current, smoothLerp);

    const lookAheadX = smoothInput.current.x * 1.5;
    const lookAheadZ = smoothInput.current.z * 1.5;
    const lookAtPos = lookAtVec.current.set(
      playerPos.x + lookAheadX,
      playerPos.y + 0.5,
      playerPos.z + lookAheadZ
    );
    camera.lookAt(lookAtPos);

    if (!initialized.current) {
      camera.position.copy(camTarget.current);
      initialized.current = true;
    }
  });

  return null;
}
