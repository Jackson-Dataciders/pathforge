import { describe, expect, it } from 'vitest';
import { compileExpression } from './expression';

describe('compileExpression', () => {
  it('evaluates arithmetic and the allowed math functions', () => {
    const result = compileExpression('pow(x, 2) + max(abs(c), sqrt(9)) + sin(0)', ['x', 'c']);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.evaluate({ x: 3, c: -2 })).toBe(12);
  });

  it('rejects constructor access', () => {
    expect(compileExpression('constructor(1)', ['x']).ok).toBe(false);
    expect(compileExpression('x.constructor', ['x']).ok).toBe(false);
  });

  it('reports unknown identifiers', () => {
    const result = compileExpression('x + secret', ['x']);

    expect(result).toMatchObject({ ok: false, error: 'Unknown variables: secret' });
  });

  it('reports syntax errors', () => {
    expect(compileExpression('x +', ['x']).ok).toBe(false);
  });

  it('rejects unsupported operators and functions', () => {
    expect(compileExpression('x ? 1 : 2', ['x']).ok).toBe(false);
    expect(compileExpression('random()', ['x']).ok).toBe(false);
  });
});