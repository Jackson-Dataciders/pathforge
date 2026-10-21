import { describe, expect, it } from 'vitest';
import { graphVizSchema } from './schema';

describe('graphVizSchema', () => {
  it('rejects edges that reference unknown nodes', () => {
    const result = graphVizSchema.safeParse({
      id: 'unknown-edge-node',
      nodes: [{ id: 'first', label: 'First' }],
      edges: [{ from: 'first', to: 'missing' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(['edges', 0, 'to']);
  });

  it('uses the documented defaults and accepts references in an undirected edge', () => {
    const result = graphVizSchema.safeParse({
      id: 'undirected-graph',
      directed: false,
      nodes: [
        { id: 'first', label: 'First' },
        { id: 'second', label: 'Second' },
      ],
      edges: [{ from: 'first', to: 'second' }],
      steps: [{ caption: 'Traverse the edge.', highlight_edges: [['second', 'first']] }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.layout).toBe('layered');
      expect(result.data.directed).toBe(false);
    }
  });
});