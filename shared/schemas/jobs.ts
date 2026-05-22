import { z } from 'zod';

export const PassiveEffectSchema = z.object({
  type: z.enum([
    'damage_bonus_pct',
    'sp_regen_pct',
    'attack_range_bonus',
    'double_attack_chance',
    'heal_effect_pct',
    'zeny_drop_pct',
    'buy_discount_pct',
  ]),
  value: z.number(),
});

export const LevelUpBonusSchema = z.object({
  hpPerLevel: z.number().int(),
  spPerLevel: z.number().int(),
  statPointsPerLevel: z.number().int(),
});

export const JobClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  requirements: z.object({
    fromJob: z.string(),
    minJobLevel: z.number().int().positive(),
  }).optional(),
  baseStatModifiers: z.object({
    str: z.number().int(),
    agi: z.number().int(),
    vit: z.number().int(),
    int: z.number().int(),
    dex: z.number().int(),
    luk: z.number().int(),
  }),
  bonusSkillPoints: z.number().int().nonnegative(),
  passiveEffects: z.array(PassiveEffectSchema).optional().default([]),
  passiveDescription: z.string().optional(),
  levelUpBonuses: LevelUpBonusSchema.optional(),
  autoLearnSkills: z.array(z.string()).optional(),
  sprite: z.string().optional(),
});

export const JobDatabaseSchema = z.array(JobClassSchema);

export type JobClass = z.infer<typeof JobClassSchema>;
export type JobDatabase = z.infer<typeof JobDatabaseSchema>;
