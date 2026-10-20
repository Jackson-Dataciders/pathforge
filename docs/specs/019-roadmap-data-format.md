---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0012-roadmap-data-format-and-rendering.md
tags:
  - roadmap
  - content
depends_on:
  - 004-taxonomy.md
  - 005-content-loader.md
---
# Spec: 019-roadmap-data-format

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Each main topic (category) can have a roadmap: a mind-map-style tree of subtopics, like roadmap.sh. A node either links to an existing course or carries an example course description that I can paste into a new course template. Roadmaps are YAML files in the repository with a validated schema, loaded by the frontend and written by the roadmap agent.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/schema/roadmap.ts`: zod `roadmapSchema` exactly as in ADR-0012 (`id`, `title`, `description`, `nodes[]` with `id`, `title`, `parent`, `order`, `kind: topic | subtopic`, `summary`, `course: string | null`, `example?: { title, topic, description, suggested_labels: string[] }`; optional `related[]` with `from`, `to`). Refinements: unique node ids; exactly one node with `parent: null`; every `parent` exists; no cycles; `example` required when `course` is null; `related` endpoints exist; at most 80 nodes.
2. `src/content/roadmaps.ts`: `listRoadmaps(root?)`, `getRoadmap(id, root?)`, and `validateRoadmapReferences(roadmap, { taxonomy, courseFolders, publishedCourses })` returning issues when the roadmap id has no taxonomy category whose `roadmap` equals it, when a `course` slug has no course folder, or when a node's `suggested_labels` are not in the taxonomy. `toTree(roadmap)` returns nested children sorted by `order`.
3. `src/content/roadmap-writer.ts` (used by the pipeline gate and tests): `writeRoadmap(roadmap, file)` with stable YAML; `linkCourse(roadmap, nodeId, slug)`; `addNode(roadmap, node)`.
4. Extend `scripts/validate-content.ts` (spec 005) to validate all roadmaps and their references, and `validateTaxonomyReferences` (spec 004) to check roadmap files exist.
5. Fixtures: `fixtures/content/catalog/roadmaps/backend.yaml` (root "Backend", 8 nodes, one linking `sample-course`, others with examples); set `roadmap: backend` in the fixture taxonomy.
6. Tests: schema cases (two roots, unknown parent, cycle, missing example, unknown related endpoint), reference validation, `toTree` ordering, writer stability.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Roadmap file name equals its `id` and the taxonomy category id.
- A node linked to a course that is not yet published is valid; the frontend treats it as a node without a course until the course is published (spec 020).
- Roadmap text (titles, summaries, examples) is English.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Rendering (spec 020).
- Generating roadmaps (spec 025).
- Obsidian Canvas export.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Roadmap schema and reference tests cover all listed cases and pass.
- [ ] `PATHFORGE_CONTENT_ROOT=fixtures/content npm run validate:content` validates the fixture roadmap and exits 0.
- [ ] Removing the fixture roadmap file while the taxonomy references it makes `validate:content` exit non-zero (test).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0012](../adr/0012-roadmap-data-format-and-rendering.md).
- Uses `roadmapsDir()` from `src/content/paths.ts`, `yaml`, and the taxonomy loader. No new dependencies.
