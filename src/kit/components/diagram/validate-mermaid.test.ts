// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { validateMermaid } from './validate-mermaid';

describe('validateMermaid', () => {
  it('accepts a flowchart', async () => {
    await expect(validateMermaid('flowchart LR\n  A --> B')).resolves.toEqual({ ok: true });
  });

  it('accepts a sequence diagram', async () => {
    await expect(validateMermaid('sequenceDiagram\n  Alice->>Bob: Hello')).resolves.toEqual({ ok: true });
  });

  it('returns a message for invalid syntax', async () => {
    const result = await validateMermaid('flowchart LR\n  A -->');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).not.toBe('');
  });
});