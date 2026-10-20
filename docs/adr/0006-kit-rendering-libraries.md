---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/007-kit-diagrams.md
  - ../specs/008-kit-animations.md
  - ../specs/010-kit-code-challenge-and-javascript-runner.md
  - ../specs/012-kit-structure-visualizations.md
  - ../specs/013-kit-parameter-plot.md
tags:
  - kit
  - dependencies
---
# ADR-0006: Kit rendering libraries

## Summary
We use Mermaid for diagrams, Motion for animations, CodeMirror 6 for the code editor, `@xyflow/react` for graph-shaped visualizations, and a small hand-written SVG layer for arrays and plots. Mermaid renders natively in Obsidian and the frontend, and the other libraries are mature, tree-shakeable React-friendly choices that cover the kit's needs without overlap.

## Context
- The kit needs diagrams, animations, code editing, and interactive visualizations (see [ADR-0005](0005-component-kit-contract-and-extension-policy.md)).
- Lessons must also read well in Obsidian, which renders Mermaid code blocks natively.
- Visual output must follow the active theme (see [ADR-0009](0009-theme-system.md)).
- Roadmaps already use `@xyflow/react` (see [ADR-0012](0012-roadmap-data-format-and-rendering.md)).

## Decision
- Diagrams: `mermaid`, rendered on the client and re-rendered when the theme changes, with colors taken from theme tokens.
- Animations: `motion` (formerly Framer Motion) for transitions in step-based components; animations respect `prefers-reduced-motion`.
- Code editor: CodeMirror 6 via `@uiw/react-codemirror` with language packages for each supported `code_language`.
- Graph and tree visualizations: `@xyflow/react` with `elkjs` layout.
- Arrays, stacks, queues, and parameter plots: plain React + SVG, no charting library.
- Safe expression evaluation for parameter plots: `expr-eval` (no `eval`, no `Function`).
- All of these components are client components loaded with `next/dynamic` so lesson pages stay statically generated.

## Alternatives considered
- D3 for all visualizations: powerful but low-level; more code for agents and Copilot to get right.
- Monaco editor: heavy and harder to theme than CodeMirror 6.
- Excalidraw or images for diagrams: not text-based, so agents cannot generate or validate them.
- Lottie for animations: requires prebuilt animation assets that agents cannot produce.
- Chart.js or Recharts for plots: unnecessary for function plots with sliders.

## Consequences
- Mermaid syntax can be validated in CI with `mermaid.parse` (see [026-course-validation](../specs/026-course-validation.md)).
- Client bundles grow; dynamic imports keep the cost to pages that use the component.
- Adding another library to the kit requires a new ADR.
