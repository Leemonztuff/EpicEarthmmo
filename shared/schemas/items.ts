import { z } from 'zod';

export const ItemEffectSchema = z.object({
  type: z.enum(['restore_hp', 'restore_sp', 'restore_hp_percent', 'restore_sp_percent', 'buff_stat', 'teleport', 'summon']),
  value: z.number().optional(),
  targetStat: z.enum(['str', 'agi', 'vit', 'int', 'dex', 'luk']).optional(),
  durationMs: z.number().optional(),
  percent: z.number().min(0).max(100).optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['usable', 'equip', 'misc']),
  description: z.string(),
  effect: ItemEffectSchema.optional(),
  maxStack: z.number().int().positive(),
  icon: z.string().optional(),
  equipStats: z.object({
    str: z.number().int().optional(),
    agi: z.number().int().optional(),
    vit: z.number().int().optional(),
    int: z.number().int().optional(),
    dex: z.number().int().optional(),
    luk: z.number().int().optional(),
  }).optional(),
});

export const ItemDatabaseSchema = z.array(ItemSchema);

export type ItemEffect = z.infer<typeof ItemEffectSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type ItemDatabase = z.infer<typeof ItemDatabaseSchema>;
