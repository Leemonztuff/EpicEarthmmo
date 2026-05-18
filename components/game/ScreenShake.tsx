'use client';

import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeTimer = 0;

export function triggerShake(intensity = 0.1, duration = 0.2) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeTimer = duration;
}

export function ScreenShake() {
  useFrame((state, delta) => {
    if (shakeTimer > 0) {
      shakeTimer -= delta;
      const progress = shakeTimer / shakeDuration;
      const currentIntensity = shakeIntensity * progress;

      state.camera.position.x += (Math.random() - 0.5) * currentIntensity;
      state.camera.position.y += (Math.random() - 0.5) * currentIntensity;
    }
  });

  return null;
}
