---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0005-component-kit-contract-and-extension-policy.md
  - ../adr/0007-code-challenge-verification.md
  - ../adr/0008-source-traceability-model.md
  - ../adr/0017-local-course-build-flow.md
tags:
  - pipeline
  - validation
depends_on:
  - 024-course-implementation-agent.md
  - 025-roadmap-agent.md
---
# Spec: 026-course-validation

## Description
<!-- Written by me: what the feature should do, in plain words. -->
A broken course must never reach `main`. One validation command checks a finished course end to end: all metadata and lessons are valid, every kit block and diagram parses, every code challenge's reference solution passes its tests, every cited claim traces to a recorded, verified source, the claim audit found nothing, only allowed files changed, and the whole app still lints, type-checks, passes its tests, and builds with the new course included. It reports every problem at once and fails if there is any.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Preview override in `src/content/courses.ts` (spec 005): when `PATHFORGE_PREVIEW_COURSES` (comma-separated slugs) is set, courses with those slugs and status `validating` are treated as published. Unit test. Document that this variable must never be set in Vercel.
2. `pipeline/src/validate/checks.ts`: independent checks, each returning `{ id, title, issues: GateIssue[], durationMs }`:
   - `metadata`: README matches `publishedCourseSchema` apart from `status` (which is `validating`); taxonomy and roadmap references valid (`validate:content` logic with the preview override).
   - `lessons`: every lesson matches `implementedLessonSchema`; numbering sequential.
   - `kit-blocks`: every lesson compiles with `compileLesson`; unique block ids.
   - `diagrams`: every ` ```mermaid ` block and `diagram`/`stepper` diagram passes `validateMermaid` (spec 007).
   - `challenges`: `check-challenges` logic (spec 024): reference solutions pass, starters fail, language matches.
   - `citations`: `checkCitations` (spec 024) for every lesson, plus every non-rejected claim is cited at least once in the lesson body.
   - `audit`: the audit report at `--audit-report` exists, matches the audit schema (spec 023), names this course, covers every lesson, and contains no findings.
   - `paths`: files changed between `--base` and the working tree are limited to `courses/<slug>/**`, the removed `courses/<pipeline.source_folder>/**`, `catalog/taxonomy.yaml`, `catalog/roadmaps/<category>.yaml`, and, for declared `new_components`, `src/kit/components/<name>/**`, `src/kit/registry.ts`, `src/kit/manifest.json`.
   - `project`: runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run kit:manifest -- --check`, and `npm run build` with `PATHFORGE_PREVIEW_COURSES=<slug>`; captures the last 100 lines of output on failure; skipped with `--skip-build`.
3. `pipeline/src/validate/index.ts` and CLI `validate <slug> --base <ref> --audit-report <path> [--skip-build]`: runs all checks (cheap checks first, `project` last, always all of them), writes `<artifactsDir>/<slug>/validation-report.json` and a Markdown table to `$GITHUB_STEP_SUMMARY`, prints a summary, exits 1 if any check has issues.
4. Negative fixtures: reuse `http-status-codes-broken` (failing challenge) and `http-status-codes-unsupported` (audit finding); add `pipeline/fixtures/http-status-codes-bad-citation/implementer/` (a lesson citing a rejected claim) and `pipeline/fixtures/http-status-codes-bad-mermaid/implementer/` (invalid diagram).
5. Tests in `pipeline/src/validate/*.test.ts` running the fixture chain in a temporary repository with `--skip-build`: the good fixture passes; each negative fixture fails exactly the expected check; a file added under `src/app/` fails `paths`. One slower test (tagged, run in CI) runs the `project` check on the good fixture.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Input: a course in status `validating` on its `course/<slug>` branch, the base ref (`main`), and the audit report path.
- Output: exit code 0 only if every check passes; a JSON report and a human-readable summary listing every issue with file and message.
- Validation does not modify repository files.
- The production build used for validation includes the course as if published; nothing is deployed.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Running the auditor (spec 023) and merging into `main` (spec 027).
- Checking that source URLs are reachable (warning-only option in spec 023).
- Browser-level tests of the course (spec 028).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `npm run pipeline -- validate http-status-codes --base <ref> --audit-report <path> --skip-build` exits 0 on the good fixture chain (test).
- [ ] The failing challenge, unsupported audit finding, bad citation, bad Mermaid, and unexpected `src/app/` file each make validation exit 1 and name the failing check and file (tests).
- [ ] With the `project` check enabled, validation runs lint, typecheck, tests, manifest check, and build, and the build output lists the fixture course's lesson routes (CI test).
- [ ] `validation-report.json` matches the documented shape (test).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0005](../adr/0005-component-kit-contract-and-extension-policy.md) (path guard), [ADR-0007](../adr/0007-code-challenge-verification.md) (same runners in CI), [ADR-0008](../adr/0008-source-traceability-model.md) (citations and audit), [ADR-0017](../adr/0017-local-course-build-flow.md) (validate before merge).
- Reuses gates and helpers from specs 021–025; no new dependencies.
