---
status: accepted
date: 2026-10-20
supersedes: "docs/adr/0014-course-pipeline-orchestration.md"
superseded_by: ""
specs:
  - ../specs/021-pipeline-foundation.md
  - ../specs/022-course-planner-agent.md
  - ../specs/026-course-validation.md
  - ../specs/027-course-builder-agent.md
  - ../specs/028-end-to-end-sample-course.md
tags:
  - pipeline
---
# ADR-0017: Local course build flow

## Summary
A course is built locally in VS Code: `course-planner` runs `pipeline start` (readiness check, `course/<slug>` branch, scaffold), writes and checks the plan, and hands off once; `course-builder` then runs each stage subagent followed by its deterministic gate and a commit, validates the finished course, merges it into the branch the flow started from, and pushes. Validation before the merge keeps broken courses out of `main` without any GitHub Actions orchestration, and the CI checks plus Vercel's build failing on invalid content act as a safety net.

## Context
- Course agents run as VS Code custom agents ([ADR-0016](0016-course-agents-in-vs-code.md)); nothing runs automatically on push.
- [ADR-0014](0014-course-pipeline-orchestration.md) orchestrated stages in a GitHub Actions workflow triggered by a push.
- Requirements kept: lessons pass through the lifecycle tags of [ADR-0004](0004-course-and-lesson-lifecycle-states.md); every agent output is checked by a deterministic gate; a broken course must never reach `main`.

## Decision
- Start: the user selects `course-planner` and attaches the course README. The planner runs `npm run pipeline -- start <folder>`, which verifies the README is a ready `draft` (or `failed`, for a retry), records the current branch as `pipeline.base_branch`, creates or resets `course/<slug>` from it, renames the folder to its slug, writes `board.base`, sets `status: planning`, and commits.
- Planner: writes the plan, runs `npm run pipeline -- gate plan <slug>` until it passes (at most 3 attempts), commits, and shows the "Build course" handoff.
- Builder, in order, each followed by its gate and `npm run pipeline -- commit`:
  1. `course-roadmap` (status stays `planning`) → gate `roadmap`.
  2. `set-status researching`; `course-researcher` → gate `research`.
  3. `set-status implementing`; `course-implementer` → gate `implement`.
  4. `set-status validating`; `course-auditor` → the builder saves the returned JSON to `.pipeline-artifacts/<slug>/audit-report.json` → `npm run pipeline -- validate <slug> --base <base_branch> --audit-report <path>`.
  5. Success: `npm run pipeline -- publish <slug>` sets `status: published`, commits, merges `course/<slug>` into the base branch with `--no-ff`, pushes the base branch, and deletes the local course branch.
- Gate or validation failure: the builder re-runs the failing stage's subagent once with the gate output; if it fails again, it runs `npm run pipeline -- fail <slug>`, which sets `status: failed` with a one-line reason in the README on the base branch, commits, and pushes; the course branch stays local for inspection; the builder stops with a summary.
- Retry: start `course-builder` (or `course-planner` if planning failed) again with the README attached; `pipeline start` accepts `failed`.
- Pushing a README does nothing by itself; this replaces the pipeline-start and retry rules of ADR-0004, whose status values and lesson tags remain.
- Safety nets: `ci.yml` runs lint, typecheck, tests, `validate:content`, and build on every push to `main`; the Vercel build fails on invalid published content, so the previous deployment stays live.
- `vercel.json` keeps `git.deploymentEnabled` `false` for `course/*` and `e2e/*` in case such branches are pushed.

## Alternatives considered
- GitHub Actions orchestration (ADR-0014): unattended, but requires running agents in Actions, which ADR-0016 rejects.
- Committing each stage directly on `main`: every stage would deploy and a failure would leave broken content.

## Consequences
- The user starts each course and keeps VS Code open until the builder finishes.
- Validation runs on the user's machine; compiled-language challenges need local toolchains or fall back to Compiler Explorer (specs 029–031).
- The end-to-end test in CI replays recorded agent outputs through the same CLI; real agent runs are tested manually.
