---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0012-roadmap-data-format-and-rendering.md
tags:
  - roadmap
  - frontend
depends_on:
  - 002-theme-system.md
  - 012-kit-structure-visualizations.md
  - 014-course-rendering.md
  - 019-roadmap-data-format.md
---
# Spec: 020-roadmap-rendering-and-example-modal

## Description
<!-- Written by me: what the feature should do, in plain words. -->
I can browse roadmaps in the frontend. Each roadmap is shown as an interactive mind map. Clicking a node that has a published course opens that course. Clicking a node without a course opens a modal with an example course description that I can copy, either alone or as a complete README ready to paste into a new course in Obsidian.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/course-template.ts`: `renderCourseReadme({ topic, description, labels, course_language = 'en', code_language = '' })` producing the README text of `courses/_templates/course-readme.md` (spec 003) with `topic`, `labels`, and the description filled in, `status: draft`, and `created` set to today. Unit tests: the result parses with `courseFrontmatterSchema`, fails `readyCourseSchema` while `code_language` is empty, and passes it once `code_language` is set.
2. `src/app/roadmaps/page.tsx`: replace the placeholder with a list of roadmaps (title, description, node count, number of nodes with published courses) linking to `/roadmaps/<id>`. Empty state remains.
3. `src/app/roadmaps/[id]/page.tsx`: `generateStaticParams` from `listRoadmaps()`; passes a serializable view model `{ nodes: { id, title, kind, summary, parent, href | null, example | null }[], related }` where `href = /courses/<slug>` only if the course is published.
4. `src/components/roadmap/roadmap-graph.tsx` (client, dynamic import): `@xyflow/react` read-only graph with layout from `src/kit/shared/elk-layout.ts` (`mrtree`, root at top), custom node component showing title and a "Course" badge when `href` is set; topic nodes larger than subtopic nodes; `related` edges dashed; colors from `useThemeTokens()`; `fitView` on load; zoom and pan enabled.
5. Node click: `href` → `router.push(href)`; otherwise open `ExampleModal`. Nodes are focusable and activate with Enter.
6. `src/components/roadmap/example-modal.tsx`: native `<dialog>` with title, summary, the example description, suggested labels, and buttons "Copy description" and "Copy README" (uses `renderCourseReadme`), each showing "Copied" feedback; Escape and a close button close it; focus returns to the node.
7. Accessible outline below the graph: `src/components/roadmap/roadmap-outline.tsx` renders the same tree as nested lists with the same link/modal behavior (also the fallback while the graph loads).
8. Home page: categories with a roadmap link to `/roadmaps/<id>` in addition to the course filter link.
9. `e2e/roadmap.spec.ts` against fixtures: `/roadmaps` lists Backend; on `/roadmaps/backend` the node linked to `sample-course` navigates to the course; another node opens the modal; "Copy README" writes text containing `topic:` and the example description to the clipboard (grant clipboard permissions in Playwright).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Nodes whose course is not published behave like nodes without a course.
- The copied README has `status: draft` and an empty `code_language`, so it is not ready until the user chooses a code language (or `none`); after that it can be started with the `course-planner` agent.
- Clipboard failures show "Copy failed — select the text manually" and keep the text selectable.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Editing roadmaps in the UI.
- Showing progress on roadmap nodes.
- Creating the course folder from the browser.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `renderCourseReadme` unit test passes.
- [ ] `e2e/roadmap.spec.ts` passes all listed checks.
- [ ] The outline list contains every roadmap node (component test).
- [ ] The modal is closable with Escape and returns focus to the clicked node (component or e2e test).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0012](../adr/0012-roadmap-data-format-and-rendering.md).
- Reuses `@xyflow/react`, `elkjs`, and `src/kit/shared/elk-layout.ts` from spec 012; no new dependencies.
