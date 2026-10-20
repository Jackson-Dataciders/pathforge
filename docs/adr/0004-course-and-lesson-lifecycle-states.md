---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/003-course-vault-template-and-metadata-schema.md
  - ../specs/021-pipeline-foundation.md
  - ../specs/022-course-planner-agent.md
  - ../specs/023-course-research-agent.md
  - ../specs/024-course-implementation-agent.md
tags:
  - content
  - pipeline
---
# ADR-0004: Course and lesson lifecycle states

## Summary
We track a course's pipeline progress with a pipeline-managed `status` field in its README frontmatter, where a `draft` README with all required fields filled counts as ready, and each lesson's progress with exactly one lifecycle tag (`created`, `planned`, `implemented`), shown as columns by a per-course `board.base` that groups lessons by a formula over those tags. Explicit states give the pipeline an unambiguous trigger and re-run guard without any extra step for the user, and keep the tag-based Obsidian board the brief asks for.

## Context
- Lessons must carry one of the tags `created`, `planned`, or `implemented`, and `board.base` must show them as columns.
- The pipeline needs to know when a README is ready, which stage a course is in, and when a course must not be processed again.
- Obsidian Bases groups by properties; `tags` is a list, so grouping on it directly is unreliable when a lesson carries more than one tag.
- The development board `docs/specs/board.base` uses a `kanban` view grouped by a property.

## Decision
- Course README `status` values: `draft` (template default; the user never edits it) → `planning` → `researching` → `implementing` → `validating` → `published`. Any pipeline state may move to `failed`. Only the pipeline changes `status`.
- A course is ready when its README has `status: draft` and passes `readyCourseSchema` (non-empty `topic`, `course_language`, `code_language`, and `## Description`). The pipeline starts on a push that changes such a README; a `failed` course is retried only through manual `workflow_dispatch` (see [ADR-0014](0014-course-pipeline-orchestration.md)).
- Lesson lifecycle tags:
  - `created`: the planner wrote the lesson stub (title, objectives, outline, planned components, draft claims).
  - `planned`: the researcher verified the lesson's claims against recorded sources.
  - `implemented`: the implementer wrote the lesson content.
- Each lesson has exactly one lifecycle tag in `tags`; other tags are allowed.
- `board.base` defines the formula `stage` as `if(file.hasTag("implemented"), "implemented", if(file.hasTag("planned"), "planned", "created"))`, a `kanban` view grouped by `formula.stage` with group order `created`, `planned`, `implemented`, and a table view.
- The frontend lists only courses with `status: published` and only lessons tagged `implemented`.
- All transitions are defined in one module, `pipeline/src/state.ts`.

## Alternatives considered
- A `status` property on lessons instead of tags: easier to group on, but the brief requires tags.
- An explicit `status: ready` set by the user: safest against starting on an unfinished description, but adds a manual step; rejected in favor of "all required fields filled".
- Starting the pipeline on any README push: would start on READMEs with empty required fields.
- Grouping the board on `tags` directly: unreliable with multiple tags.

## Consequences
- The user fills only the description and required metadata; pushing a README with all of them filled starts the pipeline, so an unfinished description should be pushed with at least one required field left empty.
- The `kanban` view type must be available in the user's Obsidian, as for the development board; the table view still shows the stage otherwise.
