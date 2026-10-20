---
status: superseded
date: 2026-10-20
supersedes: "docs/adr/0013-course-agent-runtime.md"
superseded_by: "docs/adr/0016-course-agents-in-vs-code.md"
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
# ADR-0015: Course agent runtime on GitHub Copilot CLI

## Summary
We run the course agents as GitHub Copilot CLI in programmatic mode (`copilot -p`) inside GitHub Actions, authenticated with the workflow's `GITHUB_TOKEN` and billed to the organization's Copilot Business AI credits, using `gpt-5.6-luna` for the planner, roadmap agent, researcher, and implementer and `gpt-5.6-terra` for the auditor. This makes a course cost roughly $1.50–2 of included Copilot credits instead of a separate OpenAI bill, keeps the stronger model on the auditor that guards factual accuracy, and regains a per-tool allow-list that Codex CLI lacked.

## Context
- [ADR-0013](0013-course-agent-runtime.md) chose OpenAI Codex CLI with an `OPENAI_API_KEY`, billed separately from the owner's existing GitHub Copilot Business license.
- Copilot Business includes 1,900 AI credits per seat per month (1 credit = $0.01), consumed at the providers' list prices; GPT-5.6 Sol, Terra, and Luna are available.
- Copilot CLI supports non-interactive runs in GitHub Actions with `GITHUB_TOKEN` when the workflow has `permissions: copilot-requests: write` and the organization policy "Allow use of Copilot CLI billed to the organization" is enabled.
- Copilot CLI loads repository instruction files (`AGENTS.md`, `.github/copilot-instructions.md`) by default; these are the development instructions and must not reach course agents.
- Estimated cost per course of about 8 lessons: all-Luna about $1; with the auditor on Terra about $1.50–2. Luna is weak at long-context recall, which matters most for the auditor, the only safeguard against unsupported facts that the deterministic gates cannot detect.
- URL fetching is built into Copilot CLI; a built-in web search tool is not confirmed by official documentation.

## Decision
- We use GitHub Copilot CLI (`@github/copilot`, exact version pinned, at least the first version supporting `GITHUB_TOKEN` authentication and `--max-ai-credits`) invoked by `pipeline/src/agent-runner.ts`.
- Every invocation uses `-p` with the prompt, `--model`, `--no-custom-instructions`, `--no-ask-user`, `--silent --output-format json`, `--max-ai-credits`, and the agent's tool flags; it never uses `--allow-all` / `--yolo`.
- `pipeline/config.json` per agent: `model`, `maxAiCredits`, `timeoutMinutes`, `allowTools`, `denyTools`, `allowAllUrls`, `webSearch`. Defaults:

| Agent | Model | Credit cap | Tools |
|---|---|---|---|
| planner | `gpt-5.6-luna` | 20 | allow `read`, `write`; deny `shell`, `url` |
| roadmap | `gpt-5.6-luna` | 15 | allow `read`, `write`; deny `shell`, `url` |
| researcher | `gpt-5.6-luna` | 80 | allow `read`, `write`, `url` with `--allow-all-urls`, web search if available; deny `shell` |
| implementer | `gpt-5.6-luna` | 100 | allow `read`, `write`, `shell(npm run check-challenges:*)`, `shell(npm run kit:manifest)`, `shell(npm test:*)`; deny `url` |
| auditor | `gpt-5.6-terra` | 150 | allow `read`, `url` with `--allow-all-urls`, web search if available; deny `write`, `shell`; final message is the audit report |

- Web search: the implementation checks whether the pinned CLI version exposes a built-in web search tool. If it does, the researcher and auditor enable it. If not, they work fetch-only, starting from authoritative entry points (official documentation, standards bodies such as the RFC Editor and W3C, MDN, language references) and those sites' own search pages; no third-party search API is added without a new ADR.
- Authentication: the workflow's `GITHUB_TOKEN` with `permissions: copilot-requests: write`; no repository secret is needed.
- Fixture mode (`PIPELINE_AGENT_MODE=fixture`), prompt location (`pipeline/agents/`), and gates are unchanged from ADR-0013.
- Changing a model or cap is a one-line change in `pipeline/config.json`; the recommended first upgrade, if implementer gates fail often, is the implementer to `gpt-5.6-terra`.

## Alternatives considered
- Keep Codex CLI with `OPENAI_API_KEY` (ADR-0013): same token prices, but a separate bill outside the existing Copilot license and no per-tool allow-list.
- All agents on Luna: about $1 per course, but a weak auditor could let unsupported claims through unnoticed.
- Copilot coding agent via issues: rejected in ADR-0013 for its asynchronous, pull-request-based hand-offs.

## Consequences
- About 10 or more courses per month fit into one seat's included credits; usage beyond that requires an organization budget at $0.01 per credit.
- Usage is billed to the organization; whether credits are pooled across seats is not documented, so course runs may compete with colleagues' usage, and the license owner's approval is required for this personal-project use.
- Without a confirmed built-in web search tool, research quality depends on the fetch-only fallback.
- `--max-ai-credits` is a soft cap; a run can slightly exceed it, and a run that hits it ends and fails its gate.
