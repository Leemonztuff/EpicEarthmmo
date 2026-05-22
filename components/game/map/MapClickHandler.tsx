'use client';

import React from 'react';
import * as THREE from 'three';

interface MapClickHandlerProps {
  dimensions: { width: number; height: number };
  onPointerDown: (e: any) => void;
}

export function MapClickHandler({ dimensions, onPointerDown }: MapClickHandlerProps) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onPointerDown={onPointerDown}
    >
      <planeGeometry args={[dimensions.width, dimensions.height]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
