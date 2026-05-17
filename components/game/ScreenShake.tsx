import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeElapsed = 0;

export function triggerShake(intensity: number, duration: number = 0.3) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeElapsed = 0;
}

export function ScreenShake() {
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (shakeElapsed < shakeDuration) {
      shakeElapsed += delta;
      const progress = shakeElapsed / shakeDuration;
      const currentIntensity = shakeIntensity * (1 - progress);
      const x = (Math.random() - 0.5) * currentIntensity;
      const y = (Math.random() - 0.5) * currentIntensity;
      camera.position.x += x;
      camera.position.y += y;
    }
  });

  return null;
}
