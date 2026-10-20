---
status: done
priority: high
created: 2026-10-20
work_item: ""
adr:
  - ../adr/0002-content-repository-layout.md
  - ../adr/0003-lesson-storage-and-authoring-format.md
  - ../adr/0004-course-and-lesson-lifecycle-states.md
tags:
  - content
  - obsidian
depends_on:
  - 001-project-scaffold-and-vercel-deployment.md
---
# Spec: 003-course-vault-template-and-metadata-schema

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Create the `courses/` Obsidian vault. In Obsidian I create a course folder, add a `README.md` from a template, and fill in the description and the required metadata (topic, course language, code language). A README with all of these filled counts as ready, and I then start the course from VS Code with the course planner agent; I never edit the status myself. The template, the README metadata schema, the lesson frontmatter schema, and the `board.base` template that shows lessons as columns by their lifecycle tag (`created`, `planned`, `implemented`) are defined here. The metadata set must be easy to extend.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Vault config in `courses/.obsidian/`: `app.json` (`useMarkdownLinks: true`, `newLinkFormat: "relative"`), `templates.json` (`folder: "_templates"`, `dateFormat: "YYYY-MM-DD"`, `timeFormat: "HH:mm"`), `core-plugins.json` (same set as `docs/.obsidian/core-plugins.json`, with `templates`, `bases`, and `properties` enabled), `appearance.json` (`{}`).
2. `.gitignore`: add `courses/.obsidian/workspace.json`, `courses/.obsidian/workspace-mobile.json`, `courses/.obsidian/cache`, `courses/.trash/`.
3. `courses/_templates/course-readme.md`: README template (see Behavior) with `created: "{{date}}"`.
4. `courses/_templates/board.base.template`: Bases file with placeholder `{{COURSE_FOLDER}}` (see Behavior). The pipeline (spec 021) copies it into each course as `board.base`.
5. `courses/how-to-create-a-course.md`: short guide (create folder, new note `README`, insert template "course-readme", fill `topic`, `course_language`, `code_language`, and the Description; then in VS Code select the `course-planner` agent in Copilot Chat, attach the README, send, and click "Build course" when the planner finishes; do not edit `status`).
6. `src/content/schema/course-metadata.ts`: field registry `COURSE_METADATA_FIELDS: { key, required: 'user' | 'pipeline' | 'optional', description, schema }[]` for `title`, `topic`, `course_language`, `code_language`, `status`, `category`, `labels`, `created`, `pipeline`. Build `courseFrontmatterSchema` from the registry with `.passthrough()` so extra keys are preserved. Export `COURSE_STATUSES` (`draft`, `planning`, `researching`, `implementing`, `validating`, `published`, `failed`), `readyCourseSchema` (status `draft`, `topic`, `course_language`, `code_language` non-empty, Description section non-empty; validated together with the body) and `publishedCourseSchema` (also `title`, `category`, at least one label). `course_language`: two-letter lowercase code accepted by `Intl.DisplayNames(['en'], { type: 'language' })`. `code_language`: lowercase id or `none` (supported-language check happens in spec 022).
7. `src/content/schema/lesson.ts`: `lessonFrontmatterSchema` with fields `title`, `lesson` (positive integer), `tags` (string list with exactly one lifecycle tag), `objectives`, `outline`, `components`, `claims`, `sources`, `estimated_minutes`; `claimSchema` (`id` matching `^c\d+$`, `text`, `status` in `draft|verified|corrected|rejected`, `sources` list, optional `note`); `sourceSchema` (`id` matching `^s\d+$`, `title`, `url` http/https, `publisher`, `accessed` YYYY-MM-DD). Export `LIFECYCLE_TAGS` and `lifecycleTag(frontmatter)`.
8. `src/content/markdown-file.ts`: `parseMarkdownFile(text)` → `{ data, body }` and `stringifyMarkdownFile(data, body)` using `gray-matter` with the `yaml` engine; `getSection(body, heading)` and `setSection(body, heading, content)` for `##` sections. Add tests including round-trip without changing unrelated content.
9. `src/content/course-files.ts`: `isLessonFileName(name)` (`^\d{3}-[a-z0-9]+(-[a-z0-9]+)*\.md$`), `isCourseSlug(name)` (`^[a-z0-9]+(-[a-z0-9]+)*$`), `slugify(name)` (ASCII, lowercase, kebab-case, strips diacritics). Add tests.
10. Test fixtures in `fixtures/content/courses/sample-course/`: `README.md` (status `published`, category `backend`, label `http`), `001-introduction.md` (tag `implemented`, one verified claim with source, plain Markdown body with a `[^c1]` footnote), `002-next-steps.md` (tag `implemented`). Add `src/content/schema/*.test.ts` validating the template (after replacing `{{date}}`), the fixtures, and failure cases (missing topic, invalid language, two lifecycle tags, bad source URL).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- README template:
  ```markdown
  ---
  title: ""
  topic: ""
  course_language: en
  code_language: ""
  status: draft
  category: ""
  labels: []
  created: "{{date}}"
  pipeline:
    run_id: ""
    last_stage: ""
    error: ""
    new_components: []
  ---
  # Course

  ## Description
  <!-- Describe what the course should teach, for whom, and any focus or constraints. When topic, course_language, code_language, and this description are filled, start the course in VS Code with the course-planner agent and this README attached. Do not edit status. -->

  ## Summary
  <!-- Written by the course planner. -->

  ## Lesson plan
  <!-- Written by the course planner. -->

  ## Notes
  ```
