import { z } from 'zod';

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const PlayerStatsSchema = z.object({
  str: z.number(),
  agi: z.number(),
  vit: z.number(),
  int: z.number(),
  dex: z.number(),
  luk: z.number(),
  statPoints: z.number(),
});

export const DamageTextSchema = z.object({
  id: z.string(),
  amount: z.number(),
  position: Vector3Schema,
  timestamp: z.number(),
  color: z.string(),
});

export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['usable', 'equip', 'misc']),
  amount: z.number(),
  description: z.string(),
});

export const PlayerStateSchema = z.object({
  name: z.string(),
  baseLevel: z.number(),
  jobLevel: z.number(),
  baseExp: z.number(),
  jobExp: z.number(),
  hp: z.number(),
  maxHp: z.number(),
  sp: z.number(),
  maxSp: z.number(),
  zeny: z.number(),
  jobClass: z.string(),
  stats: PlayerStatsSchema,
  skillPoints: z.number(),
  unlockedSkills: z.array(z.string()),
  inventory: z.array(InventoryItemSchema),
});

export const EnemyStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  hp: z.number(),
  maxHp: z.number(),
  level: z.number(),
  position: Vector3Schema,
  isDead: z.boolean(),
  deathTime: z.number().optional(),
});

export const GameUIStateSchema = z.object({
  isSkillsOpen: z.boolean(),
  isStatsOpen: z.boolean(),
  isInventoryOpen: z.boolean(),
});

export type Vector3 = z.infer<typeof Vector3Schema>;
export type Vector3State = Vector3;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export type DamageText = z.infer<typeof DamageTextSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type EnemyState = z.infer<typeof EnemyStateSchema>;
export type GameUIState = z.infer<typeof GameUIStateSchema>;
