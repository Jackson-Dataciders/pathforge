---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0017-local-course-build-flow.md
  - ../adr/0016-course-agents-in-vs-code.md
tags:
  - pipeline
  - testing
depends_on:
  - 018-progress-tracking-ui.md
  - 020-roadmap-rendering-and-example-modal.md
  - 027-course-builder-agent.md
---
# Spec: 028-end-to-end-sample-course

## Description
<!-- Written by me: what the feature should do, in plain words. -->
An end-to-end test proves the whole flow works: a sample course request ("HTTP status codes") goes through every pipeline step with recorded agent outputs, and the resulting site shows the course in the catalog, renders its lessons, verifies a quiz and a code challenge, and shows the course on its roadmap. It runs in CI on every relevant pull request without any AI. A documented manual run with the real VS Code agents covers the agents themselves.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `pipeline/src/e2e.ts` and CLI `e2e-replay --fixture <name>`: in the current repository, on a fresh branch `e2e/<timestamp>` created from the current commit, copies `pipeline/fixtures/<fixture>/request/README.md` to `courses/http-status-codes/README.md`, commits, then runs the same steps as the builder with recorded outputs: `start`; `replay planner` → gate `plan` → commit; `replay roadmap` → gate `roadmap` → commit; `set-status researching`; `replay researcher` → gate `research` → commit; `set-status implementing`; `replay implementer` → gate `implement` → commit; `set-status validating`; `replay auditor` (writes the audit report) → `validate` → `publish` with pushing disabled (`--no-push`, added to `publish` here). Exits non-zero at the first failing step and prints which step failed. Supports `--keep` to leave the branch for inspection.
2. `pipeline/src/e2e-assertions.ts` and CLI `e2e-assert <slug>`: README `status: published`; all lessons tagged `implemented`; roadmap links the course; `.pipeline-artifacts/<slug>/validation-report.json` has no issues. Tests.
3. `e2e/pipeline/sample-course.spec.ts` (Playwright, `PATHFORGE_CONTENT_ROOT` = repository root on the e2e branch): `/courses` lists "HTTP status codes"; the course page lists three lessons; lesson 001 shows a diagram SVG and a "Sources" section with at least one external link; answering lesson 001's quiz correctly shows "Passed"; lesson 003's code challenge passes with the reference solution read from the lesson file (the test parses the YAML block) and fails with the starter; `/roadmaps/e2e-sample` shows the course node, which navigates to the course; a node without a course opens the example modal.
4. `.github/workflows/pipeline-e2e.yml`: triggers on `pull_request` touching `pipeline/**`, `src/kit/**`, `src/content/**`, `src/runners/**`, or `.github/agents/course-*.agent.md`, and on `workflow_dispatch`. One job: checkout, Node 22, `npm ci`, git identity, `npm run pipeline -- e2e-replay --fixture http-status-codes --keep`, `npm run pipeline -- e2e-assert http-status-codes`, `npm run validate:content`, install Playwright, `npx playwright test e2e/pipeline` against `npm run build && npm run start`. Nothing is pushed.
5. A negative test: `e2e-replay --fixture http-status-codes-broken` must exit non-zero at the `implement` gate (test in `pipeline/src/e2e.test.ts`).
6. README "Testing the course pipeline" section: what the CI replay covers, and the manual live run (the steps in spec 027's manual acceptance criterion, on a scratch branch `e2e/live`).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- The CI test runs the real CLI, gates, validation, build, and browser tests; only the agents' outputs are replaced by recordings. It uses no Copilot credits.
- The live run uses the real VS Code agents and the user's Copilot credits; it is manual only.
- Neither test touches `main`; Vercel does not deploy `e2e/*` or `course/*` branches.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Automating the VS Code agents in CI.
- Testing GitHub OAuth against real GitHub (covered by mocked tests in specs 016–018).
- Comparing live agent output against the fixtures.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `e2e-replay` with `http-status-codes` succeeds and with `http-status-codes-broken` fails at gate `implement` (tests).
- [ ] `e2e-assert` tests pass on the replayed course.
- [ ] A pull request touching `pipeline/**` runs `pipeline-e2e.yml` and it succeeds, including the Playwright suite.
- [ ] `actionlint` passes for `pipeline-e2e.yml` (add an `actionlint` job to `ci.yml` if it does not exist).
- [ ] Manual: the live run described in spec 027 succeeds on `e2e/live`.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0017](../adr/0017-local-course-build-flow.md) (stages and safety nets), [ADR-0016](../adr/0016-course-agents-in-vs-code.md) (agents run only in VS Code).
- Uses fixtures from specs 022–026 under `pipeline/fixtures/http-status-codes*/`.
