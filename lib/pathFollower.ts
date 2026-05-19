import { findPath, type CollisionGridData } from './collisionGrid';

export interface PathFollower {
  waypoints: Array<[number, number]>;
  currentIndex: number;
  target: { x: number; z: number } | null;
  arrived: boolean;
}

export function createPathFollower(): PathFollower {
  return { waypoints: [], currentIndex: 0, target: null, arrived: false };
}

export function setPathTarget(
  pf: PathFollower,
  grid: CollisionGridData | null,
  startX: number,
  startZ: number,
  targetX: number,
  targetZ: number,
): PathFollower {
  let waypoints: Array<[number, number]> = [];

  if (grid) {
    waypoints = findPath(grid, startX, startZ, targetX, targetZ);
  }

  if (waypoints.length === 0) {
    const dx = targetX - startX;
    const dz = targetZ - startZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.3) {
      waypoints = [[targetX, targetZ]];
    }
  }

  return {
    waypoints,
    currentIndex: 0,
    target: { x: targetX, z: targetZ },
    arrived: waypoints.length === 0,
  };
}

export function getPathDirection(
  pf: PathFollower,
  currentX: number,
  currentZ: number,
  arriveDist: number,
): { x: number; z: number } {
  if (pf.arrived || !pf.target) return { x: 0, z: 0 };

  if (pf.currentIndex >= pf.waypoints.length) {
    const dx = pf.target.x - currentX;
    const dz = pf.target.z - currentZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= arriveDist) {
      pf.arrived = true;
      return { x: 0, z: 0 };
    }
    return normalize(dx, dz);
  }

  const [wx, wz] = pf.waypoints[pf.currentIndex];
  const dx = wx - currentX;
  const dz = wz - currentZ;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= arriveDist * 0.5) {
    pf.currentIndex++;
    return getPathDirection(pf, currentX, currentZ, arriveDist);
  }

  return normalize(dx, dz);
}

function normalize(dx: number, dz: number): { x: number; z: number } {
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return { x: 0, z: 0 };
  return { x: dx / len, z: dz / len };
}
