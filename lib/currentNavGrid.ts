import type { NavGrid } from '@/shared/schemas';
import { isWalkable as navIsWalkable } from './navGrid';

export const currentNavGrid: { grid: NavGrid | null } = { grid: null };

export function isWalkable(wx: number, wz: number): boolean {
  if (!currentNavGrid.grid) return true;
  return navIsWalkable(currentNavGrid.grid, wx, wz);
}

export function slideMove(
  current: { x: number; z: number },
  velocity: { x: number; z: number },
  delta: number,
): { x: number; z: number } {
  const newX = current.x + velocity.x * delta;
  const newZ = current.z + velocity.z * delta;

  if (isWalkable(newX, newZ)) {
    return { x: newX, z: newZ };
  }

  if (isWalkable(newX, current.z)) {
    return { x: newX, z: current.z };
  }

  if (isWalkable(current.x, newZ)) {
    return { x: current.x, z: newZ };
  }

  return { x: current.x, z: current.z };
}
