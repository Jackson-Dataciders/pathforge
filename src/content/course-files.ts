export function isLessonFileName(name: string): boolean {
  return /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name);
}

export function isCourseSlug(name: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}