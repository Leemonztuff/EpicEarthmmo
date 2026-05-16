import { z } from 'zod';

export const MapDecorationSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  type: z.enum(['tree', 'bush', 'rock', 'flower']),
  scale: z.number().positive(),
});

export const MapSpawnPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  label: z.string().optional(),
});

export const MapSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  spawnPoints: z.array(MapSpawnPointSchema),
  decorations: z.array(MapDecorationSchema),
  grassTuftCount: z.number().int().nonnegative(),
  grassTexture: z.object({
    baseColor: z.string(),
    repeatX: z.number().positive(),
    repeatY: z.number().positive(),
  }),
});

export type MapDecoration = z.infer<typeof MapDecorationSchema>;
export type MapSpawnPoint = z.infer<typeof MapSpawnPointSchema>;
export type MapConfig = z.infer<typeof MapSchema>;
