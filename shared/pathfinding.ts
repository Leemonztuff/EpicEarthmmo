import type { NavGrid, NavCell, NavGrid as NavGridConfig } from './schemas/maps';
export type { NavGrid, NavCell };

export interface GridCell {
  walkable: boolean;
  height: number;
  terrainType: string;
  moveCost: number;
  isWater: boolean;
  isBlocked: boolean;
  specialProperty?: string;
}

export interface PathNode {
  gx: number;
  gz: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const DIRS = [
  { dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
  { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }, { dx: 1, dz: 1 },
];

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
}

export function worldToGrid(navGrid: NavGrid, wx: number, wz: number): [number, number] {
  const halfW = (navGrid.cols * navGrid.cellSize) / 2;
  const halfH = (navGrid.rows * navGrid.cellSize) / 2;
  const gx = Math.floor((wx + halfW) / navGrid.cellSize);
  const gz = Math.floor((wz + halfH) / navGrid.cellSize);
  return [
    Math.max(0, Math.min(navGrid.cols - 1, gx)),
    Math.max(0, Math.min(navGrid.rows - 1, gz)),
  ];
}

export function gridToWorld(navGrid: NavGrid, gx: number, gz: number): [number, number] {
  const halfW = (navGrid.cols * navGrid.cellSize) / 2;
  const halfH = (navGrid.rows * navGrid.cellSize) / 2;
  const wx = gx * navGrid.cellSize - halfW + navGrid.cellSize / 2;
  const wz = gz * navGrid.cellSize - halfH + navGrid.cellSize / 2;
  return [wx, wz];
}

export function getCell(navGrid: NavGrid, gx: number, gz: number): NavCell | null {
  if (gx < 0 || gx >= navGrid.cols || gz < 0 || gz >= navGrid.rows) return null;
  return navGrid.cells[gz * navGrid.cols + gx];
}

export function getCellAtWorld(navGrid: NavGrid, wx: number, wz: number): NavCell | null {
  const [gx, gz] = worldToGrid(navGrid, wx, wz);
  return getCell(navGrid, gx, gz);
}

export function isWalkable(navGrid: NavGrid, wx: number, wz: number): boolean {
  const cell = getCellAtWorld(navGrid, wx, wz);
  return cell ? cell.walkable : false;
}

export function getHeightAtWorld(navGrid: NavGrid, wx: number, wz: number): number {
  const cell = getCellAtWorld(navGrid, wx, wz);
  return cell ? cell.height : 0;
}

export function getMoveCost(navGrid: NavGrid, wx: number, wz: number): number {
  const cell = getCellAtWorld(navGrid, wx, wz);
  return cell ? cell.moveCost : 999;
}

export function createNavGridFromConfig(config: NavGrid): NavGrid {
  return { ...config };
}

export function findPath(
  navGrid: NavGrid,
  startWx: number,
  startWz: number,
  endWx: number,
  endWz: number,
  maxIterations: number = 2000,
): Array<{ x: number; z: number }> | null {
  const [startGx, startGz] = worldToGrid(navGrid, startWx, startWz);
  const [endGx, endGz] = worldToGrid(navGrid, endWx, endWz);

  if (startGx === endGx && startGz === endGz) return [];

  const endCell = getCell(navGrid, endGx, endGz);
  if (!endCell || !endCell.walkable) {
    let bestGx = endGx, bestGz = endGz, bestDist = Infinity;
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const ng = endGx + dx;
        const nz = endGz + dz;
        const c = getCell(navGrid, ng, nz);
        if (c && c.walkable) {
          const d = Math.abs(dx) + Math.abs(dz);
          if (d < bestDist) { bestDist = d; bestGx = ng; bestGz = nz; }
        }
      }
    }
    if (bestDist === Infinity) return null;
    return findPath(navGrid, startWx, startWz, ...gridToWorld(navGrid, bestGx, bestGz), maxIterations);
  }

  const open: PathNode[] = [];
  const closed = new Set<number>();
  const key = (gx: number, gz: number) => gz * navGrid.cols + gx;

  const startNode: PathNode = {
    gx: startGx, gz: startGz, g: 0,
    h: heuristic(startGx, startGz, endGx, endGz),
    f: 0, parent: null,
  };
  startNode.f = startNode.h;
  open.push(startNode);

  let iterations = 0;

  while (open.length > 0 && iterations < maxIterations) {
    iterations++;

    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) lowestIdx = i;
    }
    const current = open.splice(lowestIdx, 1)[0];

    if (current.gx === endGx && current.gz === endGz) {
      const path: Array<{ x: number; z: number }> = [];
      let node: PathNode | null = current;
      while (node) {
        const [wx, wz] = gridToWorld(navGrid, node.gx, node.gz);
        path.unshift({ x: wx, z: wz });
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.gx, current.gz));

    for (const dir of DIRS) {
      const nx = current.gx + dir.dx;
      const nz = current.gz + dir.dz;

      if (nx < 0 || nx >= navGrid.cols || nz < 0 || nz >= navGrid.rows) continue;
      if (closed.has(key(nx, nz))) continue;

      const cell = getCell(navGrid, nx, nz);
      if (!cell || !cell.walkable) continue;

      if (dir.dx !== 0 && dir.dz !== 0) {
        const c1 = getCell(navGrid, current.gx + dir.dx, current.gz);
        const c2 = getCell(navGrid, current.gx, current.gz + dir.dz);
        if (!c1?.walkable || !c2?.walkable) continue;
      }

      const isDiagonal = dir.dx !== 0 && dir.dz !== 0;
      const moveCost = (isDiagonal ? Math.SQRT2 : 1) * cell.moveCost;
      const ng = current.g + moveCost;

      const existing = open.find(n => n.gx === nx && n.gz === nz);
      if (existing) {
        if (ng < existing.g) {
          existing.g = ng;
          existing.f = ng + existing.h;
          existing.parent = current;
        }
      } else {
        const h = heuristic(nx, nz, endGx, endGz);
        open.push({ gx: nx, gz: nz, g: ng, h, f: ng + h, parent: current });
      }
    }
  }

  return null;
}

export function smoothPath(
  navGrid: NavGrid,
  path: Array<{ x: number; z: number }>,
): Array<{ x: number; z: number }> {
  if (path.length <= 2) return path;

  const smoothed: Array<{ x: number; z: number }> = [path[0]];
  let currentIdx = 0;

  while (currentIdx < path.length - 1) {
    let furthestIdx = currentIdx + 1;

    for (let i = path.length - 1; i > currentIdx + 1; i--) {
      const [startGx, startGz] = worldToGrid(navGrid, path[currentIdx].x, path[currentIdx].z);
      const [endGx, endGz] = worldToGrid(navGrid, path[i].x, path[i].z);
      const dx = endGx - startGx;
      const dz = endGz - startGz;
      const steps = Math.max(Math.abs(dx), Math.abs(dz));
      let lineClear = true;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const cx = Math.round(startGx + dx * t);
        const cz = Math.round(startGz + dz * t);
        const cell = getCell(navGrid, cx, cz);
        if (!cell || !cell.walkable) { lineClear = false; break; }
      }

      if (lineClear) { furthestIdx = i; break; }
    }

    smoothed.push(path[furthestIdx]);
    currentIdx = furthestIdx;
  }

  return smoothed;
}
