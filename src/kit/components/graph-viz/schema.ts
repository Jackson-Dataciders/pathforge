import { z } from 'zod';

const graphNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
});

const graphEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
});

const graphStepSchema = z.object({
  caption: z.string(),
  highlight_nodes: z.array(z.string()).optional(),
  highlight_edges: z.array(z.tuple([z.string(), z.string()])).optional(),
});

export const graphVizSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().optional(),
    directed: z.boolean().default(true),
    layout: z.enum(['tree', 'layered']).default('layered'),
    nodes: z.array(graphNodeSchema).min(1).max(40),
    edges: z.array(graphEdgeSchema),
    steps: z.array(graphStepSchema).max(30).default([]),
  })
  .superRefine((graph, context) => {
    const nodeIds = new Set(graph.nodes.map((node) => node.id));

    if (nodeIds.size !== graph.nodes.length) {
      context.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'Node ids must be unique.',
      });
    }

    graph.edges.forEach((edge, index) => {
      if (!nodeIds.has(edge.from)) {
        context.addIssue({
          code: 'custom',
          path: ['edges', index, 'from'],
          message: `Unknown node: ${edge.from}.`,
        });
      }
      if (!nodeIds.has(edge.to)) {
        context.addIssue({
          code: 'custom',
          path: ['edges', index, 'to'],
          message: `Unknown node: ${edge.to}.`,
        });
      }
    });

    graph.steps.forEach((step, stepIndex) => {
      step.highlight_nodes?.forEach((nodeId, highlightIndex) => {
        if (!nodeIds.has(nodeId)) {
          context.addIssue({
            code: 'custom',
            path: ['steps', stepIndex, 'highlight_nodes', highlightIndex],
            message: `Unknown node: ${nodeId}.`,
          });
        }
      });

      step.highlight_edges?.forEach(([from, to], highlightIndex) => {
        const exists = graph.edges.some(
          (edge) =>
            (edge.from === from && edge.to === to) ||
            (!graph.directed && edge.from === to && edge.to === from),
        );
        if (!exists) {
          context.addIssue({
            code: 'custom',
            path: ['steps', stepIndex, 'highlight_edges', highlightIndex],
            message: `Unknown edge: ${from} to ${to}.`,
          });
        }
      });
    });
  });

export type GraphViz = z.infer<typeof graphVizSchema>;