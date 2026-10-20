---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
tags:
  - pipeline
  - agents
depends_on:
  - 026-course-validation.md
---
# Spec: 027-course-builder-agent

## Description
<!-- Written by me: what the feature should do, in plain words. -->
After the planner finishes, I click the one "Build course" handoff in VS Code. The `course-builder` agent then does the rest without further input: it runs the roadmap, research, and implementation subagents and the auditor, checks each result with its gate and commits it, validates the finished course, merges it into the branch I started from, and pushes, so Vercel deploys it. If a stage fails twice, it marks the course as failed with a reason and stops. CI checks on `main` act as a safety net.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. CLI `publish <slug>` (`pipeline/src/publish.ts`): requires current branch `course/<slug>` and status `validating`; sets `status: published`; commits; switches to `pipeline.base_branch`; `git pull --ff-only`; merges `course/<slug>` with `--no-ff -m "pipeline(<slug>): publish"`; pushes the base branch; deletes the local course branch. On merge conflict: abort the merge, switch back to the course branch, exit 1. Tests with a temporary repository and a bare remote.
2. CLI `resume-point <slug>`: prints the next stage to run from the README `status` and lesson tags (`roadmap`, `research`, `implement`, `validate`, or `done`), so a retried builder continues where the last run stopped. Tests.
3. `.github/agents/course-builder.agent.md`:
   - Frontmatter: `name: course-builder`; `description` ("Builds a planned Pathforge course: research, lessons, audit, validation, publish"); `model`: VS Code identifier for GPT-5.6 Terra; `tools`: `agent` (subagents), read, edit, terminal; `agents: [course-roadmap, course-researcher, course-implementer, course-auditor]`.
   - Body sections: Role (orchestrator for one course, not part of the development workflow, ignores `docs/specs/`, never asks the user questions, does not write lesson content itself); Inputs (the `Course:` line from the planner's message, or an attached README for a retry); Procedure; Failure handling; Final message.
   - Procedure: determine the slug; `git switch course/<slug>`; run `npm run pipeline -- resume-point <slug>` and start from that stage. For each stage: run `npm run pipeline -- set-status <slug> <status>` where the stage changes status; run `npm run pipeline -- context <slug> --agent <name>`; start the subagent with the slug and that context; run the stage's gate; on success `npm run pipeline -- commit <slug> <stage>`. Stages:
     1. `course-roadmap` → gate `roadmap` (status stays `planning`).
     2. status `researching`; `course-researcher` → gate `research`.
     3. status `implementing`; `course-implementer` → gate `implement`.
     4. status `validating`; `course-auditor` → save its answer with `npm run pipeline -- save-audit <slug> --from -` → `npm run pipeline -- validate <slug> --base <base_branch> --audit-report .pipeline-artifacts/<slug>/audit-report.json`.
     5. `npm run pipeline -- publish <slug>`.
   - Failure handling: if a gate or validation fails, start the same subagent once more with the issue list added to its prompt (for validation failures, the subagent responsible for the failing check: `challenges`, `kit-blocks`, `diagrams`, `citations` → implementer; `audit` findings → implementer, then auditor again; `metadata` roadmap or taxonomy issues → roadmap); if it fails again, run `npm run pipeline -- fail <slug> --stage <stage> --reason "<one line>"` and stop. Never edit gated files itself to make a gate pass; never use `git push --force`; never change files outside what the stage allows.
   - Final message: stages run, gate results, and either the published course path or the failure reason and how to retry (select `course-builder` and attach the README).
4. Planner handoff check: `course-planner`'s handoff (spec 022) targets `course-builder`; verify the label "Build course" starts this agent with the planner conversation, from which it reads the `Course:` line.
5. CI safety net in `ci.yml` (spec 001): on push to `main`, add `npm run pipeline -- validate-published --changed-since ${{ github.event.before }}` running the deterministic validation checks (spec 026, without audit and project checks) for every course folder changed in the push; existing lint, typecheck, test, `validate:content`, and build steps remain.
6. `vercel.json`: extend `git.deploymentEnabled` with `"course/*": false` and `"e2e/*": false`.
7. README "Creating a course" section (spec 021): add the builder, retries, what each status means, and that VS Code must stay open until the builder's final message.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- The "Build course" click is the only user action after starting the planner, as long as tool approvals are auto-approved (spec 021 settings).
- Success: the base branch (normally `main`) gets one merge commit with the course, roadmap and taxonomy changes, and any declared kit components; it is pushed and Vercel deploys it.
- Failure: the base branch gets a README commit with `status: failed` and a one-line reason, pushed; `course/<slug>` stays local with all stage commits.
- Retry: selecting `course-builder` with the README attached resumes at the stage after the last successful one.
- Each stage runs its subagent at most twice per builder run.
- If VS Code is closed mid-run, the course branch keeps all committed stages and a retry resumes from there.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Running agents in GitHub Actions or on a server.
- Parallel building of several courses.
- Notifications beyond the chat's final message.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `publish` and `resume-point` tests pass, including merge-conflict abort.
- [ ] `.github/agents/course-builder.agent.md` exists with the listed frontmatter (Terra model, `agent` tool, `agents` list) and body sections.
- [ ] `validate-published --changed-since` runs in `ci.yml` and fails for a deliberately broken fixture course (test).
- [ ] `vercel.json` disables deployments for `progress`, `course/*`, and `e2e/*`.
- [ ] Manual: on a scratch branch `e2e/live` containing the sample request README (`pipeline/fixtures/http-status-codes/request/README.md` copied to `courses/http-status-codes/README.md`), selecting `course-planner` with that README attached and clicking "Build course" ends with the course merged into `e2e/live` and pushed, without further input.
- [ ] Manual: replacing the implementer output with a broken challenge during that run leads to one retry and, if still broken, `status: failed` on `e2e/live`.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0016](../adr/0016-course-agents-in-vs-code.md) (builder on Terra, subagents, auto-approval), [ADR-0017](../adr/0017-local-course-build-flow.md) (stage order, retry, publish, safety nets).
- Uses CLI commands from specs 021–026: `context`, `set-status`, `gate`, `commit`, `save-audit`, `validate`, `fail`.
- `validate-published` reuses the checks from spec 026 with `metadata`, `lessons`, `kit-blocks`, `diagrams`, `challenges`, and `citations`.
