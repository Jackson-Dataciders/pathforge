---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0003-lesson-storage-and-authoring-format.md
  - ../adr/0008-source-traceability-model.md
tags:
  - frontend
  - content
depends_on:
  - 005-content-loader.md
  - 006-component-kit-foundation.md
---
# Spec: 014-course-rendering

## Description
<!-- Written by me: what the feature should do, in plain words. -->
I can open a published course and read its lessons in the frontend. The course page shows the summary, category, labels, and the lesson list. A lesson page shows the lesson's objectives, the rendered content with all kit components, highlighted code, and a "Sources" list built from the lesson's citations, plus links to the previous and next lessons. Pages are generated at build time.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Add syntax highlighting to `compileLesson` (`src/kit/compile.ts`): `rehype-pretty-code` with Shiki, dual themes (`github-light`, `github-dark`) switched by the `.dark` class through CSS variables; unknown languages fall back to plain text.
2. `src/app/courses/[course]/page.tsx`: `generateStaticParams` from `listPublishedCourses()`; `generateMetadata` (title = course title); renders title, summary (Markdown), category title (from taxonomy), label chips, total `estimated_minutes`, and an ordered lesson list linking to lessons. Unknown slug → `notFound()`. Content wrapper has `lang={course_language}`.
3. `src/app/courses/[course]/[lesson]/page.tsx`: `generateStaticParams` over published courses and implemented lessons; renders breadcrumb (Courses / course / lesson), lesson title, objectives box, `estimated_minutes`, compiled content inside `KitResultProvider`, and previous/next navigation. Wrapper has `lang={course_language}`. Unknown lesson → `notFound()`.
4. `src/components/lesson/sources.tsx` styling: the GFM footnotes section (`section[data-footnotes]`) is styled as a "Sources" list; footnote backlinks remain.
5. `src/app/courses/[course]/[lesson]/lesson.module.css` or Tailwind typography setup (`@tailwindcss/typography` with token colors) for readable prose.
6. Extend `fixtures/content/courses/sample-course/001-introduction.md` with a callout, a mermaid diagram, a fenced `ts` code block, and a footnote citation.
7. Tests: unit test that `compileLesson` output contains a highlighted code block; `e2e/course.spec.ts` against `fixtures/content`: open `/courses/sample-course`, see lesson list, open lesson 1, see objectives, callout, diagram SVG, highlighted code, and a "Sources" section with the source link; Next link goes to lesson 2; `/courses/does-not-exist` returns the not-found page; draft and in-progress fixture courses return not found.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Only published courses and implemented lessons get pages.
- The UI chrome is English; lesson content is in `course_language`, marked with the `lang` attribute.
- The last lesson has no Next link; the first has no Previous link.
- Build fails with a `ContentError` or `KitBlockError` if any published lesson is invalid.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Course catalog and filters (spec 015).
- Progress display and "mark as complete" (spec 018).
- Search within courses.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `e2e/course.spec.ts` passes all listed checks against `fixtures/content`.
- [ ] Lesson pages are statically generated (listed as SSG routes in `next build` output).
- [ ] The lesson wrapper element has `lang` equal to the course's `course_language` (e2e).
- [ ] Code blocks are highlighted in both light and dark mode (e2e checks a token span with color style in both modes).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md) (build-time compile), [ADR-0008](../adr/0008-source-traceability-model.md) (footnotes as sources).
- New dependencies: `rehype-pretty-code`, `shiki`, `@tailwindcss/typography`.
- Uses loaders from spec 005 and `compileLesson` from spec 006.
