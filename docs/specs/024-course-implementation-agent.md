---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
  - ../adr/0005-component-kit-contract-and-extension-policy.md
  - ../adr/0008-source-traceability-model.md
  - ../adr/0003-lesson-storage-and-authoring-format.md
tags:
  - pipeline
  - agents
depends_on:
  - 007-kit-diagrams.md
  - 008-kit-animations.md
  - 009-kit-quizzes.md
  - 011-kit-python-runner.md
  - 012-kit-structure-visualizations.md
  - 013-kit-parameter-plot.md
  - 014-course-rendering.md
  - 023-course-research-agent.md
---
# Spec: 024-course-implementation-agent

## Description
<!-- Written by me: what the feature should do, in plain words. -->
The `course-implementer` subagent writes every lesson from its researched plan. It uses only kit components, states only facts from verified claims and cites them, and builds quizzes and code challenges whose reference solutions pass their tests. It may add a new kit component only when the course plan explicitly requested one. A gate compiles every lesson, checks citations, and runs every code challenge's reference solution before the course moves on.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/citations.ts`: `checkCitations(lesson)` implementing the structural rules of ADR-0008 (every `[^cN]` reference has a matching claim; cited claims are `verified` or `corrected` with 1+ sources; every footnote definition's URLs belong to the claim's sources; no `draft` or `rejected` claim is cited; every footnote reference has a definition). Returns issues with line numbers. Unit tests.
2. `src/content/schema/lesson.ts`: add `implementedLessonSchema` (tag `implemented`, otherwise as `plannedLessonSchema`).
3. `pipeline/src/challenges.ts` and CLI command `check-challenges <slug>`: parse every `kit:code-challenge` block of the course (via `remark` + `parseKitBlock`), and with `getNodeRunner(language)` verify that `solution` returns `passed` and `starter` does not; also verify `language` equals the course `code_language`. Prints a table and exits 1 on any failure. Tests with a fixture lesson containing a passing and a broken challenge.
4. `.github/agents/course-implementer.agent.md`: frontmatter `name: course-implementer`, `description`, `model` = VS Code identifier for GPT-5.6 Luna, `user-invocable: false`, `tools`: read, edit, terminal (no fetch). Body sections Role (subagent of `course-builder`, not part of the development workflow), Inputs (slug and context list passed by the builder), Output contract, Rules, Procedure, Self-check, Final message (summary of lessons written and challenge check result). Rules:
   - Write in `course_language`; keep frontmatter except changing the tag `planned` → `implemented`; never modify `claims`, `sources`, `objectives`, or `components`.
   - Structure: `# <title>`, short introduction, one `##` section per outline item, `## Key takeaways`, then footnote definitions.
   - State facts only from `verified` claims (or the corrected text of `corrected` claims) and cite each with `[^cN]`; define each footnote as `[^cN]: [<source title>](<url>)` (multiple sources separated by `; `). General explanations and examples that contain no factual claim need no citation.
   - Use only components from `src/kit/manifest.json` with props matching their JSON Schemas; every interactive block has a unique `id`; use ` ```mermaid ` for diagrams; include every component listed in the lesson's `components`; at least one assessment per lesson.
   - Code challenges: `language` equals `code_language`; no imports; deterministic (no time, randomness, or network); at least 3 tests including an edge case; the starter runs but fails at least one test; the solution passes all tests. Run `npm run check-challenges -- <slug>` and fix failures before finishing.
   - New kit components: only those in README `pipeline.new_components`, created under `src/kit/components/<name>/` following the component contract (schema, component, `example.yaml`, test), registered in `src/kit/registry.ts`, followed by `npm run kit:manifest` and `npm test -- src/kit/components/<name>`.
   - Run no terminal commands other than `npm run check-challenges -- <slug>`, `npm run kit:manifest`, and `npm test -- src/kit/components/<name>`; change no other files; never commit (the builder commits).
5. Extend `context` (spec 022) with `--agent implementer` (lesson files, README, manifest path, schema paths, `code_language`, declared `new_components`, allowed commands). Add npm script `check-challenges` (`npm run pipeline -- check-challenges`).
6. `pipeline/src/gates/implement.ts` (gate `implement`): every lesson matches `implementedLessonSchema`; `claims`, `sources`, `objectives`, and `components` unchanged compared with `HEAD`; every lesson compiles with `compileLesson` (kit blocks valid, ids unique); every lesson has an assessment block and uses every planned component; `checkCitations` has no issues; `check-challenges` passes; changed files are limited to `courses/<slug>/**`, plus for declared components `src/kit/components/<name>/**`, `src/kit/registry.ts`, and `src/kit/manifest.json`; every declared component exists in the registry and `kit:manifest --check` passes.
7. Fixture `pipeline/fixtures/http-status-codes/implementer/courses/__COURSE__/`: the three lessons tagged `implemented`, using a mermaid sequence diagram (lesson 001), a quiz in every lesson, a callout (lesson 002), and a JavaScript `code-challenge` `classifyStatus(code)` returning `informational`, `success`, `redirection`, `client-error`, or `server-error` (lesson 003), with correct citations. Add `pipeline/fixtures/http-status-codes-broken/implementer/` identical except that the challenge solution fails a test.
8. Tests: gate `implement` passes on the fixture chain (`start` → `replay` planner, roadmap, researcher, implementer); fails for the broken fixture, an uncited claim reference to a rejected claim, an unknown component, a changed `claims` list, and a file changed under `src/` without a declared component.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Input: lessons tagged `planned` that passed gate `research`.
- Output: lessons tagged `implemented`; optionally new kit components that were declared by the planner.
- The agent is instructed to run only the three listed commands and has no fetch tool; gate `implement` rejects any changes outside the allowed paths, whatever the agent did.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- The claim audit and full validation including the production build (specs 023 and 026).
- Images or media files in lessons.
- Editing already published courses.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `checkCitations` unit tests pass.
- [ ] `npm run pipeline -- check-challenges <slug>` passes for the fixture course and fails for the broken fixture (tests).
- [ ] `.github/agents/course-implementer.agent.md` exists with the listed frontmatter and sections and is hidden from the agent picker.
- [ ] Gate `implement` passes on the fixture chain and fails for each listed mutation (tests).
- [ ] Every implementer fixture lesson compiles with `compileLesson` without errors (test).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0016](../adr/0016-course-agents-in-vs-code.md), [ADR-0017](../adr/0017-local-course-build-flow.md), [ADR-0005](../adr/0005-component-kit-contract-and-extension-policy.md) (extension policy and path guard), [ADR-0008](../adr/0008-source-traceability-model.md) (citations), [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md) (authoring format).
- Reuses `compileLesson` (spec 006), runners (specs 010 and 011), schemas (spec 003).
- Handoff contract to the auditor and validation: lessons validated by gate `implement`.
