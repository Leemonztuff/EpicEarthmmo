import type { NavGrid, NavCell, TerrainType } from '@/shared/schemas';
import {
  worldToGrid, gridToWorld,
  getCell, getCellAtWorld,
  isWalkable as sharedIsWalkable,
  getHeightAtWorld, getMoveCost,
  findPath as sharedFindPath,
  smoothPath as sharedSmoothPath,
  createNavGridFromConfig,
} from '@/shared/pathfinding';

export type { GridCell, PathNode } from '@/shared/pathfinding';

export {
  worldToGrid, gridToWorld, getCell, getCellAtWorld,
  getHeightAtWorld, getMoveCost,
  createNavGridFromConfig,
};

export function createNavGrid(
  cols: number,
  rows: number,
  cellSize: number,
  walls: Array<{ position: [number, number, number]; size: [number, number, number] }>,
  waterZones?: Array<{ center: { x: number; z: number }; radius: number }>,
  specialZones?: Array<{ center: { x: number; z: number }; radius: number; property: string; terrainType?: TerrainType }>,
): NavGrid {
  const cells: NavCell[] = [];
  const halfW = (cols * cellSize) / 2;
  const halfH = (rows * cellSize) / 2;

  for (let gz = 0; gz < rows; gz++) {
    for (let gx = 0; gx < cols; gx++) {
      const wx = gx * cellSize - halfW + cellSize / 2;
      const wz = gz * cellSize - halfH + cellSize / 2;

      let cell: NavCell = {
        walkable: true, height: 0, terrainType: 'grass',
        moveCost: 1, isWater: false, isBlocked: false,
      };

      for (const wall of walls) {
        const [cx, , cz] = wall.position;
        const [sx, , sz] = wall.size;
        const halfX = sx / 2 + cellSize * 0.3;
        const halfZ = sz / 2 + cellSize * 0.3;
        if (Math.abs(wx - cx) < halfX && Math.abs(wz - cz) < halfZ) {
          cell.walkable = false;
          cell.isBlocked = true;
          break;
        }
      }

      if (waterZones) {
        for (const wZone of waterZones) {
          const dx = wx - wZone.center.x;
          const dz = wz - wZone.center.z;
          if (Math.sqrt(dx * dx + dz * dz) < wZone.radius) {
            cell.isWater = true;
            cell.terrainType = 'water';
            cell.moveCost = 999;
            cell.walkable = false;
          }
        }
      }

      if (specialZones && !cell.isBlocked) {
        for (const sz of specialZones) {
          const dx = wx - sz.center.x;
          const dz = wz - sz.center.z;
          if (Math.sqrt(dx * dx + dz * dz) < sz.radius) {
            cell.specialProperty = sz.property;
            if (sz.terrainType) {
              cell.terrainType = sz.terrainType;
            }
          }
        }
      }

      cells.push(cell);
    }
  }

  return { cellSize, rows, cols, cells };
}

export function isWalkable(navGrid: NavGrid, wx: number, wz: number): boolean {
  return sharedIsWalkable(navGrid, wx, wz);
}

export function findPath(
  navGrid: NavGrid,
  startWx: number,
  startWz: number,
  endWx: number,
  endWz: number,
  maxIterations: number = 2000,
): Array<{ x: number; z: number }> | null {
  return sharedFindPath(navGrid, startWx, startWz, endWx, endWz, maxIterations);
}

export function smoothPath(
  navGrid: NavGrid,
  path: Array<{ x: number; z: number }>,
): Array<{ x: number; z: number }> {
  return sharedSmoothPath(navGrid, path);
}
