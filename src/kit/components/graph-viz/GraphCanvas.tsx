'use client';

import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { useThemeTokens } from '@/theme/use-theme-tokens';
import { StepperControls } from '../../shared/stepper-controls';
import { useStepper } from '../../shared/use-stepper';
import { layoutGraph, type LayoutNode } from '../../shared/elk-layout';
import type { GraphViz as GraphVizData } from './schema';

type FlowNode = Node<{ label: string }>;

export function GraphCanvas({ id, title, directed, layout, nodes, edges, steps }: GraphVizData) {
  const tokens = useThemeTokens();
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [layoutError, setLayoutError] = useState('');
  const { index, next, prev, playing, play, pause } = useStepper({
    count: steps.length + 1,
    autoplay: false,
    intervalMs: 2500,
  });
  const currentStep = index > 0 ? steps[index - 1] : undefined;
  const caption = currentStep?.caption ?? (steps.length > 0 ? 'Initial graph.' : 'Graph overview.');
  const highlightedNodeIds = new Set(currentStep?.highlight_nodes ?? []);
  const highlightedNodeLabels = nodes.filter((node) => highlightedNodeIds.has(node.id)).map((node) => node.label);

  useEffect(() => {
    let active = true;
    void layoutGraph(
      nodes.map(({ id: nodeId }) => ({ id: nodeId })),
      edges.map((edge, edgeIndex) => ({ id: `edge-${edgeIndex}`, from: edge.from, to: edge.to })),
      layout,
    ).then(
      (result) => {
        if (active) {
          setLayoutNodes(result);
          setLayoutError('');
        }
      },
      (error: unknown) => {
        if (active) setLayoutError(error instanceof Error ? error.message : String(error));
      },
    );

    return () => {
      active = false;
    };
  }, [edges, layout, nodes]);

  if (layoutError) {
    return <div className="my-5 border border-danger bg-surface p-4 text-sm" role="alert">Graph layout failed: {layoutError}</div>;
  }

  const flowNodes: FlowNode[] = layoutNodes.map(({ id: nodeId, x, y, width, height }) => {
    const source = nodes.find((node) => node.id === nodeId);
    const highlighted = highlightedNodeIds.has(nodeId);
    return {
      id: nodeId,
      position: { x, y },
      data: { label: source?.label ?? nodeId },
      style: {
        width,
        height,
        display: 'grid',
        placeItems: 'center',
        border: `1px solid ${highlighted ? tokens.accent : tokens.border}`,
        borderRadius: 3,
        background: highlighted ? tokens.accent : tokens.surface,
        color: highlighted ? tokens['accent-fg'] : tokens.fg,
        fontSize: 14,
        padding: '0 10px',
      },
    };
  });

  const flowEdges: Edge[] = edges.map((edge, edgeIndex) => {
    const highlighted = (currentStep?.highlight_edges ?? []).some(
      ([from, to]) =>
        (edge.from === from && edge.to === to) ||
        (!directed && edge.from === to && edge.to === from),
    );
    const color = highlighted ? tokens.accent : tokens.border;
    return {
      id: `edge-${edgeIndex}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      style: { stroke: color, strokeWidth: highlighted ? 3 : 1.5 },
      labelStyle: { fill: tokens.fg, fontSize: 12 },
      labelBgStyle: { fill: tokens.bg },
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color } : undefined,
    };
  });

  return (
    <section aria-label={title || 'Graph visualization'} className="my-6">
      {title ? <h3 className="mb-3 text-lg font-semibold text-fg">{title}</h3> : null}
      <p className="mb-3 text-sm leading-6 text-fg">{caption}</p>
      <div aria-label={`${id}: ${caption}`} className="h-[420px] min-w-[320px] w-full overflow-hidden border border-border" role="group">
        {layoutNodes.length === 0 ? (
          <div aria-label="Laying out graph" className="h-full animate-pulse bg-surface" role="status" />
        ) : (
          <ReactFlow
            edges={flowEdges}
            elementsSelectable={false}
            fitView
            maxZoom={1.8}
            minZoom={0.35}
            nodes={flowNodes}
            nodesConnectable={false}
            nodesDraggable={false}
            proOptions={{ hideAttribution: false }}
            zoomOnDoubleClick={false}
          >
            <Background color={tokens.border} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
      <div aria-live="polite" className="sr-only">
        <p>{caption}</p>
        <p>{`Highlighted nodes: ${highlightedNodeLabels.join(', ') || 'none'}.`}</p>
        <ul aria-label="Highlighted node labels">
          {highlightedNodeLabels.map((label, labelIndex) => <li key={`${label}-${labelIndex}`}>{label}</li>)}
        </ul>
      </div>
      {steps.length > 0 ? (
        <StepperControls
          count={steps.length + 1}
          index={index}
          next={next}
          pause={pause}
          play={play}
          playing={playing}
          prev={prev}
        />
      ) : null}
    </section>
  );
}