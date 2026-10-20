---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/006-component-kit-foundation.md
  - ../specs/009-kit-quizzes.md
  - ../specs/022-course-planner-agent.md
  - ../specs/024-course-implementation-agent.md
  - ../specs/026-course-validation.md
tags:
  - kit
  - pipeline
---
# ADR-0005: Component kit contract and extension policy

## Summary
Every interactive lesson element comes from a fixed kit in which each component has a name, a zod props schema, an example, and a React implementation registered in one registry, and a generated `src/kit/manifest.json` tells course agents exactly what they may use. The implementation agent may add a component only when the course plan declares it in `pipeline.new_components`, and validation rejects any other change to kit code, so all courses behave consistently.

## Context
- Lessons must be built only from a fixed, shared kit of interactive components.
- The implementation agent may add a new kit component only when a lesson plan explicitly requires one.
- Course agents need a machine-readable description of what the kit offers; the validator must be able to check every block.
- Kit blocks are YAML in fenced code blocks (see [ADR-0003](0003-lesson-storage-and-authoring-format.md)).

## Decision
- Each kit component lives in `src/kit/components/<name>/` with `schema.ts` (zod props schema), `<Name>.tsx` (React component), `example.yaml` (valid example payload), and a test file.
- `src/kit/registry.ts` maps component names to `{ schema, component, description, category }`. Names are lowercase kebab-case. Categories: `content`, `diagram`, `animation`, `assessment`, `visualization`.
- Every interactive block has an `id` unique within its lesson; progress is stored per `id` (see [ADR-0011](0011-progress-storage-on-progress-branch.md)).
- `npm run kit:manifest` generates `src/kit/manifest.json` (name, category, description, JSON Schema via `z.toJSONSchema`, example) from the registry. CI fails if the committed manifest is out of date.
- Course agents read only `src/kit/manifest.json` to learn the kit.
- Extension policy:
  - The planner may request a new component by adding `{ name, reason, props_sketch, lessons }` to README `pipeline.new_components`. It must first confirm no existing component covers the need.
  - The implementer may create only the declared components, and only under `src/kit/components/<declared-name>/`, plus the registry entry and the regenerated manifest.
  - Validation compares the course branch with `main` and fails if any other file outside `courses/<slug>/` and `catalog/` changed.
  - A new component must ship with schema, example, and tests that pass.

## Alternatives considered
- Agents write free-form React per lesson: inconsistent behavior and untestable.
- Fully frozen kit (agents can never add components): contradicts the brief.
- Separate human-reviewed PR for new components: safer, but breaks the no-user-input flow; listed as an open question.

## Consequences
- Agent prompts stay small: they reference the manifest instead of describing components.
- A course run that adds a component changes shared code without human review; build, tests, and the path guard are the only safety net.
- Renaming a component or making its schema stricter requires migrating existing lessons; such changes need their own spec.
