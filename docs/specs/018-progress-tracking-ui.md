---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0011-progress-storage-on-progress-branch.md
tags:
  - progress
  - frontend
depends_on:
  - 009-kit-quizzes.md
  - 010-kit-code-challenge-and-javascript-runner.md
  - 015-course-catalog.md
  - 017-progress-sync-on-progress-branch.md
---
# Spec: 018-progress-tracking-ui

## Description
<!-- Written by me: what the feature should do, in plain words. -->
The platform shows and records my progress whether or not I am signed in: signed out it is kept in this browser, signed in it syncs to the repository. I can mark a lesson as complete; a lesson also completes automatically once all its quizzes and code challenges are passed. Quizzes and challenges I have passed show a "Passed" badge. The course page shows which lessons are done and a progress bar, and course cards in the catalog show my completion percentage.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Add `ProgressProvider` (spec 017) to `src/app/layout.tsx` inside the session provider.
2. `src/progress/compute.ts`: pure `lessonKey(course, stem)`, `isLessonComplete(progress, key)`, `courseCompletion(progress, course, lessonStems)` → `{ completed, total, percent }`, and `allAssessmentsPassed(progress, key, blockIds)`. Unit tests.
3. Build-time list of assessment block ids per lesson: extend `remark-kit` (spec 006) to collect interactive block ids and kinds into `file.data.kitBlocks`; `compileLesson` returns `{ content, blocks }`. Lesson page passes `blocks` (assessment kinds only) to the client.
4. `src/components/progress/lesson-progress-bridge.tsx` (client): provides a `KitResultProvider` whose `report()` records `block-result` changes for the current lesson; when every assessment block of the lesson has passed and the lesson is not complete, records `lesson-complete`.
5. `src/components/progress/mark-complete-button.tsx` (client): toggles `lesson-complete` / `lesson-incomplete`; shown at the end of the lesson page in both modes. In local mode a small hint "Saved in this browser — sign in to sync across devices" is shown next to it.
6. Badges: quiz and code-challenge components read `useBlockProgress` through an optional context and show "Passed" when the stored result is passed. Keep components working without the context (kit showcase).
7. Course page: client component `course-progress.tsx` showing a progress bar ("n of m lessons") and a check mark per completed lesson in the lesson list.
8. Catalog cards: client component `card-progress.tsx` showing "n% complete" when greater than 0 (both modes).
9. Tests: component tests with a mocked progress provider (button toggles, auto-complete after all assessments pass, badges); `e2e/progress.spec.ts` using Playwright `page.route` to mock `/api/auth/session` (signed-in session JSON) and `/api/progress` (in-memory GET/PUT): answer the fixture quiz → lesson shows completed after reload; course page shows "1 of 2 lessons"; catalog card shows "50% complete". A second test without a session: answering the quiz marks the lesson complete, persists across reload via `localStorage`, shows the local-mode hint, and sends no request to `/api/progress`.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Signed out: the full progress UI works in local mode (stored in this browser only) with the sync hint.
- Lessons without assessments complete only via the button.
- Un-marking a lesson does not erase block results.
- A sync failure shows a small non-blocking "Progress not synced yet" indicator in the header while changes are queued.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Statistics, streaks, or history views.
- Roadmap node progress (could be added later).
- Resetting progress.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `compute.ts` unit tests pass.
- [ ] `compileLesson` returns the lesson's assessment block ids (test).
- [ ] Component tests for mark-complete, auto-complete, and badges pass.
- [ ] `e2e/progress.spec.ts` passes with mocked session and progress API, and in local mode without a session.
- [ ] Course and lesson routes remain statically generated (`next build` route list).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0011](../adr/0011-progress-storage-on-progress-branch.md) (data model and keys).
- Touches `src/kit/remark-kit.ts`, `src/kit/compile.ts`, lesson and course pages from spec 014, catalog card from spec 015, quiz and code-challenge components.
- No new dependencies.
