---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0003-lesson-storage-and-authoring-format.md
  - ../adr/0004-course-and-lesson-lifecycle-states.md
tags:
  - content
depends_on:
  - 003-course-vault-template-and-metadata-schema.md
  - 004-taxonomy.md
---
# Spec: 005-content-loader

## Description
<!-- Written by me: what the feature should do, in plain words. -->
The frontend reads courses and lessons directly from the `courses/` folder at build time. Only published courses and their implemented lessons are shown. Invalid published content stops the build with a clear error, while unfinished courses that are still being edited or processed are skipped. A command validates all content so CI catches problems early.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/errors.ts`: `ContentError` with `file`, `messages: string[]`, and a formatted `message`.
2. `src/content/courses.ts`:
   - `discoverCourseFolders(root?)`: direct subfolders of `coursesDir()` whose name does not start with `_` or `.` and that contain `README.md`.
   - `loadCourse(slug, root?)` → `Course { slug, frontmatter, description, summary, lessonPlan, notes, lessons: LessonMeta[] }` using `parseMarkdownFile` and `getSection`.
   - `LessonMeta { stem, file, number, frontmatter, stage }` from files matching `isLessonFileName`, sorted by number.
   - `listPublishedCourses(root?)`: courses with `status: published`, validated with `publishedCourseSchema`; `category` must exist in the taxonomy and every label must exist; throws `ContentError` on any invalid published course.
   - `getPublishedCourse(slug)` and `getPublishedLesson(slug, stem)` returning only lessons tagged `implemented`, plus `readLessonBody(slug, stem)`.
   - Non-published courses are skipped; invalid non-published courses are skipped with a `console.warn`.
3. Memoize results per root within one process.
4. `scripts/validate-content.ts` and npm script `validate:content`: loads the taxonomy and all published courses, prints every error with file path, exits non-zero on errors. Add it to `ci.yml` before `build`.
5. Extend `fixtures/content/courses/` with `draft-course/` (status `draft`, missing topic) and `in-progress-course/` (status `researching`) to test skipping.
6. Tests in `src/content/courses.test.ts`: discovery ignores `_templates` and `.obsidian`; published filter; lesson ordering; implemented-only lessons; unknown category or label throws `ContentError` naming the README; invalid draft is skipped.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Course slug = folder name; folders that are not valid slugs are skipped with a warning unless published, in which case they are an error.
- A published course with no implemented lessons is an error.
- Lesson stem = file name without `.md` (for example `001-introduction`) and is used in URLs.
- Errors list every problem in the file, not only the first.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Rendering lesson bodies (specs 006 and 014).
- Kit block validation (spec 006) and citation validation (spec 026).
- Roadmap loading (spec 019).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `src/content/courses.test.ts` covers all listed cases and passes against `fixtures/content`.
- [ ] `PATHFORGE_CONTENT_ROOT=fixtures/content npm run validate:content` exits 0.
- [ ] Making the fixture's published course reference an unknown label makes `validate:content` exit non-zero and print the README path (test).
- [ ] `ci.yml` runs `npm run validate:content`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md) (lessons read from the vault), [ADR-0004](../adr/0004-course-and-lesson-lifecycle-states.md) (published and implemented filters).
- Uses `src/content/paths.ts`, `src/content/markdown-file.ts`, `src/content/schema/*`, `src/content/taxonomy.ts`.
- Spec 026 adds a preview override so validation can build a course that is not yet published.
