---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/003-course-vault-template-and-metadata-schema.md
  - ../specs/005-content-loader.md
  - ../specs/006-component-kit-foundation.md
  - ../specs/014-course-rendering.md
tags:
  - content
  - mdx
---
# ADR-0003: Lesson storage and authoring format

## Summary
We render the lesson `.md` files in the `courses/` vault directly and embed kit components as fenced code blocks (` ```kit:<component> ` with a YAML body) that an MDX pipeline compiled in Markdown mode turns into React components. This keeps one source of truth per lesson that reads cleanly in Obsidian while every interactive component still renders in the frontend.

## Context
- Lessons must render correctly in Obsidian and be rendered as MDX with the component kit in the frontend.
- Obsidian does not render JSX; raw `<Quiz ...>` tags show up as broken HTML or literal text.
- Strict MDX syntax rejects ordinary prose containing `<` or `{`, which LLM-written text and Obsidian notes contain often.
- Course agents write lessons, and deterministic validation must be able to parse every interactive element.
- Options:
  - A: vault `.md` files contain JSX and are compiled as MDX.
  - B: implemented lessons live in a separate `content/` folder as `.mdx`; the vault keeps only plans.
  - C: vault `.md` files are the single source, with kit components as fenced code blocks.

## Decision
- We use option C. `courses/<slug>/NNN-lesson-slug.md` is the only copy of a lesson.
- A kit component is a fenced code block whose info string is `kit:<component-name>` and whose body is YAML matching that component's schema (see [ADR-0005](0005-component-kit-contract-and-extension-policy.md)).
- Diagrams use standard ` ```mermaid ` blocks, which Obsidian renders natively.
- Lessons are compiled with `@mdx-js/mdx` using `format: 'md'`, `remark-frontmatter`, `remark-gfm` (tables, footnotes), and a custom `remarkKit` plugin that replaces `kit:*` and `mermaid` code blocks with MDX JSX elements bound to registered kit components. Raw JSX in lessons is not supported.
- Compilation runs at build time; a parse or schema error fails the build and names the file, line, and component.

## Alternatives considered
- A (JSX in `.md`): breaks Obsidian rendering and makes prose brittle under strict MDX parsing.
- B (separate content folder): duplicates every lesson, lets the vault and the site drift apart, and the Obsidian board would show plans rather than what is published.

## Consequences
- Obsidian shows kit blocks as readable YAML code blocks; the full interactive view exists only in the frontend.
- Component props are limited to what YAML can express; complex behavior belongs in components, not inline authoring.
- If `format: 'md'` does not pass injected JSX nodes through, the fallback is the same remark pipeline rendered with `hast-util-to-jsx-runtime` and a component map; the authoring format does not change.
