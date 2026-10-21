import { describe, expect, it } from 'vitest';
import { paramPlotSchema } from './schema';

const validPlot = {
  id: 'growth-rates',
  x: { min: 1, max: 10 },
  params: [{ name: 'c', min: 0, max: 5, step: 0.1, value: 2 }],
  series: [{ expression: 'c * x' }],
};

describe('paramPlotSchema', () => {
  it('uses the default sample count and accepts a declared parameter', () => {
    const result = paramPlotSchema.safeParse(validPlot);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.samples).toBe(200);
  });

  it('rejects a series expression with an undeclared variable', () => {
    const result = paramPlotSchema.safeParse({
      ...validPlot,
      series: [{ expression: 'c * x + secret' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(['series', 0, 'expression']);
  });

  it('rejects invalid ranges, values, and reserved parameter names', () => {
    const result = paramPlotSchema.safeParse({
      ...validPlot,
      params: [{ name: 'x', min: 3, max: 2, step: 0, value: 4 }],
    });

    expect(result.success).toBe(false);
  });
});