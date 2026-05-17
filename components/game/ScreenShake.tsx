import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeElapsed = 0;
let listeners: (() => void)[] = [];

export function triggerShake(intensity: number, duration: number = 0.3) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeElapsed = 0;
  listeners.forEach(fn => fn());
}

export function useShake() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);
}

export function ScreenShake() {
  const groupRef = useRef<any>(null);
  useShake();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (shakeElapsed < shakeDuration) {
      shakeElapsed += delta;
      const progress = shakeElapsed / shakeDuration;
      const currentIntensity = shakeIntensity * (1 - progress);
      const x = (Math.random() - 0.5) * currentIntensity;
      const y = (Math.random() - 0.5) * currentIntensity;
      groupRef.current.position.x = x;
      groupRef.current.position.y = y;
    } else {
      groupRef.current.position.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  return <group ref={groupRef} />;
}
