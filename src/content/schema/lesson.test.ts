import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMarkdownFile } from '../markdown-file';
import { lessonFrontmatterSchema, lifecycleTag } from './lesson';

describe('lesson schemas', () => {
  it('validates both sample lessons and finds their lifecycle tags', () => {
    for (const filename of ['001-introduction.md', '002-next-steps.md']) {
      const parsed = parseMarkdownFile(
        readFileSync(`fixtures/content/courses/sample-course/${filename}`, 'utf8'),
      );

      expect(lessonFrontmatterSchema.safeParse(parsed.data).success).toBe(true);
      expect(lifecycleTag(parsed.data as { tags: string[] })).toBe('implemented');
    }
  });

  it('rejects multiple lifecycle tags and non-HTTP source URLs', () => {
    const parsed = parseMarkdownFile(
      readFileSync('fixtures/content/courses/sample-course/001-introduction.md', 'utf8'),
    );
    const validLesson = parsed.data;
    const source = (validLesson.sources as Array<Record<string, unknown>>)[0];

    expect(
      lessonFrontmatterSchema.safeParse({ ...validLesson, tags: ['planned', 'implemented'] }).success,
    ).toBe(false);
    expect(
      lessonFrontmatterSchema.safeParse({
        ...validLesson,
        sources: [{ ...source, url: 'ftp://example.com/source' }],
      }).success,
    ).toBe(false);
  });
});