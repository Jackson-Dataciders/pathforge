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
---
# Spec: 013-kit-parameter-plot

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can include an interactive plot of a mathematical expression whose parameters I change with sliders, for example to see how growth rates or complexity classes behave. Expressions are evaluated safely without executing arbitrary code.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Add dependency `expr-eval`. `src/kit/components/param-plot/expression.ts`: `compileExpression(expr, allowedVariables)` using `expr-eval` `Parser` with only arithmetic, comparison, and math functions (`sin`, `cos`, `tan`, `log`, `ln`, `exp`, `sqrt`, `abs`, `floor`, `ceil`, `min`, `max`, `pow`); returns an evaluator or an error listing unknown variables or syntax errors. Unit tests.
2. `schema.ts`: `{ id, title?, x: { min, max, label? }, y?: { min, max, label? }, samples: 20–1000 = 200, params: { name (identifier), label?, min, max, step, value }[] (0–5), series: { expression, label? }[] (1–4) }`; refinements: `x.min < x.max`, `value` within range, each expression compiles with variables `x` and the param names.
3. `PlotSvg` in `ParamPlot.tsx`: samples each series over `x`, skips non-finite values (breaks the line), auto-computes `y` range when absent (with 5% padding), draws axes, ticks (about 5 per axis), grid lines, and one polyline per series using distinct token colors (`accent`, `success`, `warning`, `danger`); legend when more than one series.
4. Sliders: one `<input type="range">` per param with label and current value; recomputation throttled with `requestAnimationFrame`.
5. `example.yaml` (compare `n`, `n*log(n)`, `n^2` with an adjustable constant `c`); register `param-plot`; regenerate manifest.
6. Component tests: changing a slider changes the rendered path; division by zero does not crash; schema rejects an expression using an undeclared variable. Extend `e2e/kit.spec.ts`.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Expressions never execute JavaScript; only the listed functions and operators are available.
- Non-finite values (division by zero, `log` of negatives) produce gaps, not errors.
- The plot is responsive to container width and has an accessible description listing series and parameter values.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Data plots from tables, bar charts, or 3D plots.
- Zoom and pan.
- Exporting images.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] `expression.ts` unit tests pass, including rejection of `constructor`, unknown identifiers, and syntax errors.
- [x] Moving a slider on `/kit` changes the plotted path's `d` attribute (e2e).
- [x] Schema rejects an undeclared variable (test).
- [x] `src/kit/manifest.json` includes `param-plot`; `npm run kit:manifest -- --check` passes.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0006](../adr/0006-kit-rendering-libraries.md) (plain SVG, `expr-eval`).
- New dependency: `expr-eval`.
