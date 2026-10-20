---
status: accepted
date: 2026-10-20
supersedes: "docs/adr/0015-course-agent-runtime-copilot-cli.md"
superseded_by: ""
specs:
  - ../specs/021-pipeline-foundation.md
  - ../specs/022-course-planner-agent.md
  - ../specs/023-course-research-agent.md
  - ../specs/024-course-implementation-agent.md
  - ../specs/025-roadmap-agent.md
  - ../specs/027-course-builder-agent.md
tags:
  - pipeline
  - agents
---
# ADR-0016: Course agents as VS Code custom agents

## Summary
We run the course agents as GitHub Copilot custom agents in VS Code, defined in `.github/agents/course-*.agent.md`: the user starts `course-planner` (GPT-5.6 Luna) with the course README attached, it hands off once via "Build course" to `course-builder` (GPT-5.6 Terra), and the builder runs `course-roadmap`, `course-researcher`, `course-implementer` (Luna) and `course-auditor` (Terra) as subagents. Running in the owner's VS Code bills the owner's assigned Copilot credits, works with the repository hosted on any GitHub account, and needs no GitHub Actions permissions, secrets, or organization CLI policy.

## Context
- [ADR-0015](0015-course-agent-runtime-copilot-cli.md) ran Copilot CLI in GitHub Actions, which needs the organization policy "Allow use of Copilot CLI billed to the organization", `copilot-requests: write`, and billing through the repository's organization.
- The owner wants the repository on a different GitHub account than the one holding the Copilot Business license, and wants usage billed to their own assigned credits.
- VS Code custom agents (Local harness) support a per-agent `model`, `tools`, `handoffs`, `user-invocable`, and subagents through the `agent` tool (`runSubagent`), restricted with the `agents` field.
- Every handoff is a button the user clicks; `send: true` only auto-submits the handoff prompt.
- A subagent does not run if its configured model is in a higher cost tier than the main agent's model.
- VS Code discovers workspace agents in `.github/agents/`; workspace custom instructions (`.github/copilot-instructions.md`) are combined with an agent's instructions, and the agent's instructions win on conflict.
- By default VS Code asks for approval of terminal commands and URL fetches; workspace settings can auto-approve them unless the organization locks those settings.

## Decision
- Course agents are VS Code custom agents in `.github/agents/`, prefixed `course-`:

| Agent | Model | User-invocable | Tools |
|---|---|---|---|
| `course-planner` | GPT-5.6 Luna | yes | read, edit, terminal; handoff "Build course" → `course-builder` with `send: true` |
| `course-builder` | GPT-5.6 Terra | yes (also used for retries) | `agent` (subagents), read, edit, terminal; `agents: [course-roadmap, course-researcher, course-implementer, course-auditor]` |
| `course-roadmap` | GPT-5.6 Luna | no | read, edit |
| `course-researcher` | GPT-5.6 Luna | no | read, edit, fetch, web search if available |
| `course-implementer` | GPT-5.6 Luna | no | read, edit, terminal |
| `course-auditor` | GPT-5.6 Terra | no | read, fetch, web search if available; returns the audit report as its final answer |

- The builder runs on Terra because it must be able to start the Terra auditor.
- The `model` values are the VS Code model identifiers for GPT-5.6 Luna and Terra, confirmed when implementing.
- Each agent file contains its full instructions; they state that course agents ignore `docs/specs/` and the development workflow. No course-agent instructions live in `.github/copilot-instructions.md`.
- `pipeline/` keeps the deterministic CLI, JSON Schemas, and recorded fixtures; this replaces the rule in [ADR-0002](0002-content-repository-layout.md) that course agent prompts live only in `pipeline/agents/`.
- `.vscode/settings.json` (committed) auto-approves the terminal commands the flow needs (`npm run pipeline`, `npm run check-challenges`, `npm run kit:manifest`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git` `status`, `add`, `commit`, `checkout`, `switch`, `branch`, `merge`, `pull`, `push`, `diff`, `log`) and HTTPS URL fetches. Setting names are confirmed against the current VS Code version; if the organization locks them, the user approves prompts manually.
- Usage is billed to the signed-in user's Copilot seat. VS Code has no per-agent credit cap; cost is bounded by the builder's rule of at most one retry per stage.
- Recorded fixture outputs are replayed by `pipeline replay` for tests; no AI runs in CI.

## Alternatives considered
- Copilot CLI in GitHub Actions ([ADR-0015](0015-course-agent-runtime-copilot-cli.md)): unattended, but needs organization policy, workflow permissions, and the repository in the licensed organization.
- A handoff per stage: four clicks instead of one.
- Builder on Luna: cheaper, but cannot start the Terra auditor.
- Agents outside `.github/agents/`: VS Code discovers workspace agents only there (extra-location settings are deprecated).

## Consequences
- The user starts each course and VS Code must stay open on their machine for the run (roughly 20–60 minutes).
- Course agents sit next to the development agents in `.github/agents/`; the `course-` prefix and `user-invocable: false` keep the agent picker clear.
- The license organization's admin must enable the GPT-5.6 models and agent features; locked approval settings mean manual approvals.
- A built-in web search tool is not confirmed; without it, research works fetch-only from authoritative entry points.
- Billing a personal project to a company license requires the license owner's approval.
