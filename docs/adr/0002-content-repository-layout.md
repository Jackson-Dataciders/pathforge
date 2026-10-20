---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/001-project-scaffold-and-vercel-deployment.md
  - ../specs/003-course-vault-template-and-metadata-schema.md
  - ../specs/004-taxonomy.md
  - ../specs/015-course-catalog.md
  - ../specs/021-pipeline-foundation.md
tags:
  - content
  - layout
---
# ADR-0002: Content repository layout

## Summary
We split the repository into the Next.js app (`src/`), the Obsidian content vault (`courses/`), shared catalog data (`catalog/` for taxonomy and roadmaps), prebuilt color themes (`themes/`), and the course-agent pipeline (`pipeline/`). Fixed locations let the frontend, the course agents, and the validator agree on where every artifact lives, and keep product course agents apart from the Copilot development setup in `.github/`.

## Context
- Two Obsidian vaults exist: `docs/` (development specs) and `courses/` (course content). They must not mix.
- The course folder structure is prescribed: `courses/<COURSE-NAME>/` with `board.base`, `README.md`, and numbered lesson files.
- A shared taxonomy and one roadmap per main topic must be stored in the repository.
- Course agents are product features and must not be confused with the development agents in `.github/agents/`, `.github/skills/`, and `.github/prompts/`.

## Decision
We use this top-level layout:

```
src/app/             Next.js routes
src/content/         zod schemas, paths, and loaders for courses, lessons, taxonomy, roadmaps
src/kit/             component kit: components, registry, remark plugin, generated manifest.json
src/runners/         code-challenge runners per code_language
src/progress/        progress client and server code
src/auth/            authentication
courses/             Obsidian content vault
  .obsidian/         shared vault settings (workspace files git-ignored)
  _templates/        course README template and board.base template
  <course-slug>/     board.base, README.md, NNN-lesson-slug.md
catalog/
  taxonomy.yaml      categories (main topics) and labels
  roadmaps/<category-id>.yaml
themes/<theme-id>.json
pipeline/
  agents/<agent>.md  course agent prompts
  schemas/           JSON Schemas for agent handoff contracts
  src/               TypeScript CLI: detect, scaffold, gates, validate, state transitions
  fixtures/          recorded agent outputs for fixture mode
  config.json        per-agent model, turn, and tool settings
.github/workflows/   ci.yml, course-pipeline.yml, pipeline-e2e.yml
```

- Course folder names are lowercase ASCII kebab-case slugs (for example `api-endpoints`); the slug is the course id in URLs.
- Lesson files are named `NNN-english-kebab-slug.md` with a three-digit, gap-free sequence starting at `001`.
- All repository paths are defined once in `src/content/paths.ts`.
- Course agent prompts live only in `pipeline/agents/`; nothing in `.github/agents`, `.github/skills`, `.github/prompts`, or `.github/instructions` is used by the course pipeline.

## Alternatives considered
- Taxonomy and roadmaps inside `courses/`: YAML is not rendered in Obsidian and is not course content; a separate `catalog/` keeps the vault limited to courses.
- Course agents as `.github/agents/*.agent.md`: Copilot would treat them as development agents and blur the two agent kinds.
- A separate `content/` folder for implemented lessons: rejected in [ADR-0003](0003-lesson-storage-and-authoring-format.md).

## Consequences
- Loaders, the pipeline, and the validator import paths from one module.
- `courses/.obsidian/workspace*.json` must be added to `.gitignore`, mirroring the `docs/` vault.
- Adding a new top-level area requires a new ADR.
