import type { Node } from 'unist';
import { describe, expect, it } from 'vitest';
import { KitRemarkError, remarkKit } from './remark-kit';

function markdownTree(...children: object[]) {
  return { type: 'root', children } as unknown as Node & { children: Record<string, unknown>[] };
}

function expectKitError(tree: Node): KitRemarkError {
  try {
    remarkKit({ file: 'courses/demo/001-lesson.md' })(tree);
  } catch (error) {
    if (error instanceof KitRemarkError) return error;
    throw error;
  }
  throw new Error('Expected remarkKit to reject the Markdown tree');
}

describe('remarkKit', () => {
  it('replaces a valid kit fence with a KitBlock element', () => {
    const tree = markdownTree({
      type: 'code',
      lang: 'kit:callout',
      value: 'variant: tip\nbody: Keep it simple.',
      position: { start: { line: 4 } },
    });

    remarkKit({ file: 'lesson.md' })(tree);

    expect(tree.children[0]).toMatchObject({
      type: 'mdxJsxFlowElement',
      name: 'KitBlock',
      attributes: [
        { name: 'name', value: 'callout' },
        { name: 'payload', value: '{"variant":"tip","body":"Keep it simple."}' },
      ],
    });
  });

  it('leaves ordinary code fences unchanged', () => {
    const tree = markdownTree({ type: 'code', lang: 'yaml', value: 'key: value' });

    remarkKit({ file: 'lesson.md' })(tree);

    expect(tree.children[0]).toMatchObject({ type: 'code', lang: 'yaml', value: 'key: value' });
  });

  it('reports an unknown component with source context', () => {
    const error = expectKitError(
      markdownTree({ type: 'code', lang: 'kit:missing', value: '', position: { start: { line: 8 } } }),
    );

    expect(error.errors[0]).toMatchObject({
      file: 'courses/demo/001-lesson.md',
      line: 8,
      component: 'missing',
    });
    expect(error.message).toContain('Unknown kit component');
  });

  it('reports invalid YAML with source context', () => {
    const error = expectKitError(
      markdownTree({ type: 'code', lang: 'kit:callout', value: 'variant: [', position: { start: { line: 11 } } }),
    );

    expect(error.errors[0]).toMatchObject({ file: 'courses/demo/001-lesson.md', line: 11, component: 'callout' });
    expect(error.errors[0].issues[0]).toContain('Flow sequence');
  });

  it('reports schema errors with the fence line', () => {
    const error = expectKitError(
      markdownTree({
        type: 'code',
        lang: 'kit:callout',
        value: 'variant: unknown\nbody: Text',
        position: { start: { line: 15 } },
      }),
    );

    expect(error.errors[0]).toMatchObject({ file: 'courses/demo/001-lesson.md', line: 15, component: 'callout' });
    expect(error.errors[0].issues.join(' ')).toContain('variant');
  });

  it('aggregates errors from multiple kit fences', () => {
    const error = expectKitError(
      markdownTree(
        { type: 'code', lang: 'kit:missing-one', value: '', position: { start: { line: 3 } } },
        { type: 'code', lang: 'kit:missing-two', value: '', position: { start: { line: 9 } } },
      ),
    );

    expect(error.errors).toHaveLength(2);
    expect(error.message).toContain('courses/demo/001-lesson.md:3');
    expect(error.message).toContain('courses/demo/001-lesson.md:9');
  });

  it('rejects duplicate IDs for interactive components', () => {
    const block = {
      type: 'code',
      lang: 'kit:tabs',
      value: 'id: same-tabs\ntabs:\n  - label: First\n    body: First panel\n  - label: Second\n    body: Second panel',
    };
    const error = expectKitError(
      markdownTree(
        { ...block, position: { start: { line: 2 } } },
        { ...block, position: { start: { line: 12 } } },
      ),
    );

    expect(error.errors).toHaveLength(1);
    expect(error.errors[0]).toMatchObject({ file: 'courses/demo/001-lesson.md', line: 12, component: 'tabs' });
    expect(error.errors[0].issues[0]).toContain('Duplicate interactive id');
  });
});