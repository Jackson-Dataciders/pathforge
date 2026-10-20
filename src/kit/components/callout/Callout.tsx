import { Markdown } from '../../markdown';
import type { calloutSchema } from './schema';
import type { z } from 'zod';

type CalloutProps = z.infer<typeof calloutSchema>;

const variantStyles = {
  info: 'border-accent',
  tip: 'border-success',
  warning: 'border-warning',
  danger: 'border-danger',
} as const;

export function Callout({ variant, title, body }: CalloutProps) {
  return (
    <aside className={`my-5 border-l-4 ${variantStyles[variant]} bg-surface px-4 py-3`} data-variant={variant}>
      {title ? <h3 className="mb-1 font-semibold">{title}</h3> : null}
      <div className="text-sm leading-6">
        <Markdown>{body}</Markdown>
      </div>
    </aside>
  );
}