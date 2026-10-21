---
status: done
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0006-kit-rendering-libraries.md
  - ../adr/0003-lesson-storage-and-authoring-format.md
tags:
  - kit
  - diagrams
depends_on:
  - 006-component-kit-foundation.md
---
# Spec: 007-kit-diagrams

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can contain diagrams. Authors write standard Mermaid code blocks, which Obsidian already renders; the frontend renders them with the current theme's colors and re-renders when the theme changes. An optional `kit:diagram` block adds a caption. The pipeline can check Mermaid syntax without a browser.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/kit/components/diagram/schema.ts`: `{ code: string (non-empty), caption?: string, alt?: string }`; category `diagram`, not interactive.
2. `src/kit/components/diagram/Diagram.tsx`: client component loaded with `next/dynamic` (`ssr: false`) that imports `mermaid`, initializes with `startOnLoad: false`, `securityLevel: 'strict'`, `theme: 'base'`, and `themeVariables` derived from `useThemeTokens()` (background, primary color, line color, text color, font), renders SVG with `mermaid.render(uniqueId, code)`, and re-renders on token change. Render inside `<figure>` with `<figcaption>`; while loading show a skeleton; on error show the error message and the raw code in `<pre>`.
3. `example.yaml` with a small flowchart and caption; register `diagram`.
4. Extend `src/kit/remark-kit.ts`: a `code` node with `lang === 'mermaid'` becomes `KitBlock` `diagram` with `{ code }`.
5. `src/kit/components/diagram/validate-mermaid.ts`: `validateMermaid(code): Promise<{ ok: true } | { ok: false, message }>` for Node. It sets up a `jsdom` window and document as globals, dynamically imports `mermaid`, and calls `mermaid.parse(code)`. Add `validate-mermaid.test.ts` (valid flowchart, sequence diagram, and an invalid one).
6. Tests: remark test that a mermaid fence becomes a diagram block; component test with mocked `mermaid` for loading, success, and error states; regenerate manifest; extend `e2e/kit.spec.ts` to assert an `svg` renders inside the diagram figure.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- ` ```mermaid ` blocks and ` ```kit:diagram ` blocks both render diagrams; only the latter supports a caption.
- Switching mode or color theme re-renders diagrams with new colors.
- Invalid Mermaid code in the browser shows an inline error box, not a crash; in validation (spec 026) it fails the course.
- Diagrams have `role="img"` and an accessible name from `alt`, else `caption`, else "Diagram".

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Animated or step-by-step diagrams (spec 008).
- Diagram editing or zoom/pan.
- Running `validateMermaid` over courses (spec 026).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] A lesson containing a ` ```mermaid ` flowchart renders an SVG diagram on `/kit` (e2e).
- [x] Switching to dark mode changes the diagram's text or background color (e2e or component test).
- [x] `validateMermaid` returns ok for valid diagrams and an error message for invalid syntax (unit tests in Node).
- [x] `src/kit/manifest.json` includes `diagram`; `npm run kit:manifest -- --check` passes.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0006](../adr/0006-kit-rendering-libraries.md) (Mermaid), [ADR-0003](../adr/0003-lesson-storage-and-authoring-format.md) (mermaid fences).
- New dependencies: `mermaid`, `jsdom` (already a dev dependency; move to dependencies only if the pipeline needs it at runtime in Actions, where devDependencies are installed anyway).
- Uses `useThemeTokens()` from spec 002.
