export interface CollisionGridData {
  width: number;
  height: number;
  cellSize: number;
  cells: Uint8Array;
}

export function createCollisionGrid(
  mapWidth: number,
  mapHeight: number,
  cellSize: number,
  walls: Array<{ position: [number, number, number]; size: [number, number, number] }>,
  decorations?: Array<{ position: [number, number, number]; type: string; scale: number }>,
): CollisionGridData {
  const cols = Math.ceil(mapWidth / cellSize);
  const rows = Math.ceil(mapHeight / cellSize);
  const cells = new Uint8Array(cols * rows);

  function worldToGrid(wx: number, wz: number): [number, number] {
    const gx = Math.floor((wx + mapWidth / 2) / cellSize);
    const gz = Math.floor((wz + mapHeight / 2) / cellSize);
    return [Math.max(0, Math.min(cols - 1, gx)), Math.max(0, Math.min(rows - 1, gz))];
  }

  for (const wall of walls) {
    const [cx, , cz] = wall.position;
    const [sx, sy, sz] = wall.size;
    const halfX = sx / 2;
    const halfZ = sz / 2;

    const [minX, minZ] = worldToGrid(cx - halfX, cz - halfZ);
    const [maxX, maxZ] = worldToGrid(cx + halfX, cz + halfZ);

    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        cells[gz * cols + gx] = 1;
      }
    }
  }

  return { width: cols, height: rows, cellSize, cells };
}

export function isWalkable(grid: CollisionGridData, wx: number, wz: number): boolean {
  const gx = Math.floor((wx + grid.width * grid.cellSize / 2) / grid.cellSize);
  const gz = Math.floor((wz + grid.height * grid.cellSize / 2) / grid.cellSize);

  if (gx < 0 || gx >= grid.width || gz < 0 || gz >= grid.height) return false;
  return grid.cells[gz * grid.width + gx] === 0;
}

export interface PathNode {
  x: number;
  z: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return (dx + dz) * 1.001;
}

const DIRS = [
  { dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
  { dx: -1, dz: -1 }, { dx: 1, dz: -1 }, { dx: -1, dz: 1 }, { dx: 1, dz: 1 },
];

export function findPath(
  grid: CollisionGridData,
  startWx: number,
  startWz: number,
  endWx: number,
  endWz: number,
): Array<[number, number]> {
  const startGx = Math.floor((startWx + grid.width * grid.cellSize / 2) / grid.cellSize);
  const startGz = Math.floor((startWz + grid.height * grid.cellSize / 2) / grid.cellSize);
  const endGx = Math.floor((endWx + grid.width * grid.cellSize / 2) / grid.cellSize);
  const endGz = Math.floor((endWz + grid.height * grid.cellSize / 2) / grid.cellSize);

  if (startGx === endGx && startGz === endGz) return [];

  const open: PathNode[] = [];
  const closed = new Set<number>();

  const key = (gx: number, gz: number) => gz * grid.width + gx;

  const startNode: PathNode = {
    x: startGx, z: startGz,
    g: 0, h: heuristic(startGx, startGz, endGx, endGz),
    f: 0, parent: null,
  };
  startNode.f = startNode.h;
  open.push(startNode);

  let iterations = 0;
  const MAX_ITER = grid.width * grid.height;

  while (open.length > 0 && iterations < MAX_ITER) {
    iterations++;

    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) lowestIdx = i;
    }
    const current = open.splice(lowestIdx, 1)[0];

    if (current.x === endGx && current.z === endGz) {
      const path: Array<[number, number]> = [];
      let node: PathNode | null = current;
      while (node) {
        const wx = node.x * grid.cellSize - grid.width * grid.cellSize / 2 + grid.cellSize / 2;
        const wz = node.z * grid.cellSize - grid.height * grid.cellSize / 2 + grid.cellSize / 2;
        path.unshift([wx, wz]);
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.x, current.z));

    for (const dir of DIRS) {
      const nx = current.x + dir.dx;
      const nz = current.z + dir.dz;

      if (nx < 0 || nx >= grid.width || nz < 0 || nz >= grid.height) continue;
      if (grid.cells[nz * grid.width + nx] !== 0) continue;
      if (closed.has(key(nx, nz))) continue;

      const isDiagonal = dir.dx !== 0 && dir.dz !== 0;
      const moveCost = isDiagonal ? 1.414 : 1;
      const ng = current.g + moveCost;

      const existing = open.find(n => n.x === nx && n.z === nz);
      if (existing) {
        if (ng < existing.g) {
          existing.g = ng;
          existing.f = ng + existing.h;
          existing.parent = current;
        }
      } else {
        const h = heuristic(nx, nz, endGx, endGz);
        open.push({ x: nx, z: nz, g: ng, h, f: ng + h, parent: current });
      }
    }
  }

  return [];
}
