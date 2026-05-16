import { z } from 'zod';

export const SkillEffectSchema = z.object({
  type: z.enum(['damage', 'buff', 'debuff', 'heal', 'aoe_damage', 'taunt']),
  statMultiplier: z.number().optional(),
  flatValue: z.number().optional(),
  durationMs: z.number().optional(),
  range: z.number().optional(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  spCost: z.number().int().nonnegative(),
  requirements: z.array(z.string()),
  skillPointCost: z.number().int().nonnegative(),
  effect: SkillEffectSchema,
  icon: z.string().optional(),
});

export const SkillTreeSchema = z.array(SkillSchema);

export type SkillEffect = z.infer<typeof SkillEffectSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type SkillTree = z.infer<typeof SkillTreeSchema>;
