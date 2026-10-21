import { z } from 'zod';
import { applyOp, type ArrayVizState } from './reducer';

const valueSchema = z.union([z.string(), z.number()]);
const indexSchema = z.number().int().nonnegative();

export const arrayVizOpSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('set'), index: indexSchema, value: valueSchema }),
  z.object({ type: z.literal('swap'), i: indexSchema, j: indexSchema }),
  z.object({ type: z.literal('push'), value: valueSchema }),
  z.object({ type: z.literal('pop') }),
  z.object({ type: z.literal('enqueue'), value: valueSchema }),
  z.object({ type: z.literal('dequeue') }),
  z.object({ type: z.literal('highlight'), indices: z.array(indexSchema) }),
  z.object({ type: z.literal('pointer'), name: z.string().min(1), index: indexSchema.nullable() }),
  z.object({ type: z.literal('none') }),
]);

export const arrayVizStepSchema = z.object({
  caption: z.string(),
  op: arrayVizOpSchema,
});

export const arrayVizSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().optional(),
    kind: z.enum(['array', 'stack', 'queue']),
    initial: z.array(valueSchema).max(30),
    steps: z.array(arrayVizStepSchema).min(1).max(40),
  })
  .superRefine((visualization, context) => {
    let state: ArrayVizState = {
      kind: visualization.kind,
      values: [...visualization.initial],
      highlights: [],
      pointers: {},
    };

    for (const [index, step] of visualization.steps.entries()) {
      try {
        state = applyOp(state, step.op);
      } catch (error) {
        context.addIssue({
          code: 'custom',
          path: ['steps', index, 'op'],
          message: error instanceof Error ? error.message : 'Invalid operation.',
        });
        break;
      }
    }
  });

export type ArrayViz = z.infer<typeof arrayVizSchema>;
export type ArrayVizOp = z.infer<typeof arrayVizOpSchema>;
export type ArrayVizStep = z.infer<typeof arrayVizStepSchema>;