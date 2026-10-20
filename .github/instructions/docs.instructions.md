---
description: "Use when creating or editing Markdown documentation, specs, or ADRs under docs/. Covers spec status, templates, naming, metadata, links, and architecture decisions."
applyTo: "docs/**/*.md"
---
# Documentation Instructions

- Use `docs/_templates/_specs-template.md` for specs and `docs/_templates/adr-template.md` for ADRs.
- Spec `status` values, in order, are `backlog`, `ready`, `planned`, `in-progress`, and `done`.
- Never change a spec's `Description` section; preserve its content verbatim when editing the spec.
- Format dates as `YYYY-MM-DD`.
- Use relative Markdown paths for links; do not use wikilinks.
- Represent list-valued frontmatter fields as YAML lists.
- Name spec files `NNN-kebab-title.md` and ADR files `NNNN-kebab-title.md`.
- Never edit `docs/architecture.md` to reflect a decision except through the `accept-adr` prompt.