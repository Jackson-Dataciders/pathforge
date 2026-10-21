import { Parser, type Values } from 'expr-eval';

const allowedFunctions = new Set(['min', 'max', 'pow']);

const parser = new Parser({
  allowMemberAccess: false,
  operators: {
    add: true,
    comparison: true,
    concatenate: false,
    conditional: false,
    divide: true,
    factorial: false,
    logical: false,
    multiply: true,
    power: true,
    remainder: true,
    subtract: true,
    sin: true,
    cos: true,
    tan: true,
    asin: false,
    acos: false,
    atan: false,
    sinh: false,
    cosh: false,
    tanh: false,
    asinh: false,
    acosh: false,
    atanh: false,
    sqrt: true,
    log: true,
    ln: true,
    lg: false,
    log10: false,
    abs: true,
    ceil: true,
    floor: true,
    round: false,
    trunc: false,
    exp: true,
    length: false,
    in: false,
    random: false,
    min: true,
    max: true,
    assignment: false,
    fndef: false,
    cbrt: false,
    expm1: false,
    log1p: false,
    sign: false,
    log2: false,
  },
});

parser.functions = Object.assign(Object.create(null), {
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
});

export type CompiledExpression =
  | { ok: true; evaluate: (values: Record<string, number>) => number }
  | { ok: false; error: string };

export function compileExpression(expression: string, allowedVariables: readonly string[]): CompiledExpression {
  try {
    if (/\bconstructor\b/.test(expression)) {
      return { ok: false, error: 'Unsupported identifier: constructor' };
    }

    const parsed = parser.parse(expression);
    const allowed = new Set([...allowedVariables, ...allowedFunctions]);
    const unknownVariables = parsed.variables().filter((variable) => !allowed.has(variable));

    if (unknownVariables.length > 0) {
      return { ok: false, error: `Unknown variables: ${unknownVariables.join(', ')}` };
    }

    return {
      ok: true,
      evaluate: (values) => {
        const safeValues = Object.assign(Object.create(null), values) as Values;
        return parsed.evaluate(safeValues);
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid expression.',
    };
  }
}