import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import { getKitComponent } from './registry';
import { KitBlockError, parseKitBlock } from './parse-block';

export type RemarkKitOptions = { file: string };

type CodeNode = Node & {
  lang?: string | null;
  value?: string;
  position?: { start: { line: number } };
};

export class KitRemarkError extends Error {
  constructor(readonly errors: KitBlockError[]) {
    super(errors.map((error) => error.message).join('\n'));
    this.name = 'KitRemarkError';
  }
}

export function remarkKit({ file }: RemarkKitOptions) {
  return (tree: Node) => {
    const errors: KitBlockError[] = [];
    const interactiveIds = new Map<string, number>();

    visit(tree, 'code', (node) => {
      const code = node as CodeNode;
      const isMermaid = code.lang === 'mermaid';
      if (!isMermaid && !code.lang?.startsWith('kit:')) return;

      const name = isMermaid ? 'diagram' : code.lang!.slice('kit:'.length);
      const line = code.position?.start.line ?? 1;
      let props: Record<string, unknown>;

      if (isMermaid) {
        const result = getKitComponent(name)?.schema.safeParse({ code: code.value ?? '' });
        if (!result?.success) {
          const issues = result?.error.issues.map((issue) => {
            const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
            return `${path}${issue.message}`;
          }) ?? ['Unknown kit component "diagram"'];
          errors.push(new KitBlockError(file, line, name, issues));
          return;
        }
        props = result.data as Record<string, unknown>;
      } else {
        try {
          props = parseKitBlock({ name, yamlText: code.value ?? '', file, line });
        } catch (error) {
          if (error instanceof KitBlockError) errors.push(error);
          else throw error;
          return;
        }
      }

      const definition = getKitComponent(name);
      if (definition?.interactive) {
        const id = props.id as string;
        const firstLine = interactiveIds.get(id);
        if (firstLine !== undefined) {
          errors.push(new KitBlockError(file, line, name, [`Duplicate interactive id "${id}" (first used at line ${firstLine})`]));
          return;
        }
        interactiveIds.set(id, line);
      }

      Object.assign(code, {
        type: 'mdxJsxFlowElement',
        name: 'KitBlock',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'name', value: name },
          { type: 'mdxJsxAttribute', name: 'payload', value: JSON.stringify(props) },
        ],
        children: [],
        position: code.position,
        lang: undefined,
        value: undefined,
        meta: undefined,
      });
    });

    if (errors.length > 0) throw new KitRemarkError(errors);
  };
}