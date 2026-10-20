---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0003-lesson-storage-and-authoring-format.md
  - ../adr/0005-component-kit-contract-and-extension-policy.md
tags:
  - kit
  - mdx
depends_on:
  - 002-theme-system.md
  - 005-content-loader.md
---
# Spec: 006-component-kit-foundation

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons are built only from a fixed, shared kit of components. This spec creates the kit's foundation: how a component is declared in a lesson (a fenced code block `kit:<name>` with YAML), the registry with a schema per component, the Markdown-to-React compile step, a machine-readable manifest for the course agents, a showcase page, and the first content components: callout, tabs, and hint.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/kit/types.ts`: `KitCategory = 'content' | 'diagram' | 'animation' | 'assessment' | 'visualization'`; `KitComponentDefinition<S extends ZodType> = { name, category, description, schema: S, component: React.ComponentType<z.infer<S>>, interactive: boolean }`. Interactive components require a string `id` prop (kebab-case).
2. `src/kit/registry.ts`: `kitRegistry` record and `getKitComponent(name)`; `src/kit/registry.server.ts` if needed to keep client components out of server-only imports.
3. `src/kit/parse-block.ts`: `parseKitBlock({ name, yamlText, file, line })` → validated props or `KitBlockError { file, line, component, issues }` (unknown component, YAML error, schema issues).
4. `src/kit/remark-kit.ts`: remark plugin that, for each `code` node with `lang` starting `kit:`, calls `parseKitBlock` and replaces the node with an `mdxJsxFlowElement` named `KitBlock` with attributes `name` and `payload` (JSON string). It collects all errors and throws one aggregated error; it also enforces unique `id`s per lesson for interactive components. Other code blocks are left unchanged.
5. `src/kit/kit-block.tsx`: `KitBlock({ name, payload })` looks up the component and renders it with `JSON.parse(payload)`.
6. `src/kit/markdown.tsx`: `Markdown` component (server-safe, `react-markdown` + `remark-gfm`) for Markdown strings inside component props.
7. `src/kit/compile.ts`: `compileLesson(source, { file })` using `@mdx-js/mdx` `evaluate` with `format: 'md'`, `remarkPlugins: [remarkFrontmatter, remarkGfm, remarkKit]`, `remarkRehypeOptions: { footnoteLabel: 'Sources' }`, `react/jsx-runtime`, returning a React element; components map includes `KitBlock`. If injected JSX nodes are not passed through in `md` format, switch to `unified` + `remark-rehype` + `hast-util-to-jsx-runtime` with the same plugins (per ADR-0003).
8. `src/kit/result-context.tsx`: `KitResultProvider` and `useReportResult()` → `report({ blockId, kind, passed })`; default is a no-op (wired to progress in spec 018).
9. Components in `src/kit/components/<name>/` each with `schema.ts`, `<Name>.tsx`, `example.yaml`, `<name>.test.tsx`:
   - `callout`: `{ variant: 'info' | 'tip' | 'warning' | 'danger', title?, body }` (body is Markdown).
   - `tabs`: `{ tabs: { label, body }[] }` with 2–6 tabs, keyboard-accessible tablist.
   - `hint`: `{ label?: default "Show hint", body }`, collapsed by default using `<details>`.
   Register all three.
10. `scripts/generate-kit-manifest.ts` and npm script `kit:manifest`: write `src/kit/manifest.json` = `{ components: [{ name, category, description, interactive, jsonSchema (z.toJSONSchema), example (parsed example.yaml) }] }` sorted by name; `--check` flag exits non-zero if the file would change. Add `npm run kit:manifest -- --check` to `ci.yml`.
11. `src/kit/examples.test.ts`: every registered component has an `example.yaml` that passes its schema.
12. Showcase route `src/app/kit/page.tsx`: renders every registered component from its example via `compileLesson` of a generated Markdown document, with the component name as heading. Add `e2e/kit.spec.ts` checking that each component heading is visible.
13. Tests for `remark-kit` (valid block, unknown component, invalid YAML, schema error with line number, duplicate ids) and `compileLesson` (renders heading, footnote section labeled "Sources", callout).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Authoring syntax in a lesson:
  ````markdown
  ```kit:callout
  variant: tip
  title: Remember
  body: Status codes are **three digits**.
  ```
  ````
- Unknown component, invalid YAML, or invalid props → compile error listing file, line, component, and zod issues; the build fails.
- Raw HTML and JSX in lesson Markdown are not rendered as components.
- In Obsidian, kit blocks appear as YAML code blocks.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Mermaid diagrams (spec 007), animations (008), quizzes (009), code challenges (010, 011), visualizations (012, 013).
- Course and lesson routes (spec 014).
- Persisting results (spec 018).
- Syntax highlighting of ordinary code blocks (spec 014).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `remark-kit` and `compileLesson` tests cover the listed cases and pass.
- [ ] `src/kit/examples.test.ts` passes for `callout`, `tabs`, and `hint`.
- [ ] `npm run kit:manifest` writes `src/kit/manifest.json` with three components including JSON Schemas; `npm run kit:manifest -- --check` exits 0 right after and non-zero after editing a schema without regenerating.
- [ ] `/kit` renders callout, tabs, and hint; `e2e/kit.spec.ts` passes.
- [ ] Tabs are operable with arrow keys (component test).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md), [ADR-0005](../adr/0005-component-kit-contract-and-extension-policy.md).
- New dependencies: `@mdx-js/mdx`, `remark-frontmatter`, `remark-gfm`, `unist-util-visit`, `react-markdown`, `yaml` (existing).
- Every later kit spec follows the same folder contract (`schema.ts`, component, `example.yaml`, test), registers in `src/kit/registry.ts`, and regenerates the manifest.
- Component styling uses theme token utilities only (spec 002).
