import { z } from 'zod';
import { compileExpression } from './expression';

const identifierSchema = z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/);
const axisSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string().optional(),
});

export const paramPlotSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().optional(),
    x: axisSchema,
    y: axisSchema.optional(),
    samples: z.number().int().min(20).max(1000).default(200),
    params: z
      .array(
        z.object({
          name: identifierSchema,
          label: z.string().optional(),
          min: z.number(),
          max: z.number(),
          step: z.number().positive(),
          value: z.number(),
        }),
      )
      .min(0)
      .max(5),
    series: z
      .array(
        z.object({
          expression: z.string().min(1),
          label: z.string().optional(),
        }),
      )
      .min(1)
      .max(4),
  })
  .superRefine((plot, context) => {
    if (plot.x.min >= plot.x.max) {
      context.addIssue({ code: 'custom', path: ['x', 'min'], message: 'The x minimum must be less than its maximum.' });
    }

    if (plot.y && plot.y.min >= plot.y.max) {
      context.addIssue({ code: 'custom', path: ['y', 'min'], message: 'The y minimum must be less than its maximum.' });
    }

    const names = plot.params.map((param) => param.name);
    const reservedNames = new Set(['x', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sqrt', 'abs', 'floor', 'ceil', 'min', 'max', 'pow']);

    for (const [index, param] of plot.params.entries()) {
      if (param.min >= param.max) {
        context.addIssue({
          code: 'custom',
          path: ['params', index, 'min'],
          message: 'The parameter minimum must be less than its maximum.',
        });
      }
      if (param.value < param.min || param.value > param.max) {
        context.addIssue({
          code: 'custom',
          path: ['params', index, 'value'],
          message: 'The parameter value must be within its minimum and maximum.',
        });
      }
      if (reservedNames.has(param.name)) {
        context.addIssue({
          code: 'custom',
          path: ['params', index, 'name'],
          message: `The parameter name "${param.name}" is reserved.`,
        });
      }
      if (names.indexOf(param.name) !== index) {
        context.addIssue({
          code: 'custom',
          path: ['params', index, 'name'],
          message: 'Parameter names must be unique.',
        });
      }
    }

    const allowedVariables = ['x', ...names];
    for (const [index, series] of plot.series.entries()) {
      const result = compileExpression(series.expression, allowedVariables);
      if (!result.ok) {
        context.addIssue({
          code: 'custom',
          path: ['series', index, 'expression'],
          message: result.error,
        });
      }
    }
  });

export type ParamPlot = z.infer<typeof paramPlotSchema>;