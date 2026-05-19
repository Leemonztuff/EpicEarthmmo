import { z } from 'zod';

export const NPCSpawnSchema = z.object({
  id: z.string(),
  name: z.string(),
  sprite: z.string(),
  dialogId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

export const ChestSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  lootTable: z.array(z.object({
    itemId: z.string(),
    chance: z.number().min(0).max(1),
    minAmount: z.number().int().positive(),
    maxAmount: z.number().int().positive(),
  })),
  respawnSeconds: z.number().positive(),
});

export type NPCSpawn = z.infer<typeof NPCSpawnSchema>;
export type Chest = z.infer<typeof ChestSchema>;
