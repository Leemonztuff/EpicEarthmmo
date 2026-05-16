import { z } from 'zod';

export const StatNameSchema = z.enum(['str', 'agi', 'vit', 'int', 'dex', 'luk']);
export type StatName = z.infer<typeof StatNameSchema>;

export const BalanceSchema = z.object({
  server: z.object({
    tickRateMs: z.number().positive(),
    maxFrameDeltaMs: z.number().positive(),
    fullSnapshotInterval: z.number().int().positive(),
  }),
  movement: z.object({
    playerSpeed: z.number().positive(),
  }),
  combat: z.object({
    attackRange: z.number().positive(),
    attackCooldownMs: z.number().positive(),
    baseDamageFormula: z.object({
      statMultiplier: z.number().positive(),
      randomVariance: z.number().min(0),
    }),
  }),
  regen: z.object({
    amountPerTick: z.number().positive(),
    intervalTicks: z.number().int().positive(),
  }),
  enemy: z.object({
    respawnMs: z.number().positive(),
    respawnGraceMs: z.number().positive(),
  }),
  stats: z.object({
    cap: z.number().int().positive(),
  }),
  network: z.object({
    interestRange: z.number().positive(),
  }),
  limits: z.object({
    playerNameMaxLength: z.number().int().positive(),
    chatMaxLength: z.number().int().positive(),
    itemMaxStack: z.number().int().positive(),
  }),
  progression: z.object({
    baseExpFormula: z.object({
      multiplier: z.number().positive(),
    }),
    jobExpFormula: z.object({
      multiplier: z.number().positive(),
    }),
    baseLevelUpThreshold: z.object({
      formula: z.literal('level * multiplier'),
      multiplier: z.number().positive(),
    }),
    jobLevelUpThreshold: z.object({
      formula: z.literal('level * multiplier'),
      multiplier: z.number().positive(),
      maxLevel: z.number().int().positive(),
    }),
    levelUpGains: z.object({
      hpPerLevel: z.number().positive(),
      spPerLevel: z.number().positive(),
      statPointsFormula: z.object({
        formula: z.literal('floor((level - 1) / divisor) + base'),
        divisor: z.number().positive(),
        base: z.number().positive(),
      }),
      jobSkillPointsPerLevel: z.number().int().positive(),
    }),
  }),
  defaultPlayer: z.object({
    spawnPosition: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    baseStats: z.object({
      str: z.number().int(),
      agi: z.number().int(),
      vit: z.number().int(),
      int: z.number().int(),
      dex: z.number().int(),
      luk: z.number().int(),
    }),
    hp: z.number().positive(),
    sp: z.number().positive(),
    skillPoints: z.number().int().nonnegative(),
  }),
});

export type BalanceConfig = z.infer<typeof BalanceSchema>;
