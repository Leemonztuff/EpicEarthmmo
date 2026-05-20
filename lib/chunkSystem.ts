import type { MapRegion, MapDecoration, Tile, MapTrigger, EnemyArea } from '@/shared/schemas';

export interface Chunk {
  id: string;
  regionId: string;
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  decorations: MapDecoration[];
  tiles: Tile[];
  triggers: MapTrigger[];
  enemyAreas: EnemyArea[];
  loaded: boolean;
  loadPriority: number;
}

export interface RegionState {
  region: MapRegion;
  chunks: Chunk[];
  loaded: boolean;
  distance: number;
}

export function computeChunks(
  regions: MapRegion[],
  decorations: MapDecoration[],
  tiles: Tile[],
  triggers: MapTrigger[],
  enemyAreas: EnemyArea[],
  chunkSize: number = 16,
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const region of regions) {
    const { minX, minZ, maxX, maxZ } = region.bounds;
    const cols = Math.ceil((maxX - minX) / chunkSize);
    const rows = Math.ceil((maxZ - minZ) / chunkSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const chunkMinX = minX + col * chunkSize;
        const chunkMinZ = minZ + row * chunkSize;
        const chunkMaxX = Math.min(chunkMinX + chunkSize, maxX);
        const chunkMaxZ = Math.min(chunkMinZ + chunkSize, maxZ);

        const chunkId = `${region.id}_chunk_${col}_${row}`;

        const chunkDecorations = decorations.filter(d => {
          const x = d.position[0];
          const z = d.position[2];
          return x >= chunkMinX && x < chunkMaxX && z >= chunkMinZ && z < chunkMaxZ;
        });

        const chunkTiles = tiles.filter(t => {
          const x = t.position[0];
          const z = t.position[1];
          return x >= chunkMinX && x < chunkMaxX && z >= chunkMinZ && z < chunkMaxZ;
        });

        const chunkTriggers = triggers.filter(t => {
          return t.position.x >= chunkMinX && t.position.x < chunkMaxX &&
                 t.position.z >= chunkMinZ && t.position.z < chunkMaxZ;
        });

        const chunkEnemyAreas = enemyAreas.filter(ea => {
          const dx = ea.center.x - (chunkMinX + chunkMaxX) / 2;
          const dz = ea.center.z - (chunkMinZ + chunkMaxZ) / 2;
          return Math.sqrt(dx * dx + dz * dz) < ea.radius + chunkSize;
        });

        chunks.push({
          id: chunkId,
          regionId: region.id,
          bounds: { minX: chunkMinX, minZ: chunkMinZ, maxX: chunkMaxX, maxZ: chunkMaxZ },
          decorations: chunkDecorations,
          tiles: chunkTiles,
          triggers: chunkTriggers,
          enemyAreas: chunkEnemyAreas,
          loaded: false,
          loadPriority: 0,
        });
      }
    }
  }

  if (chunks.length === 0 && decorations.length > 0) {
    chunks.push({
      id: 'default_chunk',
      regionId: 'default',
      bounds: { minX: -40, minZ: -40, maxX: 40, maxZ: 40 },
      decorations,
      tiles,
      triggers,
      enemyAreas,
      loaded: false,
      loadPriority: 0,
    });
  }

  return chunks;
}

export function getVisibleChunks(
  chunks: Chunk[],
  playerX: number,
  playerZ: number,
  viewRadius: number = 40,
): Chunk[] {
  return chunks
    .map(chunk => {
      const cx = (chunk.bounds.minX + chunk.bounds.maxX) / 2;
      const cz = (chunk.bounds.minZ + chunk.bounds.maxZ) / 2;
      const dx = cx - playerX;
      const dz = cz - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return { chunk, dist };
    })
    .filter(({ dist }) => dist < viewRadius + 20)
    .sort((a, b) => a.dist - b.dist)
    .map(({ chunk, dist }) => ({
      ...chunk,
      loadPriority: Math.max(0, viewRadius - dist),
    }));
}

export function getActiveRegions(
  regions: MapRegion[],
  playerX: number,
  playerZ: number,
): string[] {
  return regions
    .filter(r => {
      const cx = (r.bounds.minX + r.bounds.maxX) / 2;
      const cz = (r.bounds.minZ + r.bounds.maxZ) / 2;
      const dx = cx - playerX;
      const dz = cz - playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const maxDist = Math.max(r.bounds.maxX - r.bounds.minX, r.bounds.maxZ - r.bounds.minZ) / 2 + 20;
      return dist < maxDist;
    })
    .map(r => r.id);
}
