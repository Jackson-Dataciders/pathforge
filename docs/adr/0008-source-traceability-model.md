---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/014-course-rendering.md
  - ../specs/023-course-research-agent.md
  - ../specs/024-course-implementation-agent.md
  - ../specs/026-course-validation.md
tags:
  - content
  - research
---
# ADR-0008: Source traceability model

## Summary
Each lesson records its factual claims and their sources in frontmatter (`claims`, `sources`), the lesson text cites claims with Markdown footnotes (`[^c1]`), validation checks the citation graph structurally, and an LLM claim audit flags factual statements that are uncited or unsupported. Structure alone cannot detect an uncited claim, so the combination is the cheapest way to make "every factual claim traces to a recorded source" enforceable.

## Context
- The research agent must verify planned content against sources before implementation.
- Every factual lesson claim must trace back to a recorded source.
- A deterministic check can verify that citations point to recorded, verified sources, but not whether a sentence is a factual claim.
- Footnotes render natively in Obsidian and via `remark-gfm` in the frontend.

## Decision
- Lesson frontmatter:
  - `sources`: list of `{ id: s<n>, title, url (http/https), publisher, accessed (YYYY-MM-DD) }`.
  - `claims`: list of `{ id: c<n>, text, status: draft | verified | corrected | rejected, sources: [source ids], note? }`.
- The planner writes draft claims; the researcher sets each claim to `verified`, `corrected` (with corrected text), or `rejected`, and records sources.
- The implementer may state facts only from `verified` or `corrected` claims and cites each with a footnote reference `[^c<n>]`; the footnote definition is `[^c<n>]: [<source title>](<url>)` for each of the claim's sources.
- Structural validation (deterministic): every footnote reference matches a claim; every cited claim is `verified` or `corrected` and has at least one source; every footnote URL belongs to one of the claim's sources; no `rejected` or `draft` claim is cited; source ids are unique and referenced.
- Claim audit (LLM): after implementation, the researcher agent in `audit` mode reads each implemented lesson and returns a JSON report of findings (`uncited-claim`, `unsupported-claim`). The audit report is a workflow artifact, not a committed file. Validation fails if any finding exists.
- The frontend renders footnotes as a "Sources" list at the end of a lesson.

## Alternatives considered
- Structural checks only: cannot catch a factual sentence without a citation.
- Inline citations as a kit component: does not render in Obsidian and clutters prose.
- A separate sources file per course: breaks the prescribed course folder structure.

## Consequences
- Lesson frontmatter becomes long; Obsidian's properties panel shows it collapsed.
- The audit adds LLM cost per course and can produce false positives that fail a run; failures are visible in the workflow summary.
- Source quotes are not stored, avoiding copyrighted excerpts in the repository.
