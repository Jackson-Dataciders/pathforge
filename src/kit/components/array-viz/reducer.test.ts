import { describe, expect, it } from 'vitest';
import { arrayVizSchema } from './schema';
import { applyOp, stateAt, type ArrayVizState } from './reducer';

const arrayState: ArrayVizState = {
  kind: 'array',
  values: [1, 2, 3],
  highlights: [],
  pointers: {},
};

describe('applyOp', () => {
  it('sets and swaps values', () => {
    expect(applyOp(arrayState, { type: 'set', index: 1, value: 9 }).values).toEqual([1, 9, 3]);
    expect(applyOp(arrayState, { type: 'swap', i: 0, j: 2 }).values).toEqual([3, 2, 1]);
  });

  it('pushes and pops stack values', () => {
    const stack = { ...arrayState, kind: 'stack' as const };
    expect(applyOp(stack, { type: 'push', value: 4 }).values).toEqual([1, 2, 3, 4]);
    expect(applyOp(stack, { type: 'pop' }).values).toEqual([1, 2]);
  });

  it('enqueues and dequeues queue values', () => {
    const queue = { ...arrayState, kind: 'queue' as const };
    expect(applyOp(queue, { type: 'enqueue', value: 4 }).values).toEqual([1, 2, 3, 4]);
    expect(applyOp(queue, { type: 'dequeue' }).values).toEqual([2, 3]);
  });

  it('highlights only the current step and preserves pointers until removed', () => {
    const highlighted = applyOp(arrayState, { type: 'highlight', indices: [0, 2] });
    expect(highlighted.highlights).toEqual([0, 2]);

    const pointed = applyOp(highlighted, { type: 'pointer', name: 'left', index: 1 });
    expect(pointed.highlights).toEqual([]);
    expect(pointed.pointers).toEqual({ left: 1 });
    expect(applyOp(pointed, { type: 'pointer', name: 'left', index: null }).pointers).toEqual({});
  });

  it('leaves values unchanged for none', () => {
    expect(applyOp(arrayState, { type: 'none' }).values).toEqual(arrayState.values);
  });

  it('rejects operations for the wrong kind and removals from empty structures', () => {
    expect(() => applyOp(arrayState, { type: 'enqueue', value: 4 })).toThrow('only valid for a queue');
    expect(() => applyOp({ ...arrayState, kind: 'queue' }, { type: 'push', value: 4 })).toThrow(
      'only valid for a stack',
    );
    expect(() => applyOp({ ...arrayState, kind: 'stack', values: [] }, { type: 'pop' })).toThrow(
      'empty stack',
    );
    expect(() => applyOp({ ...arrayState, kind: 'queue', values: [] }, { type: 'dequeue' })).toThrow(
      'empty queue',
    );
  });

  it('rejects out-of-range indexes', () => {
    expect(() => applyOp(arrayState, { type: 'set', index: 3, value: 4 })).toThrow(RangeError);
    expect(() => applyOp(arrayState, { type: 'swap', i: 0, j: 3 })).toThrow(RangeError);
    expect(() => applyOp(arrayState, { type: 'highlight', indices: [3] })).toThrow(RangeError);
    expect(() => applyOp(arrayState, { type: 'pointer', name: 'right', index: 3 })).toThrow(RangeError);
  });

  it('computes cumulative state and step-local highlights', () => {
    const initial = { kind: 'array' as const, initial: [3, 1] };
    const steps = [
      { caption: 'Swap', op: { type: 'swap' as const, i: 0, j: 1 } },
      { caption: 'Highlight', op: { type: 'highlight' as const, indices: [0] } },
      { caption: 'Keep pointer', op: { type: 'pointer' as const, name: 'cursor', index: 1 } },
    ];

    expect(stateAt(initial, steps, 0).values).toEqual([3, 1]);
    expect(stateAt(initial, steps, 1).values).toEqual([1, 3]);
    expect(stateAt(initial, steps, 2).highlights).toEqual([0]);
    expect(stateAt(initial, steps, 3).pointers).toEqual({ cursor: 1 });
  });
});

describe('arrayVizSchema operation refinement', () => {
  it('rejects kind mismatches and indexes invalidated by earlier steps', () => {
    const result = arrayVizSchema.safeParse({
      id: 'invalid-stack',
      kind: 'stack',
      initial: [1],
      steps: [
        { caption: 'Wrong operation', op: { type: 'enqueue', value: 2 } },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(['steps', 0, 'op']);

    const invalidIndex = arrayVizSchema.safeParse({
      id: 'invalid-index',
      kind: 'stack',
      initial: [1],
      steps: [
        { caption: 'Pop the last value', op: { type: 'pop' } },
        { caption: 'Point to the removed value', op: { type: 'pointer', name: 'top', index: 0 } },
      ],
    });

    expect(invalidIndex.success).toBe(false);
    if (!invalidIndex.success) expect(invalidIndex.error.issues[0].path).toEqual(['steps', 1, 'op']);
  });
});