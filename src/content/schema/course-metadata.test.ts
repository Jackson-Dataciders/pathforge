import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMarkdownFile } from '../markdown-file';
import {
  courseFrontmatterSchema,
  publishedCourseSchema,
  readyCourseSchema,
} from './course-metadata';

describe('course metadata schemas', () => {
  it('parses the README template but does not consider it ready', () => {
    const template = readFileSync('courses/_templates/course-readme.md', 'utf8').replace(
      '{{date}}',
      '2026-10-20',
    );
    const parsed = parseMarkdownFile(template);

    expect(courseFrontmatterSchema.safeParse(parsed.data).success).toBe(true);
    expect(readyCourseSchema.safeParse({ ...parsed.data, body: parsed.body }).success).toBe(false);
  });

  it('validates the published sample course and preserves unknown metadata', () => {
    const parsed = parseMarkdownFile(
      readFileSync('fixtures/content/courses/sample-course/README.md', 'utf8'),
    );

    expect(publishedCourseSchema.safeParse(parsed.data).success).toBe(true);
    expect(courseFrontmatterSchema.parse({ ...parsed.data, custom_field: 'preserved' })).toMatchObject({
      custom_field: 'preserved',
    });
  });

  it('rejects a ready course with a missing topic or invalid language', () => {
    const parsed = parseMarkdownFile(
      readFileSync('fixtures/content/courses/sample-course/README.md', 'utf8'),
    );
    const readyDraft = {
      ...parsed.data,
      status: 'draft',
      topic: 'HTTP status codes',
      code_language: 'none',
      body: parsed.body,
    };

    expect(readyCourseSchema.safeParse({ ...readyDraft, topic: '' }).success).toBe(false);
    expect(
      readyCourseSchema.safeParse({ ...readyDraft, course_language: 'zz' }).success,
    ).toBe(false);
  });
});