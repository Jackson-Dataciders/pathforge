---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0012-roadmap-data-format-and-rendering.md
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
tags:
  - pipeline
  - agents
  - roadmap
depends_on:
  - 019-roadmap-data-format.md
  - 022-course-planner-agent.md
---
# Spec: 025-roadmap-agent

## Description
<!-- Written by me: what the feature should do, in plain words. -->
When a course's main topic has no roadmap yet, the `course-roadmap` subagent generates one: a complete roadmap.sh-style tree of everything that belongs to that main topic, with premade subtopics, each carrying an example course description, and with the new course linked to its node. For example, a course on "API Endpoints" creates the "Backend" roadmap. When the roadmap already exists, the agent links the new course to the best matching node, adding a node if none fits, without removing anything.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `.github/agents/course-roadmap.agent.md`: frontmatter `name: course-roadmap`, `description`, `model` = VS Code identifier for GPT-5.6 Luna, `user-invocable: false`, `tools`: read, edit (no terminal, no fetch). Body sections Role (subagent of `course-builder`, not part of the development workflow), Inputs (slug and context list passed by the builder), Output contract, Rules, Procedure, Self-check, Final message (mode used and the linked node id). Rules:
   - Create mode (category `roadmap` is null): write `catalog/roadmaps/<category-id>.yaml` matching `pipeline/schemas/roadmap.json`; root node = the category; 15–40 nodes in 2–3 levels ordered from fundamentals to advanced, covering what a learner needs to master the main topic; every node has a one-sentence `summary`; every node without a course has an `example` with title, topic, a 3–6 sentence course description written like a user's course request, and suggested labels from the taxonomy; link the current course with `course: <slug>` on the best-matching node (adding a node if necessary); set the category's `roadmap` to the category id in `catalog/taxonomy.yaml`.
   - Update mode (roadmap exists): link the course to the best-matching node with `course: null`, or add one new node under the best parent; never remove nodes, change ids, or change other nodes' `course` values.
   - All roadmap text in English; ids lowercase kebab-case; edit only the roadmap file and the taxonomy.
2. Extend `context` (spec 022) with `--agent roadmap`: slug, course title, topic, summary, category id, taxonomy path, roadmap path (existing or to create), mode (`create` or `update`), roadmap schema path, and existing courses in the category. Tests.
3. `pipeline/src/gates/roadmap.ts` (gate `roadmap`): roadmap file exists and matches `roadmapSchema`; taxonomy category `roadmap` equals the file id; exactly one node has `course: <slug>`; in update mode, all node ids and `course` values from `HEAD` are preserved (only the target node's `course` and at most one added node differ); `validateRoadmapReferences` passes (the course folder exists); changed files limited to `catalog/roadmaps/<id>.yaml` and `catalog/taxonomy.yaml`; node count within 15–40 in create mode.
4. Fixture `pipeline/fixtures/http-status-codes/roadmap/`: `catalog/roadmaps/e2e-sample.yaml` (root "E2E sample", 15 nodes about HTTP and web APIs, node `http-status-codes` with `course: __COURSE__` replaced by the slug at copy time) and `catalog/taxonomy.merge.yaml` setting `roadmap: e2e-sample`. (`replay` from spec 021 replaces `__COURSE__` in contents and merges `.merge.yaml` by `id`.)
5. Tests: gate passes on the fixture chain (`start` → `replay planner` → `replay roadmap`); fails when two nodes link the course, when an existing node is removed in update mode, when the taxonomy is not updated, and when a file outside the allowed paths changes.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Runs as the builder's first subagent, after gate `plan` and before research (stage order in ADR-0017).
- Input contract: planned README with `category`; taxonomy with that category.
- Output contract: one roadmap file linking the course, taxonomy pointing to it.
- The linked course stays hidden on the roadmap until it is published (spec 020).

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Regenerating or restructuring existing roadmaps.
- Generating courses for roadmap nodes.
- Source verification of roadmap text (roadmaps contain no lesson claims).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `.github/agents/course-roadmap.agent.md` exists with the listed frontmatter and sections and is hidden from the agent picker.
- [ ] Gate `roadmap` passes on the fixture chain and fails for each listed mutation (tests).
- [ ] The fixture roadmap passes `npm run validate:content` once the fixture course is published (covered in spec 028).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0012](../adr/0012-roadmap-data-format-and-rendering.md), [ADR-0016](../adr/0016-course-agents-in-vs-code.md), [ADR-0017](../adr/0017-local-course-build-flow.md).
- Gate `roadmap` enforces which files may change.
- Reuses `roadmapSchema`, `validateRoadmapReferences` (spec 019) and taxonomy loader (spec 004).
