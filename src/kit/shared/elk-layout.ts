import ELK from 'elkjs/lib/elk.bundled.js';

export type LayoutNodeInput = {
  id: string;
  width?: number;
  height?: number;
};

export type LayoutEdgeInput = {
  id?: string;
  from: string;
  to: string;
};

export type LayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const elk = new ELK();

export async function layoutGraph(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  layout: 'tree' | 'layered',
): Promise<LayoutNode[]> {
  const nodeDimensions = new Map(nodes.map((node) => [node.id, { width: node.width ?? 160, height: node.height ?? 56 }]));
  const result = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': layout === 'tree' ? 'mrtree' : 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '64',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.width ?? 160,
      height: node.height ?? 56,
    })),
    edges: edges.map((edge, index) => ({
      id: edge.id ?? `edge-${index}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  });

  return (result.children ?? []).map((node) => {
    const dimensions = nodeDimensions.get(node.id);
    return {
      id: node.id,
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? dimensions?.width ?? 160,
      height: node.height ?? dimensions?.height ?? 56,
    };
  });
}