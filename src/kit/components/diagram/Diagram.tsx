'use client';

import dynamic from 'next/dynamic';
import type { diagramSchema } from './schema';
import type { z } from 'zod';

type DiagramProps = z.infer<typeof diagramSchema>;

const DiagramRenderer = dynamic(
  () => import('./DiagramRenderer').then((module) => module.DiagramRenderer),
  {
    ssr: false,
    loading: () => <div aria-label="Loading diagram" className="my-5 h-48 animate-pulse bg-surface" role="status" />,
  },
);

export function Diagram({ code, caption, alt }: DiagramProps) {
  return (
    <figure aria-label={alt || caption || 'Diagram'} className="my-5" role="img">
      <DiagramRenderer code={code} />
      {caption ? <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption> : null}
    </figure>
  );
}