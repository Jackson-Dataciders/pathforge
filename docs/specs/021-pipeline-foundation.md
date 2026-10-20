---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
  - ../adr/0004-course-and-lesson-lifecycle-states.md
tags:
  - pipeline
  - agents
depends_on:
  - 003-course-vault-template-and-metadata-schema.md
  - 004-taxonomy.md
  - 006-component-kit-foundation.md
---
# Spec: 021-pipeline-foundation

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Build the deterministic command-line tool that the VS Code course agents call while they build a course: start a course (check that the README is ready, create the course branch, prepare the folder), move the course through its status values, check each agent's output with a gate, commit each stage, mark a failed course, and replay recorded agent outputs for tests. It also adds the workspace settings that let the course agents run these commands without approval prompts. The AI work itself happens in VS Code; this tool never calls a model.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `pipeline/src/cli.ts` using `node:util` `parseArgs`, npm script `pipeline` (`tsx pipeline/src/cli.ts`). Subcommands added in this spec: `check-ready`, `start`, `set-status`, `gate`, `commit`, `fail`, `replay`, `schemas`. Each prints human-readable output and exits non-zero on failure.
2. `pipeline/src/state.ts`: `COURSE_STATUSES` reused from spec 003; `ALLOWED_TRANSITIONS` (`draft→planning`, `planning→researching`, `researching→implementing`, `implementing→validating`, `validating→published`, any pipeline state→`failed`, `failed→planning` on retry); `setStatus(readmePath, to, { error?, stage? })` validates the transition, updates `status`, `pipeline.last_stage`, `pipeline.error`, and preserves everything else via `stringifyMarkdownFile`. Unit tests for every allowed and a sample of rejected transitions.
3. Extend `pipeline` in `src/content/schema/course-metadata.ts` with `description_sha256`, `source_folder`, and `base_branch`.
4. `pipeline/src/course-ref.ts`: resolve a course by folder name, slug, or README path (accepts the attached README path from VS Code, absolute or relative). Tests.
5. `check-ready <folder|readme>`: prints whether the README is a ready `draft` (passes `readyCourseSchema`) or `failed`, listing missing fields otherwise; exit 1 if not startable.
6. `pipeline/src/start.ts` and `start <folder|readme>`: requires a clean working tree; runs the `check-ready` logic; records the current branch as `pipeline.base_branch`; creates or resets `course/<slug>` from the current branch (`git switch -C`); computes the slug with `slugify(folder)` and `git mv`s the folder if it differs (fails if the target exists); writes `board.base` from `courses/_templates/board.base.template` replacing `{{COURSE_FOLDER}}`; sets `pipeline.run_id` (timestamp), `pipeline.source_folder`, `pipeline.description_sha256` (SHA-256 of the trimmed Description); removes lesson files left from a failed run; sets `status: planning`; commits `pipeline(<slug>): start`. Prints the slug. Tests in a temporary git repository.
7. `pipeline/src/gates/index.ts`: gate registry `{ name, run(ctx) → GateIssue[] }`, `GateIssue { file, message }`; gate `start` (README valid, `board.base` references the slug, status `planning`, current branch `course/<slug>`). `gate <name> <slug>` prints issues as a numbered list suitable for pasting into an agent prompt, writes them to `$GITHUB_STEP_SUMMARY` when set, and exits 1 on any issue.
8. `pipeline/src/git.ts` and `commit <slug> <stage>`: stages `courses/<slug>`, `catalog/`, and stage-specific paths, commits as the local git user with message `pipeline(<slug>): <stage>`, no-op if nothing changed; `changedFiles(baseRef)`; `currentBranch()`.
9. `fail <slug> --stage <stage> --reason <text>`: switches to `pipeline.base_branch`, sets `status: failed` and `pipeline.error` (first 300 characters, single line) in that branch's README (at `pipeline.source_folder` or the slug folder, whichever exists there), commits, pushes the base branch, and switches back to `course/<slug>`. Tests with a temporary repository and a bare remote.
10. `pipeline/src/replay.ts` and `replay <agent> <slug> --fixture <name>`: copies `pipeline/fixtures/<fixture>/<agent>/**` into the repository root, replacing `__COURSE__` in paths and in YAML/Markdown contents with the slug; `.merge.yaml` files are merged into the target YAML by `id` (new items appended, existing items' fields updated); files under `artifacts/` go to `.pipeline-artifacts/<slug>/`. Used by tests and spec 028; never calls a model. Tests with `pipeline/fixtures/test-fixture/`.
11. `schemas` (npm script `pipeline:schemas`): writes JSON Schemas for course README, lesson frontmatter, taxonomy, and roadmap (once spec 019 exists) to `pipeline/schemas/*.json` via `z.toJSONSchema`; `--check` mode; add the check to `ci.yml`.
12. `.vscode/settings.json`: auto-approve the terminal commands listed in ADR-0016 (`npm run pipeline`, `npm run check-challenges`, `npm run kit:manifest`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the listed `git` subcommands) and HTTPS URL fetches, using the current VS Code setting names (`chat.tools.terminal.autoApprove`, `chat.tools.urls.autoApprove`; confirm in the VS Code documentation). Add `.pipeline-artifacts/` to `.gitignore`.
13. README "Creating a course" section: prerequisites (VS Code with GitHub Copilot signed in to the licensed account, GPT-5.6 Luna and Terra enabled by the license organization, Node 22, `npm ci`), the flow from ADR-0017, how to retry, and that locked approval settings mean manual approvals.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- All commands run locally from the repository root (`npm run pipeline -- <command>`); none calls a model or needs a GitHub token beyond normal `git push` credentials.
- `start` refuses a dirty working tree, a README that is not ready, and a course already in progress (status other than `draft` or `failed`).
- A folder named `API Endpoints` becomes `api-endpoints`.
- `gate` output is designed to be read by an agent: one issue per line with file and message.
- `fail` leaves the course branch untouched for inspection.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- The course agents and their gates (specs 022–025, 027).
- Validation and publishing (specs 026 and 027).
- Any GitHub Actions workflow that runs agents.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Unit tests for `state`, `course-ref`, `check-ready`, `start`, `gates`, `git`, `fail`, and `replay` pass.
- [ ] In a temporary repository, `npm run pipeline -- start "API Endpoints"` on `main` creates branch `course/api-endpoints`, renames the folder, writes `board.base`, sets `status: planning` and `pipeline.base_branch: main`, and commits (test).
- [ ] `start` exits 1 for a README with an empty Description and for a dirty working tree (tests).
- [ ] `npm run pipeline -- schemas --check` passes in CI.
- [ ] `.vscode/settings.json` contains the auto-approve rules; manual: running `npm run pipeline -- check-ready <folder>` from a VS Code agent chat does not prompt for approval.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0016](../adr/0016-course-agents-in-vs-code.md) (VS Code agents, auto-approve settings), [ADR-0017](../adr/0017-local-course-build-flow.md) (start, stages, fail, publish), [ADR-0004](../adr/0004-course-and-lesson-lifecycle-states.md) (statuses).
- Reuses `src/content/*` schemas, `markdown-file.ts`, `course-files.ts`, `taxonomy-writer.ts`.
- Environment variables: `PIPELINE_ARTIFACTS_DIR` (default `.pipeline-artifacts`), optional `GITHUB_STEP_SUMMARY` (CI only).
- No new runtime dependencies.
