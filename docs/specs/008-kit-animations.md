---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0006-kit-rendering-libraries.md
tags:
  - kit
  - animations
depends_on:
  - 007-kit-diagrams.md
---
# Spec: 008-kit-animations

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can explain processes step by step with animations. A stepper shows a sequence of frames (each a diagram and/or short text) with animated transitions, play/pause, and previous/next controls. A code walkthrough highlights lines of a code sample step by step with an explanation per step. Animations respect the reduced-motion setting.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/kit/shared/use-stepper.ts`: hook `useStepper({ count, autoplay, intervalMs })` → `{ index, next, prev, goTo, playing, play, pause }`; stops at the last step; autoplay disabled when `prefers-reduced-motion: reduce`. Unit tests with fake timers.
2. `src/kit/shared/stepper-controls.tsx`: buttons Previous, Play/Pause, Next, a step indicator "Step n of m", and Left/Right arrow key handling when the component has focus. Accessible labels.
3. `stepper` component (`src/kit/components/stepper/`): schema `{ id, title?, autoplay: boolean = false, interval_ms: 1000–10000 = 2500, steps: { caption (Markdown), diagram?: mermaid code, body?: Markdown }[] (2–20) }`, refinement that each step has `diagram` or `body`. Frame transitions use `motion` `AnimatePresence` (fade/slide, 200 ms; none with reduced motion). Diagrams reuse the `Diagram` component from spec 007.
4. `code-walkthrough` component (`src/kit/components/code-walkthrough/`): schema `{ id, title?, language, code, steps: { lines: "N" | "N-M" (validated against code line count), caption (Markdown) }[] (1–20) }`. Renders the code with line numbers; highlighted lines get an accent background that animates between steps (`motion` layout animation); caption below.
5. `example.yaml` for both; register both; regenerate manifest.
6. Component tests: controls move between steps; keyboard arrows work; out-of-range `lines` fails schema; reduced motion disables autoplay (mock `matchMedia`).
7. Extend `e2e/kit.spec.ts`: clicking Next on the stepper changes the visible caption.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Both components start at step 1; autoplay pauses at the last step and on user interaction.
- Each instance has its own state; multiple instances on one page do not interfere.
- Without JavaScript (or in Obsidian), the YAML shows all steps as text.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Free-form keyframe animations or animation authoring tools.
- Syntax highlighting themes beyond the token-based colors.
- Persisting the current step.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `useStepper` unit tests pass (next, prev, autoplay stop at end, reduced motion).
- [ ] `stepper` and `code-walkthrough` render their examples on `/kit`, and Next advances the step (e2e).
- [ ] A `code-walkthrough` with `lines: "40-45"` on a 10-line code sample fails schema validation (test).
- [ ] `src/kit/manifest.json` includes both components; `npm run kit:manifest -- --check` passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0006](../adr/0006-kit-rendering-libraries.md) (Motion).
- New dependency: `motion`.
- `useStepper` and `stepper-controls` are reused by spec 012.
