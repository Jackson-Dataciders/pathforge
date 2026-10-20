import { z } from 'zod';

export const hintSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().default('Show hint'),
  body: z.string(),
});