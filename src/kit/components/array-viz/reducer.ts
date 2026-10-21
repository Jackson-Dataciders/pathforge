import type { ArrayViz, ArrayVizOp, ArrayVizStep } from './schema';

export type ArrayVizValue = ArrayViz['initial'][number];

export type ArrayVizState = {
  kind: ArrayViz['kind'];
  values: ArrayVizValue[];
  highlights: number[];
  pointers: Record<string, number>;
};

function assertIndex(index: number, values: ArrayVizValue[]): void {
  if (index < 0 || index >= values.length) {
    throw new RangeError(`Index ${index} is outside the current values.`);
  }
}

export function applyOp(state: ArrayVizState, op: ArrayVizOp): ArrayVizState {
  const next: ArrayVizState = {
    ...state,
    values: [...state.values],
    highlights: [],
    pointers: { ...state.pointers },
  };

  switch (op.type) {
    case 'set':
      assertIndex(op.index, next.values);
      next.values[op.index] = op.value;
      break;
    case 'swap':
      assertIndex(op.i, next.values);
      assertIndex(op.j, next.values);
      [next.values[op.i], next.values[op.j]] = [next.values[op.j], next.values[op.i]];
      break;
    case 'push':
      if (state.kind !== 'stack') throw new Error('Push is only valid for a stack.');
      next.values.push(op.value);
      break;
    case 'pop':
      if (state.kind !== 'stack') throw new Error('Pop is only valid for a stack.');
      if (next.values.length === 0) throw new Error('Cannot pop an empty stack.');
      next.values.pop();
      break;
    case 'enqueue':
      if (state.kind !== 'queue') throw new Error('Enqueue is only valid for a queue.');
      next.values.push(op.value);
      break;
    case 'dequeue':
      if (state.kind !== 'queue') throw new Error('Dequeue is only valid for a queue.');
      if (next.values.length === 0) throw new Error('Cannot dequeue an empty queue.');
      next.values.shift();
      break;
    case 'highlight':
      op.indices.forEach((index) => assertIndex(index, next.values));
      next.highlights = [...op.indices];
      break;
    case 'pointer':
      if (op.index === null) {
        delete next.pointers[op.name];
      } else {
        assertIndex(op.index, next.values);
        next.pointers[op.name] = op.index;
      }
      break;
    case 'none':
      break;
  }

  return next;
}

export function stateAt(
  initial: Pick<ArrayViz, 'kind' | 'initial'>,
  steps: ArrayVizStep[],
  index: number,
): ArrayVizState {
  if (!Number.isInteger(index) || index < 0 || index > steps.length) {
    throw new RangeError(`Step index ${index} is outside the available steps.`);
  }

  let state: ArrayVizState = {
    kind: initial.kind,
    values: [...initial.initial],
    highlights: [],
    pointers: {},
  };

  for (const step of steps.slice(0, index)) {
    state = applyOp(state, step.op);
  }

  return state;
}