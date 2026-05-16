import { z } from 'zod';

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
  sprite: z.string().optional(),
});

export const JobDatabaseSchema = z.array(JobClassSchema);

export type JobClass = z.infer<typeof JobClassSchema>;
export type JobDatabase = z.infer<typeof JobDatabaseSchema>;
