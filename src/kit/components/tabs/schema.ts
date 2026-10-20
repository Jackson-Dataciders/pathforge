import { z } from 'zod';

export const tabsSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tabs: z
    .array(
      z.object({
        label: z.string().min(1),
        body: z.string(),
      }),
    )
    .min(2)
    .max(6),
});