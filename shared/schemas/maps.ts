import { z } from 'zod';

export const MapTypeSchema = z.enum(['town', 'field', 'dungeon', 'instance']);

export const Vector2Schema = z.object({
  x: z.number(),
  z: z.number(),
});

export const WarpSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
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
});

export const MapDecorationSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  type: z.enum(['tree', 'bush', 'rock', 'flower', 'building', 'fence', 'well', 'sign', 'castle', 'castle_tower_left', 'castle_tower_right', 'castle_gate', 'building_large', 'building_medium', 'building_small', 'fountain', 'stone_path', 'lamppost', 'bench', 'tree_ornamental', 'torch', 'pillar', 'mushroom', 'crack', 'chest', 'dungeon_wall', 'dungeon_floor_tile']),
  scale: z.number().positive(),
});

export const MapSpawnPointSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  label: z.string().optional(),
});

export const MapSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: MapTypeSchema,
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  spawnPoints: z.array(MapSpawnPointSchema),
  warps: z.array(WarpSchema),
  safeZones: z.array(SafeZoneSchema),
  enemyAreas: z.array(EnemyAreaSchema),
  decorations: z.array(MapDecorationSchema),
  grassTuftCount: z.number().int().nonnegative(),
  grassTexture: z.object({
    baseColor: z.string(),
    repeatX: z.number().positive(),
    repeatY: z.number().positive(),
  }),
  ambientMusic: z.string().optional(),
  dayNightCycle: z.object({
    enabled: z.boolean(),
    cycleMinutes: z.number().positive(),
  }),
  floorColor: z.string(),
});

export type MapType = z.infer<typeof MapTypeSchema>;
export type Warp = z.infer<typeof WarpSchema>;
export type SafeZone = z.infer<typeof SafeZoneSchema>;
export type EnemyArea = z.infer<typeof EnemyAreaSchema>;
export type MapDecoration = z.infer<typeof MapDecorationSchema>;
export type MapSpawnPoint = z.infer<typeof MapSpawnPointSchema>;
export type MapConfig = z.infer<typeof MapSchema>;
