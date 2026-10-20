import { describe, expect, it } from 'vitest';
import {
  getSection,
  parseMarkdownFile,
  setSection,
  stringifyMarkdownFile,
} from './markdown-file';

describe('markdown files', () => {
  it('preserves unknown frontmatter keys and body text through a round-trip', () => {
    const input = [
      '---',
      'title: Example',
      'custom_metadata:',
      '  retained: true',
      '---',
      '# Example',
      '',
      'Body text stays intact.',
      '',
    ].join('\n');

    const parsed = parseMarkdownFile(input);
    const result = parseMarkdownFile(stringifyMarkdownFile(parsed.data, parsed.body));

    expect(result.data).toEqual({ title: 'Example', custom_metadata: { retained: true } });
    expect(result.body).toBe(parsed.body);
  });

  it('gets and replaces one section without changing neighboring content', () => {
    const body = '# Course\n\n## Description\nOld description.\n\n## Summary\nKeep this summary.\n';

    expect(getSection(body, 'Description')).toBe('Old description.');
    expect(setSection(body, 'Description', 'New description.')).toBe(
      '# Course\n\n## Description\nNew description.\n\n## Summary\nKeep this summary.\n',
    );
  });
});