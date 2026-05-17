import { z } from 'zod';

export const MobBehaviorSchema = z.enum(['passive', 'aggressive', 'assist']);
export type MobBehavior = z.infer<typeof MobBehaviorSchema>;

export const DropEntrySchema = z.object({
  itemId: z.string(),
  chance: z.number().min(0).max(1),
  minAmount: z.number().int().positive(),
  maxAmount: z.number().int().positive(),
});

export const EnemyTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().positive(),
  hp: z.number().positive(),
  sprite: z.string(),
  drops: z.array(DropEntrySchema),
  expBase: z.number().int().nonnegative(),
  expJob: z.number().int().nonnegative(),
  behavior: MobBehaviorSchema,
  agroRange: z.number().positive(),
  attackRange: z.number().positive(),
  attackDamage: z.number().positive(),
  attackCooldownMs: z.number().positive(),
  moveSpeed: z.number().positive(),
  patrolPauseMs: z.number().nonnegative(),
});

export const EnemySpawnSchema = z.object({
  enemyId: z.string(),
  spawnId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

export const EnemyDataSchema = z.object({
  templates: z.array(EnemyTemplateSchema),
  spawns: z.array(EnemySpawnSchema),
});

export type DropEntry = z.infer<typeof DropEntrySchema>;
export type EnemyTemplate = z.infer<typeof EnemyTemplateSchema>;
export type EnemySpawn = z.infer<typeof EnemySpawnSchema>;
export type EnemyData = z.infer<typeof EnemyDataSchema>;
