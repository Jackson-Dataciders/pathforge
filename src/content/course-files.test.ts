import { describe, expect, it } from 'vitest';
import { isCourseSlug, isLessonFileName, slugify } from './course-files';

describe('course file names', () => {
  it('accepts lesson filenames with a three-digit number and kebab slug', () => {
    expect(isLessonFileName('001-introduction.md')).toBe(true);
    expect(isLessonFileName('123-http-status-codes.md')).toBe(true);
    expect(isLessonFileName('01-introduction.md')).toBe(false);
    expect(isLessonFileName('001-Introduction.md')).toBe(false);
    expect(isLessonFileName('001-introduction.MD')).toBe(false);
  });

  it('accepts lowercase course slugs', () => {
    expect(isCourseSlug('http-status-codes')).toBe(true);
    expect(isCourseSlug('course2')).toBe(true);
    expect(isCourseSlug('-course')).toBe(false);
    expect(isCourseSlug('Course')).toBe(false);
    expect(isCourseSlug('course--name')).toBe(false);
  });

  it('normalizes names to ASCII lowercase kebab-case', () => {
    expect(slugify('Crème Brûlée: HTTP 101')).toBe('creme-brulee-http-101');
    expect(slugify('  A___B  ')).toBe('a-b');
  });
});