- User-filled fields: `topic`, `course_language`, `code_language` (`none` for courses without code), and the `## Description` section. `status`, `title`, `category`, `labels`, and `pipeline` are managed by the pipeline.
- `readyCourseSchema` passes only for `status: draft` with all user-filled fields non-empty; the template itself (empty fields) does not pass.
- Supported `code_language` values are `javascript`, `typescript`, `python`, `cpp`, `rust`, `csharp`, and `none`; the template has a comment listing them. The authoritative list is `src/runners/registry.ts` (created in spec 010, extended in specs 011, 029–031); this spec only checks the value format.
- Extending metadata means adding one entry to `COURSE_METADATA_FIELDS`; unknown keys are preserved by parsing and stringifying.
- `board.base.template`:
  ```yaml
  filters:
    and:
      - file.inFolder("{{COURSE_FOLDER}}")
      - file.ext == "md"
      - file.name != "README"
  formulas:
    stage: 'if(file.hasTag("implemented"), "implemented", if(file.hasTag("planned"), "planned", "created"))'
  properties:
    file.name:
      displayName: Lesson
    formula.stage:
      displayName: Stage
  views:
    - type: kanban
      name: Lessons
      groupBy:
        property: formula.stage
        direction: ASC
      groupOrder:
        - created
        - planned
        - implemented
    - type: table
      name: All lessons
      order:
        - file.name
        - formula.stage
        - estimated_minutes
  ```
- A lesson with zero or more than one lifecycle tag fails `lessonFrontmatterSchema`.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Loading courses for the frontend (spec 005).
- Creating `board.base` inside course folders (pipeline, spec 021).
- Taxonomy validation of `category` and `labels` (specs 004 and 005).
- Kit block validation inside lesson bodies (spec 006).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] Opening `courses/` as an Obsidian vault and inserting the "course-readme" template into a new note produces the README template with today's date in `YYYY-MM-DD` format (manual check).
- [x] `courses/_templates/board.base.template` with `{{COURSE_FOLDER}}` replaced by a fixture folder opens in Obsidian and shows lessons in `created`, `planned`, and `implemented` columns (manual check).
- [x] Schema tests pass for the template, the fixture course, and each listed failure case.
- [x] `parseMarkdownFile`/`stringifyMarkdownFile` round-trip preserves unknown frontmatter keys and body text (test).
- [x] `.gitignore` excludes `courses/.obsidian/workspace.json`.
- [x] `npm run lint`, `npm run typecheck`, and `npm test` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0002](../adr/0002-content-repository-layout.md), [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md), [ADR-0004](../adr/0004-course-and-lesson-lifecycle-states.md), traceability fields from [ADR-0008](../adr/0008-source-traceability-model.md).
- New dependencies: `zod` (v4), `gray-matter`, `yaml`.
- Schemas must not import Next.js; the pipeline reuses them.
- The `kanban` view type mirrors `docs/specs/board.base`.
