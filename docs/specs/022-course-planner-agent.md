---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
  - ../adr/0004-course-and-lesson-lifecycle-states.md
  - ../adr/0005-component-kit-contract-and-extension-policy.md
  - ../adr/0007-code-challenge-verification.md
tags:
  - pipeline
  - agents
depends_on:
  - 010-kit-code-challenge-and-javascript-runner.md
  - 021-pipeline-foundation.md
---
# Spec: 022-course-planner-agent

## Description
<!-- Written by me: what the feature should do, in plain words. -->
I start a course by selecting the `course-planner` agent in VS Code Copilot Chat and attaching the course README I wrote in Obsidian. The planner starts the course (branch and folder), classifies it (category and labels), writes the title, summary, and lesson plan into the README, and creates one stub file per lesson with objectives, an outline, the kit components it will need, and the factual claims it will rely on. A gate checks the result; when it passes, the planner commits and offers one "Build course" handoff that starts the builder.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/schema/course-metadata.ts`: add `plannedCourseSchema` (status `planning`, non-empty `title`, `category`, 1–5 `labels`, `pipeline.new_components` items `{ name (kebab-case), reason, props_sketch, lessons: string[] }`). `src/content/schema/lesson.ts`: add `createdLessonSchema` (tag `created`, 2–5 objectives, 3–8 outline items, 1+ components, 3–15 claims all `draft` with empty `sources`, `sources: []`, `estimated_minutes` 10–30).
2. CLI `context <slug> --agent <name>` (`pipeline/src/context.ts`): prints the inputs an agent needs as a Markdown list. For `planner`: course folder and README path, `catalog/taxonomy.yaml`, `src/kit/manifest.json`, `pipeline/schemas/course-readme.json`, `pipeline/schemas/lesson-frontmatter.json`, supported code languages from `src/runners/registry.ts`, existing published courses (slug, title, category), today's date. Later specs add sections for other agents. Tests.
3. `.github/agents/course-planner.agent.md`:
   - Frontmatter: `name: course-planner`; `description` ("Plans a Pathforge course from an attached course README; start here to create a course"); `model`: the VS Code identifier for GPT-5.6 Luna; `tools`: read, edit, terminal (run in terminal); `handoffs`: one entry `label: Build course`, `agent: course-builder`, `prompt: "Build the course named in the line 'Course:' above."`, `send: true`.
   - Body sections: Role (course planner for Pathforge, not part of the development workflow, ignores `docs/specs/`); Inputs (the attached README); Procedure (run `npm run pipeline -- start <README path>` and use the printed slug; run `npm run pipeline -- context <slug> --agent planner`; write the plan; run `npm run pipeline -- gate plan <slug>` and fix the issues it lists, at most 3 attempts; on success run `npm run pipeline -- commit <slug> plan`; on persistent failure run `npm run pipeline -- fail <slug> --stage plan --reason "<summary>"` and stop); Output contract (README fields and sections and lesson stub frontmatter as defined by the schemas; lesson bodies contain only `# <title>`); Rules (write titles, objectives, outline, claims, summary, and lesson plan in `course_language`; file names and ids in English kebab-case; 3–12 lessons ordered from fundamentals to applied topics; each lesson has at least one assessment component (`quiz`, or `code-challenge` when `code_language` is not `none`); only component names from `src/kit/manifest.json`; claims are atomic, checkable facts; choose an existing taxonomy category if it is the course's main topic, otherwise add a new one with `roadmap: null`; 1–5 labels, preferring existing ones, at most 3 new; request a new kit component in `pipeline.new_components` only when no existing component fits, with a reason; never change `## Description` or files outside the course folder and `catalog/taxonomy.yaml`; never write lesson content; never ask the user questions); Final message (short summary, then exactly `Course: courses/<slug>/README.md` as the last line).
4. `pipeline/src/gates/plan.ts` (gate `plan`), issues for:
   - README not matching `plannedCourseSchema`; category or labels missing from the (possibly updated) taxonomy; taxonomy invalid.
   - Description SHA-256 differs from `pipeline.description_sha256`.
   - Empty `## Summary` or `## Lesson plan`; Lesson plan not an ordered list of relative links covering every lesson file in order.
   - `code_language` not supported and not `none`.
   - Lesson files not named `NNN-kebab.md` sequentially from `001`; `lesson` number mismatch; frontmatter failing `createdLessonSchema`; components not in the manifest or `new_components`; no assessment component; `code-challenge` with `code_language: none`.
   - `new_components` names colliding with existing components.
   - Changed or added files (from `git status --porcelain`) outside `courses/<slug>/` and `catalog/taxonomy.yaml`.
5. Sample request and fixture: `pipeline/fixtures/http-status-codes/request/README.md` (topic "HTTP status codes", `course_language: en`, `code_language: javascript`, status `draft`, a 4-sentence description, so it passes `readyCourseSchema`) and `pipeline/fixtures/http-status-codes/planner/` with `courses/__COURSE__/README.md` (planned README, category `e2e-sample`, label `http`), three lesson stubs (`001-what-status-codes-are.md`, `002-success-and-redirection.md`, `003-client-and-server-errors.md`; lesson 003 plans a `code-challenge`), and `catalog/taxonomy.merge.yaml` adding category `e2e-sample` ("E2E sample", `roadmap: null`).
6. Tests `pipeline/src/gates/plan.test.ts`: in a temporary repository, `start` + `replay planner` with fixture `http-status-codes` passes the gate; each listed issue is detected using mutated copies (changed description, gap in numbering, unknown component, unsupported language, file changed outside the allowed paths).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Input: a README attached in VS Code that is a ready `draft` (or `failed`, for a retry).
- Output: branch `course/<slug>` with README fields `title`, `category`, `labels`, `## Summary`, `## Lesson plan`, optional `pipeline.new_components`; lesson stubs tagged `created`; optional taxonomy additions; one commit per step.
- Lesson plan format: `1. [<title>](./001-<slug>.md) — <one-line goal>`.
- If `start` refuses (README not ready, dirty tree, course in progress), the planner reports the printed reason and stops without a handoff.
- The "Build course" handoff is the only user action after attaching the README.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- The builder and the other agents (specs 023–025, 027).
- Splitting very large topics into multiple courses.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `.github/agents/course-planner.agent.md` exists with the listed frontmatter and body sections.
- [ ] `context <slug> --agent planner` test passes.
- [ ] In a temporary repository, `start` + `replay planner --fixture http-status-codes` + `gate plan` exits 0 (test).
- [ ] Each mutation listed in the plan makes the gate exit 1 with a message naming the file (tests).
- [ ] Manual: in VS Code, selecting `course-planner` with a ready README attached produces a planned course on `course/<slug>`, the gate passes, the final line is `Course: courses/<slug>/README.md`, and the "Build course" button appears (it works once spec 027 exists).
- [ ] Manual: the planned lessons appear in the `created` column of the course's `board.base` in Obsidian.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0016](../adr/0016-course-agents-in-vs-code.md) (agent file, model, tools, handoff), [ADR-0017](../adr/0017-local-course-build-flow.md) (start, gate, commit), [ADR-0004](../adr/0004-course-and-lesson-lifecycle-states.md) (`created` tag), [ADR-0005](../adr/0005-component-kit-contract-and-extension-policy.md) (manifest, `new_components`), [ADR-0007](../adr/0007-code-challenge-verification.md) (supported languages).
- Handoff contract to the builder: the committed planned README and `created` lesson stubs validated by gate `plan`, identified by the final `Course:` line.
