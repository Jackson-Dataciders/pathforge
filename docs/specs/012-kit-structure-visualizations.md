---
status: done
priority: low
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0006-kit-rendering-libraries.md
tags:
  - kit
  - visualizations
depends_on:
  - 006-component-kit-foundation.md
  - 008-kit-animations.md
---
# Spec: 012-kit-structure-visualizations

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can include interactive visualizations of data structures and graphs that I can step through. An array visualization shows an array, stack, or queue changing step by step (set, swap, push, pop, highlight, pointers). A graph visualization shows nodes and edges (trees, networks, system architectures) and highlights parts of the graph step by step.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/kit/components/array-viz/schema.ts`: `{ id, title?, kind: 'array' | 'stack' | 'queue', initial: (string | number)[] (0–30), steps: Step[] (1–40) }`, where `Step = { caption (Markdown), op: Op }` and `Op` is one of `{ type: 'set', index, value }`, `{ type: 'swap', i, j }`, `{ type: 'push', value }`, `{ type: 'pop' }`, `{ type: 'enqueue', value }`, `{ type: 'dequeue' }`, `{ type: 'highlight', indices: number[] }`, `{ type: 'pointer', name, index | null }`, `{ type: 'none' }`.
2. `src/kit/components/array-viz/reducer.ts`: pure `applyOp(state, op)` and `stateAt(initial, steps, index)`; invalid operations for the `kind` (for example `enqueue` on a stack) or out-of-range indices are schema refinement errors computed by simulating all steps. Unit tests for every op and error.
3. `ArrayViz.tsx`: SVG boxes with values and indices, highlighted cells in accent color, named pointer arrows, stack drawn vertically and queue horizontally with front/back markers; `motion` layout animations between states; `useStepper` and `stepper-controls` from spec 008.
4. `src/kit/components/graph-viz/schema.ts`: `{ id, title?, directed: boolean = true, layout: 'tree' | 'layered' = 'layered', nodes: { id, label }[] (1–40), edges: { from, to, label? }[], steps: { caption, highlight_nodes?: string[], highlight_edges?: [from, to][] }[] (0–30) }`; refinements: edges and highlights reference existing nodes and edges.
5. `GraphViz.tsx` (client, dynamic import): `@xyflow/react` read-only canvas (no dragging, zoom controls allowed), layout computed with `elkjs` (`mrtree` for `tree`, `layered` otherwise) in a shared helper `src/kit/shared/elk-layout.ts`; highlighted nodes and edges use the accent token; colors from `useThemeTokens()`; step controls when `steps` is non-empty.
6. `example.yaml` for both (bubble sort pass over an array; BFS over a small graph); register both; regenerate manifest.
7. Component tests: stepping updates rendered values and highlights; invalid edge reference fails schema. Extend `e2e/kit.spec.ts` for both.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Step 0 shows the initial state; each step applies its op cumulatively.
- `highlight` and `pointer` ops affect only the current step's display (highlights reset on the next step; pointers persist until moved or removed with `index: null`).
- Graphs without steps are static diagrams with zoom.
- Each visualization has an accessible text description: the current caption plus a textual list of values (array) or highlighted node labels (graph).

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- User-editable data or running user code to drive visualizations.
- Linked lists, heaps, or matrices as dedicated kinds (a graph or array covers them for now).
- Physics-based or force-directed layouts.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] `reducer.ts` unit tests for all ops and invalid-op detection pass.
- [x] Graph schema rejects an edge to an unknown node (test).
- [x] On `/kit`, stepping the array example changes the displayed values, and stepping the graph example highlights a different node (e2e).
- [x] `src/kit/manifest.json` includes `array-viz` and `graph-viz`; `npm run kit:manifest -- --check` passes.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0006](../adr/0006-kit-rendering-libraries.md).
- New dependencies: `@xyflow/react`, `elkjs`.
- `src/kit/shared/elk-layout.ts` is reused by roadmap rendering (spec 020).
