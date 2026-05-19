import { z } from 'zod';

export const DialogResponseSchema = z.object({
  text: z.string(),
  nextDialogId: z.string().optional(),
  action: z.string().optional(),
});

export const DialogLineSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  responses: z.array(DialogResponseSchema).optional(),
});

export const DialogSchema = z.object({
  id: z.string(),
  npcName: z.string(),
  lines: z.array(DialogLineSchema),
});

export const DialogDatabaseSchema = z.object({
  dialogs: z.array(DialogSchema),
});

export type DialogResponse = z.infer<typeof DialogResponseSchema>;
export type DialogLine = z.infer<typeof DialogLineSchema>;
export type Dialog = z.infer<typeof DialogSchema>;
export type DialogDatabase = z.infer<typeof DialogDatabaseSchema>;
