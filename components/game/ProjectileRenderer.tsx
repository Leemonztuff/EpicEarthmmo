'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProjectileDef {
  id: string;
  mesh: THREE.Mesh;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTime: number;
  duration: number;
  type: 'arrow' | 'bolt' | 'sphere' | 'missile';
}

let activeProjectiles: ProjectileDef[] = [];
let nextProjId = 0;

function createProjectileMesh(type: string, color: string, scale: number): THREE.Mesh {
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;

  if (type === 'arrow') {
    geometry = new THREE.ConeGeometry(0.08 * scale, 0.4 * scale, 6);
    material = new THREE.MeshBasicMaterial({ color });
  } else if (type === 'bolt') {
    geometry = new THREE.CylinderGeometry(0.04 * scale, 0.08 * scale, 0.5 * scale, 6);
    material = new THREE.MeshBasicMaterial({ color });
  } else if (type === 'missile') {
    geometry = new THREE.ConeGeometry(0.15 * scale, 0.6 * scale, 8);
    material = new THREE.MeshBasicMaterial({ color: '#ff6600' });
  } else {
    geometry = new THREE.SphereGeometry(0.15 * scale, 8, 8);
    material = new THREE.MeshBasicMaterial({ color });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

export function spawnProjectile(config: {
  startX: number; startY: number; startZ: number;
  endX: number; endY: number; endZ: number;
  type?: 'arrow' | 'bolt' | 'sphere' | 'missile';
  color?: string;
  scale?: number;
  speed?: number;
}) {
  const start = new THREE.Vector3(config.startX, config.startY, config.startZ);
  const end = new THREE.Vector3(config.endX, config.endY, config.endZ);
  const dist = start.distanceTo(end);
  const speed = config.speed || 15;
  const duration = Math.max(0.1, dist / speed);
  const type = config.type || 'arrow';
  const color = config.color || '#ffaa00';
  const scale = config.scale || 0.3;

  const mesh = createProjectileMesh(type, color, scale);
  mesh.position.copy(start);

  if (type !== 'sphere') {
    const dir = new THREE.Vector3().copy(end).sub(start).normalize();
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }

  const trailGeo = new THREE.SphereGeometry(0.03 * scale, 4, 4);
  const trailMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 });
  for (let i = 0; i < 3; i++) {
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.copy(start);
    mesh.add(trail);
  }

  activeProjectiles.push({
    id: `proj_${nextProjId++}`,
    mesh,
    startPos: start.clone(),
    endPos: end.clone(),
    startTime: performance.now() / 1000,
    duration,
    type,
  });
}

export function ProjectileRenderer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    const now = performance.now() / 1000;
    const group = groupRef.current;
    if (!group) return;

    const stillActive: ProjectileDef[] = [];

    for (const p of activeProjectiles) {
      const elapsed = now - p.startTime;
      const t = Math.min(1, elapsed / p.duration);

      const pos = new THREE.Vector3().lerpVectors(p.startPos, p.endPos, t);
      if (p.type !== 'sphere') {
        pos.y += Math.sin(t * Math.PI) * 0.5;
      }

      p.mesh.position.copy(pos);
      p.mesh.rotation.z += delta * 5;

      const trailMeshes = p.mesh.children as THREE.Mesh[];
      for (let i = 0; i < trailMeshes.length; i++) {
        const trailT = Math.max(0, t - (i + 1) * 0.05);
        const trailPos = new THREE.Vector3().lerpVectors(p.startPos, p.endPos, trailT);
        if (p.type !== 'sphere') {
          trailPos.y += Math.sin(trailT * Math.PI) * 0.5;
        }
        trailMeshes[i].position.copy(trailPos);
        trailMeshes[i].position.sub(p.mesh.position);
      }

      if (t < 1) {
        stillActive.push(p);
        if (!group.children.includes(p.mesh)) {
          group.add(p.mesh);
        }
      } else {
        if (group.children.includes(p.mesh)) {
          group.remove(p.mesh);
        }
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach(m => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        for (const child of p.mesh.children) {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        }
      }
    }

    activeProjectiles = stillActive;
  });

  return <group ref={groupRef} />;
}
