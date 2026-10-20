---
status: superseded
date: 2026-10-20
supersedes: ""
superseded_by: "docs/adr/0017-local-course-build-flow.md"
specs:
  - ../specs/021-pipeline-foundation.md
  - ../specs/026-course-validation.md
  - ../specs/027-course-builder-agent.md
  - ../specs/028-end-to-end-sample-course.md
tags:
  - pipeline
  - ci
---
# ADR-0014: Course pipeline orchestration

## Summary
One GitHub Actions workflow, `course-pipeline.yml`, triggered by pushes to `main` that change a ready course README (status `draft` with all required fields filled), claims the course on `main` by setting `status: planning`, runs every stage on a `course/<slug>` branch with a commit and a deterministic gate after each agent, validates the result, and only then merges the course into `main`. Re-runs on its own commits are prevented by independent guards — pushes made with `GITHUB_TOKEN` do not trigger workflows, only ready `draft` READMEs start a run and the claim commit immediately changes that, a per-course concurrency group, and a skip for commits authored by the pipeline bot.

## Context
- After the user pushes a ready README, nothing may require user input until the course is published.
- Agents must be chained in order, and a broken course must never reach `main`.
- Pipeline commits must not re-trigger the pipeline, and further pushes of the same README while a run is in progress must not start a second run.
- Vercel deploys `main` automatically; intermediate states must not be deployed.
- `main` is not branch-protected, so the workflow may push to it with `GITHUB_TOKEN`.
- Options for chaining:
  - A: one workflow with sequential stages per course.
  - B: one workflow per stage, chained by `workflow_run` or commit events.
  - C: one workflow per stage, chained by `repository_dispatch`.
- Options for where work happens:
  - 1: commit each stage directly to `main`.
  - 2: work on a `course/<slug>` branch and merge into `main` after validation.

## Decision
- A + 2.
- Triggers: `on.push` to `main` with `paths: ['courses/*/README.md']`; `workflow_dispatch` and `workflow_call` with inputs `course`, `agent_mode`, `fixture`, and `base_branch` (default `main`) for retries and tests.
- Job `detect`: outputs the course folders whose README changed in the push, has `status: draft`, and passes `readyCourseSchema`; for dispatch, the given course if its status is `draft` or `failed`. Nothing found → the workflow ends.
- Job `run`: matrix over courses, `concurrency: course-<folder>` (no cancel-in-progress), `max-parallel: 1`, `permissions: contents: write`.
- Stage order and states:
  1. `claim` (deterministic, on the base branch): re-check readiness, set `status: planning`, commit, push. If the README is no longer ready, end the job successfully without changes.
  2. `scaffold` (deterministic): create `course/<slug>` from the base branch, rename the folder to its slug, create `board.base`.
  3. `planner` → gate `plan` → commit.
  4. `roadmap` → gate `roadmap` → commit. Status stays `planning`.
  5. Status `researching`; `researcher` → gate `research` → commit.
  6. Status `implementing`; `implementer` → gate `implement` → commit.
  7. Status `validating`; `auditor` → `pipeline validate` → commit.
  8. Success: set `status: published`, commit, merge `course/<slug>` into the base branch with `--no-ff`, push, delete the course branch.
  9. Failure in any step after `claim`: push the course branch for inspection, then on the base branch set the README `status: failed` and `pipeline.error` to a one-line reason, commit and push. The job summary lists the failing gate and its messages.
- Commits are authored as `pathforge-pipeline <pipeline@users.noreply.github.com>` with message prefix `pipeline(<slug>): <stage>`.
- Loop prevention:
  1. All pushes use `GITHUB_TOKEN`, whose pushes do not trigger workflows.
  2. `detect` only accepts ready `draft` READMEs, and the claim commit changes the status to `planning` before any agent runs.
  3. Per-course concurrency group.
  4. `detect` ignores pushes whose head commit author is the pipeline bot.
- Retry: `workflow_dispatch` with `course=<slug>` runs only if the README status is `draft` or `failed`, and restarts from `claim`.
- Vercel: `vercel.json` sets `git.deploymentEnabled` to `false` for `course/*` and `e2e/*`, so pipeline branches never deploy; Vercel deploys `main` after the claim commit (no visible change, because unpublished courses are hidden) and after the merge.

## Alternatives considered
- B and C: more moving parts, harder to follow one course's run end to end, and each hop needs its own loop guard.
- 1 (commit every stage to `main`): every stage would deploy a half-built course and a failure would leave broken content on `main`.
- No claim commit: a second push of the same ready README during a run would start a duplicate run.

## Consequences
- The Obsidian board on `main` shows a course's lessons only after it is published; intermediate progress is visible on the `course/<slug>` branch and in the workflow log; the README on `main` shows the current coarse status from the claim commit onward (`planning`, then `published` or `failed`).
- `main` must stay unprotected (or allow the workflow to push) for the claim, failure, and merge commits.
- A retry repeats all agent stages, which costs tokens again; resuming from the last successful stage can be added later.
