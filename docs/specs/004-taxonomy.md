---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0002-content-repository-layout.md
tags:
  - content
  - taxonomy
depends_on:
  - 003-course-vault-template-and-metadata-schema.md
---
# Spec: 004-taxonomy

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Every course is categorized and labeled using one shared taxonomy stored in the repository. Categories are the main topics (for example Backend), each of which can have a roadmap. Labels are finer-grained tags (for example HTTP). The taxonomy file is validated, can be read by the frontend, and can be safely extended by the course agents.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/content/schema/taxonomy.ts`: zod `taxonomySchema` = `{ version: 1, categories: Category[], labels: Label[] }`; `Category` = `{ id (kebab-case), title, description, roadmap: string | null }`; `Label` = `{ id (kebab-case), title, description? }`. Refinements: unique category ids, unique label ids.
2. `catalog/taxonomy.yaml`: seed categories `frontend`, `backend`, `devops`, `data`, `computer-science`, `ai-ml`, `security`, each with `roadmap: null`; seed labels `http`, `apis`, `databases`, `testing`, `algorithms`, `data-structures`, `javascript`, `typescript`, `python`, `cloud`, `networking`, `architecture`.
3. `src/content/taxonomy.ts`: `loadTaxonomy(root?)` (reads `taxonomyFile()`, parses YAML, validates, caches per root), `getCategory(id)`, `getLabel(id)`, and `validateTaxonomyReferences(taxonomy, { roadmapExists })` returning issues for categories whose `roadmap` is set but whose file `catalog/roadmaps/<roadmap>.yaml` is missing.
4. `src/content/taxonomy-writer.ts` (used by the pipeline): `addCategory(taxonomy, category)` and `addLabels(taxonomy, labels)` that reject duplicates and invalid ids, `setCategoryRoadmap(taxonomy, id, roadmapId)`, and `writeTaxonomy(taxonomy, file)` that writes stable YAML (2-space indent, categories and labels in insertion order).
5. Copy a minimal taxonomy into `fixtures/content/catalog/taxonomy.yaml` (`backend` with `roadmap: null`, label `http`) for tests.
6. Tests: `src/content/taxonomy.test.ts` and `src/content/taxonomy-writer.test.ts` covering valid load, duplicate ids, invalid id format, missing roadmap file issue, and writer round-trip stability.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- A category is a "main topic". A category "exists" for roadmap purposes only when its `roadmap` is non-null and its roadmap file exists; a seeded category with `roadmap: null` gets a roadmap the first time a course uses it (spec 025).
- Ids are lowercase kebab-case ASCII; titles and descriptions are English.
- Invalid YAML or schema errors throw an error naming `catalog/taxonomy.yaml` and the failing path.
- `writeTaxonomy` output is byte-identical when nothing changed.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Checking that courses reference valid categories and labels (spec 005).
- Roadmap files and their schema (spec 019).
- UI for categories (spec 015).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `catalog/taxonomy.yaml` exists with the seeded categories and labels and passes `taxonomySchema`.
- [ ] Taxonomy unit tests cover the listed cases and pass.
- [ ] `addCategory` with an existing id and `addLabels` with an invalid id throw (tests).
- [ ] Writing an unchanged taxonomy produces identical bytes (test).
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0002](../adr/0002-content-repository-layout.md) (location `catalog/taxonomy.yaml`).
- Uses `yaml` (added in spec 003) and `taxonomyFile()`/`roadmapsDir()` from `src/content/paths.ts`.
- No Next.js imports; used by pipeline scripts.
