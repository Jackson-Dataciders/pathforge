import { z } from 'zod';

export const calloutSchema = z.object({
  variant: z.enum(['info', 'tip', 'warning', 'danger']),
  title: z.string().optional(),
  body: z.string(),
});