'use client';

import dynamic from 'next/dynamic';
import type { GraphViz as GraphVizData } from './schema';

const GraphCanvas = dynamic(() => import('./GraphCanvas').then((module) => module.GraphCanvas), {
  ssr: false,
  loading: () => <div aria-label="Loading graph visualization" className="my-5 h-[420px] animate-pulse bg-surface" role="status" />,
});

export function GraphViz(props: GraphVizData) {
  return <GraphCanvas {...props} />;
}