import { z } from 'zod';

export const stepperSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().optional(),
  autoplay: z.boolean().default(false),
  interval_ms: z.number().int().min(1000).max(10000).default(2500),
  steps: z
    .array(
      z.object({
        caption: z.string(),
        diagram: z.string().min(1).optional(),
        body: z.string().optional(),
      }),
    )
    .min(2)
    .max(20)
    .refine((steps) => steps.every((step) => step.diagram !== undefined || step.body !== undefined), {
      message: 'Each step must include a diagram or body.',
    }),
});