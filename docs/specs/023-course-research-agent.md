---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0008-source-traceability-model.md
  - ../adr/0016-course-agents-in-vs-code.md
  - ../adr/0017-local-course-build-flow.md
  - ../adr/0004-course-and-lesson-lifecycle-states.md
tags:
  - pipeline
  - agents
  - research
depends_on:
  - 022-course-planner-agent.md
---
# Spec: 023-course-research-agent

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Before any lesson is written, the `course-researcher` subagent checks every planned claim against real sources on the web. Each claim is marked verified, corrected, or rejected, and every verified or corrected claim gets at least one recorded source. After the lessons are written, the `course-auditor` subagent reads the finished lessons and reports any factual statement that has no citation or is not supported by its cited source. A gate checks the research output; the audit report is consumed by validation.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/schema/lesson.ts`: add `plannedLessonSchema` (tag `planned`; no `draft` claims; each `verified`/`corrected` claim has 1+ source ids that exist; `rejected` claims have a `note`; each source is referenced by at least one claim; unique ids; at least one non-rejected claim).
2. `.github/agents/course-researcher.agent.md`: frontmatter `name: course-researcher`, `description`, `model` = VS Code identifier for GPT-5.6 Luna, `user-invocable: false`, `tools`: read, edit, fetch, and the web search tool if VS Code provides one (confirm at implementation; otherwise omit). Body sections Role (subagent of `course-builder`, not part of the development workflow), Inputs (the slug and context list passed by the builder), Output contract, Rules, Procedure, Self-check, Final message (one-paragraph summary with counts per claim status). Rules: for every `draft` claim, find candidate pages (with web search if available; otherwise fetch-only, starting from authoritative entry points for the topic such as official documentation, standards bodies like the RFC Editor and W3C, MDN, and language references, and using those sites' own search pages) and open them; prefer primary and authoritative sources (standards and RFCs, official documentation, vendor docs, peer-reviewed or textbook-level references), avoid forums, AI-generated content, and SEO content farms; mark `verified` only if the opened page directly supports the claim; if the source says something slightly different, set `corrected` and rewrite `text` in `course_language`; otherwise set `rejected` with a `note`; record each source with title, exact URL, publisher, and `accessed` = today; do not store quotes; update `outline` if rejected claims remove a topic; set the lesson tag from `created` to `planned`; append a "Research" bullet list to the README `## Notes` with counts per status; edit nothing else.
3. `.github/agents/course-auditor.agent.md`: frontmatter `name: course-auditor`, `model` = VS Code identifier for GPT-5.6 Terra, `user-invocable: false`, `tools`: read, fetch, and web search if available (no edit, no terminal). Body: read each `implemented` lesson, list every sentence that states a fact; for each, check it has a `[^cN]` citation to a `verified`/`corrected` claim and that the claim (and if needed the source, opened with fetch) supports the sentence; return the report as the final message, consisting only of JSON matching `pipeline/schemas/audit-report.json`; never edit files. Findings: `uncited-claim` or `unsupported-claim` with `file`, `excerpt` (at most 200 characters), optional `claim_id`, and `explanation`.
4. `pipeline/schemas/audit-report.json` and zod `src/content/schema/audit-report.ts`: `{ course, generated_at, lessons: { file, findings: Finding[] }[] }`; add to `pipeline schemas` generation.
5. Extend `context` (spec 022) with `--agent researcher` (lesson files, lesson schema path, today's date) and `--agent auditor` (implemented lessons, audit schema path). CLI `save-audit <slug> --from <file|->`: reads the auditor's JSON (the builder pipes or pastes it), validates it against the audit schema, and writes `.pipeline-artifacts/<slug>/audit-report.json`; exit 1 with the schema errors if invalid. Tests.
6. `pipeline/src/gates/research.ts` (gate `research`): every lesson matches `plannedLessonSchema`; lesson count, file names, objectives, and components unchanged compared with `HEAD` (the previous stage commit); README unchanged except `## Notes`; no files changed outside `courses/<slug>/`; each source URL is syntactically valid http(s). Optional reachability check (`--check-urls`) performs GET requests with 10 s timeout and reports unreachable URLs as warnings, not failures.
7. Fixtures: `pipeline/fixtures/http-status-codes/researcher/courses/__COURSE__/` (the three lessons tagged `planned` with verified claims citing RFC 9110 `https://www.rfc-editor.org/rfc/rfc9110` and MDN `https://developer.mozilla.org/en-US/docs/Web/HTTP/Status`, plus README with Research notes) and `pipeline/fixtures/http-status-codes/auditor/artifacts/audit-report.json` (no findings). Add `pipeline/fixtures/http-status-codes-unsupported/auditor/artifacts/audit-report.json` with one finding for negative tests in spec 026.
8. Tests: gate `research` passes for the fixture chain (`start` → `replay planner` → `replay researcher`); fails for a remaining `draft` claim, a verified claim without sources, an unreferenced source, a changed objective, and an edited Description; audit report schema accepts both audit fixtures; `save-audit` accepts the clean fixture and rejects malformed JSON.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Verify mode input: lessons tagged `created`; output: lessons tagged `planned` with complete `claims` and `sources`.
- Auditor input: lessons tagged `implemented`; output: the audit report JSON as its final answer, saved by the builder with `save-audit`; it changes no files.
- Sources may be in any language; claim text is in `course_language`.
- If many claims are rejected, the lesson keeps only what is verified; the implementer must not state rejected facts.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Deciding pass/fail from the audit report (spec 026).
- Archiving source pages or storing quotes.
- Re-researching published courses.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `.github/agents/course-researcher.agent.md` and `.github/agents/course-auditor.agent.md` exist with the listed frontmatter and sections, both hidden from the agent picker.
- [ ] Gate `research` passes on the fixture chain and fails for each listed mutation (tests).
- [ ] `pipeline/schemas/audit-report.json` is generated and `npm run pipeline -- schemas --check` passes.
- [ ] `save-audit` writes a valid report to `.pipeline-artifacts/<slug>/audit-report.json` and rejects invalid JSON (tests).
- [ ] The researcher fixture lessons appear in the `planned` column of the course `board.base` in Obsidian (manual).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0008](../adr/0008-source-traceability-model.md) (claims, sources, audit), [ADR-0016](../adr/0016-course-agents-in-vs-code.md), [ADR-0017](../adr/0017-local-course-build-flow.md), [ADR-0004](../adr/0004-course-and-lesson-lifecycle-states.md).
- Runtime: researcher on GPT-5.6 Luna, auditor on GPT-5.6 Terra, both run by `course-builder` as subagents (spec 027). Without a web search tool they work fetch-only as described in the researcher rules.
- Handoff contract to the implementer: lessons validated by gate `research`.
