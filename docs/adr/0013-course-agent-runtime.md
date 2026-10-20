---
status: superseded
date: 2026-10-20
supersedes: ""
superseded_by: "docs/adr/0015-course-agent-runtime-copilot-cli.md"
specs:
  - ../specs/021-pipeline-foundation.md
  - ../specs/022-course-planner-agent.md
  - ../specs/023-course-research-agent.md
  - ../specs/024-course-implementation-agent.md
  - ../specs/025-roadmap-agent.md
  - ../specs/027-course-builder-agent.md
  - ../specs/028-end-to-end-sample-course.md
tags:
  - pipeline
  - agents
---
# ADR-0013: Course agent runtime

## Summary
We run the course agents (planner, roadmap, researcher, implementer, auditor) as OpenAI Codex CLI in headless mode (`codex exec`) inside GitHub Actions, using the GPT-5.6 tiers Sol, Terra, and Luna per agent, invoked through a TypeScript wrapper `pipeline/src/agent-runner.ts` that loads prompts from `pipeline/agents/`, applies per-agent model, sandbox, web-search, and timeout settings from `pipeline/config.json`, and offers a `fixture` mode that replays recorded outputs for tests. Codex CLI runs the cheaper GPT-5.6 models synchronously inside one workflow with full control over prompts and settings, whereas the Copilot coding agent works through issues and pull requests that need merging and reads the development instructions.

## Context
- Course agents must run fully automated in GitHub Actions, triggered by a push that adds a ready course README, with no user input afterwards.
- They chain: planner → roadmap → researcher → implementer → auditor, with deterministic gates in between (see [ADR-0014](0014-course-pipeline-orchestration.md)).
- The researcher and auditor need web search; the others need file read and write in the checkout; the implementer needs to run a few npm commands.
- The owner prefers the OpenAI GPT-5.6 models (`gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`) because they are cheaper.
- The repository uses GitHub Copilot for development agents (`.github/`), whose instructions must not leak into course agents.
- Options:
  - A: Claude Code headless (`claude -p`) in GitHub Actions.
  - B: OpenAI Codex CLI headless (`codex exec`) in GitHub Actions.
  - C: GitHub Copilot coding agent, assigned to an automatically created issue per stage.

| Criterion | A: Claude Code | B: Codex CLI | C: Copilot coding agent |
|---|---|---|---|
| Cost | Pay per token for Claude models. | Pay per token for GPT-5.6 tiers; Luna and Terra are the cheapest capable options; bounded by timeouts and model choice. | Included premium requests; per-run cost control is coarse. |
| Models | Claude models only. | GPT-5.6 Sol, Terra, Luna. | Chosen by Copilot. |
| Reliability | Synchronous step, exit code and JSON output. | Synchronous step, exit code and JSON event stream. | Asynchronous; each stage opens a PR that must be merged; programmatic assignment needs a user token. |
| Configurability | Prompt, model, fine-grained tool allow-list, turn limit. | Prompt, model, sandbox mode (read-only, workspace-write), web search on/off, timeout. No per-command allow-list. | Shaped by `.github/` development instructions; limited per-stage control. |
| Testability | Wrapper can replay fixtures. | Wrapper can replay fixtures. | Hard to replay. |

## Decision
- We use option B, invoking the Codex CLI (`@openai/codex`, pinned version, installed as a dev dependency) from `pipeline/src/agent-runner.ts`.
- `pipeline/config.json` defines per agent: `model`, `reasoningEffort`, `sandbox` (`read-only` | `workspace-write`), `webSearch` (boolean), `timeoutMinutes`. Defaults:
  - planner: `gpt-5.6-terra`, workspace-write, no web search.
  - roadmap: `gpt-5.6-luna`, workspace-write, no web search.
  - researcher: `gpt-5.6-terra`, workspace-write, web search on.
  - implementer: `gpt-5.6-sol`, workspace-write, no web search (network disabled in the sandbox).
  - auditor: `gpt-5.6-terra`, read-only, web search on; its final message is the audit report.
- Because Codex has no per-command allow-list, file-level restrictions are enforced after each run by the deterministic gates (changed-path checks), not by the agent runtime.
- The wrapper passes the agent prompt from `pipeline/agents/<agent>.md` plus the agent's input contract as the prompt, records the JSON event stream as `<artifactsDir>/<slug>/<agent>.jsonl`, writes the final message to a file, and returns the exit status. Exact flag names are confirmed against the pinned CLI version.
- The repository must not contain an `AGENTS.md` that Codex would pick up implicitly; all course-agent instructions come from `pipeline/agents/`.
- `PIPELINE_AGENT_MODE=fixture` replaces the CLI with copying files from `pipeline/fixtures/<fixture>/<agent>/`, for CI and end-to-end tests without API cost.
- Secret: `OPENAI_API_KEY` as a repository secret.

## Alternatives considered
- A (Claude Code): finer tool control, but cannot run the preferred GPT-5.6 models.
- C (Copilot coding agent): asynchronous PR-based chaining and shared development instructions make it unreliable for an unattended multi-stage pipeline.
- `openai/codex-action` instead of calling the CLI: convenient for single steps, but the TypeScript wrapper is needed anyway for fixture mode and gates.

## Consequences
- Course generation incurs OpenAI API cost per course; timeouts and model tiers cap it.
- Agents can technically write any file in the checkout; the gates and validation path guard reject unexpected changes.
- Changing a model is a one-line change in `pipeline/config.json`.
