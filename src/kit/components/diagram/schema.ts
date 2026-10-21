import { z } from 'zod';

export const diagramSchema = z
  .object({
    code: z.string().min(1),
    caption: z.string().optional(),
    alt: z.string().optional(),
  })
  .strict();