import { Markdown } from '../../markdown';
import type { hintSchema } from './schema';
import type { z } from 'zod';

type HintProps = z.infer<typeof hintSchema>;

export function Hint({ label, body }: HintProps) {
  return (
    <details className="my-5 border border-border bg-surface px-4 py-3">
      <summary className="cursor-pointer font-medium">{label}</summary>
      <div className="pt-3 text-sm leading-6">
        <Markdown>{body}</Markdown>
      </div>
    </details>
  );
}