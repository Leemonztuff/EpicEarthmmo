import { z } from 'zod';
import { NPCSpawnSchema, ChestSchema } from './npcs';

export const MapTypeSchema = z.enum(['town', 'field', 'dungeon', 'instance', 'pvp', 'guild']);

export const Vector2Schema = z.object({
  x: z.number(),
  z: z.number(),
});

export const TerrainTypeSchema = z.enum([
  'grass', 'dirt', 'stone', 'sand', 'snow', 'water', 'lava',
  'wood', 'carpet', 'ice', 'swamp', 'bridge',
]);

export const NavCellSchema = z.object({
  walkable: z.boolean().default(true),
  height: z.number().default(0),
  terrainType: TerrainTypeSchema.default('grass'),
  moveCost: z.number().positive().default(1),
  isWater: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  specialProperty: z.string().optional(),
});

export const NavGridSchema = z.object({
  cellSize: z.number().positive().default(1),
  rows: z.number().int().positive(),
  cols: z.number().int().positive(),
  cells: z.array(NavCellSchema),
});

export const TileSchema = z.object({
  position: z.tuple([z.number().int(), z.number().int()]),
  terrainType: TerrainTypeSchema.default('grass'),
  height: z.number().default(0),
  textureId: z.string().default('grass_01'),
  blendNorth: z.number().min(0).max(1).default(0),
  blendSouth: z.number().min(0).max(1).default(0),
  blendEast: z.number().min(0).max(1).default(0),
  blendWest: z.number().min(0).max(1).default(0),
});

export const TileLayerSchema = z.enum([
  'terrain', 'decorations', 'shadows', 'effects', 'ceiling', 'entities',
]);

export const MapRegionSchema = z.object({
  id: z.string(),
  bounds: z.object({
    minX: z.number(),
    minZ: z.number(),
    maxX: z.number(),
    maxZ: z.number(),
  }),
  chunkSize: z.number().positive().default(16),
  ambientSound: z.string().optional(),
  ambientVolume: z.number().min(0).max(1).default(0.5),
  fogDensity: z.number().min(0).max(1).default(0),
  fogColor: z.string().default('#ffffff'),
  lightColor: z.string().default('#ffffff'),
  lightIntensity: z.number().min(0).max(2).default(1),
});

export const MapTriggerSchema = z.object({
  id: z.string(),
  type: z.enum(['warp', 'dialog', 'damage', 'heal', 'script', 'region_change']),
  position: z.object({ x: z.number(), z: z.number() }),
  radius: z.number().positive().default(1),
  target: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

export const MapSpawnPointSchema = z.object({
  id: z.string(),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  label: z.string().optional(),
  regionId: z.string().optional(),
});

export const WarpSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  targetMapId: z.string(),
  targetSpawnId: z.string(),
  visual: z.enum(['portal', 'door', 'npc', 'hidden']),
  requirements: z.object({
    minLevel: z.number().int().nonnegative(),
    questId: z.string().optional(),
    itemRequired: z.string().optional(),
    zenyCost: z.number().int().nonnegative(),
  }).optional(),
});

export const SafeZoneSchema = z.object({
  id: z.string(),
  center: Vector2Schema,
  radius: z.number().positive(),
  name: z.string().optional(),
});

export const EnemyAreaSchema = z.object({
  enemyId: z.string(),
  center: Vector2Schema,
  radius: z.number().positive(),
  count: z.number().int().positive(),
  respawnSeconds: z.number().positive(),
  regionId: z.string().optional(),
});

export const MapDecorationSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  type: z.enum(['tree', 'bush', 'rock', 'flower', 'building', 'fence', 'well', 'sign', 'castle', 'castle_tower_left', 'castle_tower_right', 'castle_gate', 'building_large', 'building_medium', 'building_small', 'fountain', 'stone_path', 'lamppost', 'bench', 'tree_ornamental', 'torch', 'pillar', 'mushroom', 'crack', 'chest', 'dungeon_wall', 'dungeon_floor_tile']),
  scale: z.number().positive(),
  layer: TileLayerSchema.default('decorations'),
  lodNear: z.number().positive().default(20),
  lodFar: z.number().positive().default(50),
  hasCollision: z.boolean().default(false),
});

export const ColliderSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  size: z.tuple([z.number(), z.number(), z.number()]),
});

export const BakedLightingSchema = z.object({
  ambientColor: z.string().default('#888888'),
  ambientIntensity: z.number().min(0).max(2).default(0.4),
  sunColor: z.string().default('#ffffff'),
  sunIntensity: z.number().min(0).max(2).default(1),
  sunDirection: z.tuple([z.number(), z.number(), z.number()]).default([0.5, 1, 0.3]),
  hemisphereSky: z.string().default('#87CEEB'),
  hemisphereGround: z.string().default('#3a7d3a'),
  fogColor: z.string().default('#c9e8f0'),
  fogNear: z.number().positive().default(20),
  fogFar: z.number().positive().default(50),
  fakeAOIntensity: z.number().min(0).max(1).default(0.15),
});

export const MapSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: MapTypeSchema,
  dimensions: z.object({ width: z.number().positive(), height: z.number().positive() }),
  navGrid: NavGridSchema.optional(),
  tiles: z.array(TileSchema).optional().default([]),
  regions: z.array(MapRegionSchema).optional().default([]),
  triggers: z.array(MapTriggerSchema).optional().default([]),
  spawnPoints: z.array(MapSpawnPointSchema),
  warps: z.array(WarpSchema),
  safeZones: z.array(SafeZoneSchema),
  enemyAreas: z.array(EnemyAreaSchema),
  decorations: z.array(MapDecorationSchema),
  colliders: z.array(ColliderSchema).optional().default([]),
  npcs: z.array(NPCSpawnSchema).optional().default([]),
  chests: z.array(ChestSchema).optional().default([]),
  bakedLighting: BakedLightingSchema.optional(),
  grassTuftCount: z.number().int().nonnegative(),
  grassTexture: z.object({ baseColor: z.string(), repeatX: z.number().positive(), repeatY: z.number().positive() }),
  ambientMusic: z.string().optional(),
  dayNightCycle: z.object({ enabled: z.boolean(), cycleMinutes: z.number().positive() }),
  floorColor: z.string(),
});

export type MapType = z.infer<typeof MapTypeSchema>;
export type TerrainType = z.infer<typeof TerrainTypeSchema>;
export type NavCell = z.infer<typeof NavCellSchema>;
export type NavGrid = z.infer<typeof NavGridSchema>;
export type Tile = z.infer<typeof TileSchema>;
export type TileLayer = z.infer<typeof TileLayerSchema>;
export type MapRegion = z.infer<typeof MapRegionSchema>;
export type MapTrigger = z.infer<typeof MapTriggerSchema>;
export type MapSpawnPoint = z.infer<typeof MapSpawnPointSchema>;
export type Warp = z.infer<typeof WarpSchema>;
export type SafeZone = z.infer<typeof SafeZoneSchema>;
export type EnemyArea = z.infer<typeof EnemyAreaSchema>;
export type MapDecoration = z.infer<typeof MapDecorationSchema>;
export type Collider = z.infer<typeof ColliderSchema>;
export type BakedLighting = z.infer<typeof BakedLightingSchema>;
export type MapConfig = z.infer<typeof MapSchema>;
