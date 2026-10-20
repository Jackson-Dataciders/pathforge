---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/002-theme-system.md
tags:
  - frontend
  - theming
---
# ADR-0009: Theme system

## Summary
We theme the UI with semantic CSS custom-property tokens consumed by Tailwind CSS v4, switch light, dark, and system mode with `next-themes`, and ship a fixed set of prebuilt color themes defined as `themes/<id>.json` files (token values for both modes, compiled to CSS at build time) from which the user picks one. Mode and color theme stay independent, there is no user-defined theme editing to build or store, and every component, including Mermaid and React Flow, reads the same tokens.

## Context
- The UI needs light mode, dark mode, and a choice of color themes. Color themes are prebuilt; users choose among them but do not create their own.
- The repository is the only data store; there is no settings database.
- Diagrams and visualizations must match the active theme (see [ADR-0006](0006-kit-rendering-libraries.md)).
- Options:
  - A: CSS custom properties + Tailwind v4 + `next-themes` + theme JSON files.
  - B: Tailwind `dark:` variants only.
  - C: a component library theme provider (for example Radix Themes or MUI).

## Decision
- We use option A.
- Semantic tokens: `--color-bg`, `--color-surface`, `--color-fg`, `--color-muted`, `--color-border`, `--color-accent`, `--color-accent-fg`, `--color-success`, `--color-warning`, `--color-danger`, `--color-code-bg`, plus `--radius` and `--font-sans` and `--font-mono`. Tailwind v4 `@theme` maps utilities to these variables.
- Mode: `next-themes` sets `class="dark"` on `<html>` with options `light`, `dark`, `system`.
- Color theme: a `data-color-theme="<id>"` attribute on `<html>`. The prebuilt themes are `default`, `forest`, `ocean`, and `sunset`; each is a developer-maintained file `themes/<id>.json` with `{ id, name, light: {tokens}, dark: {tokens} }`, validated by a zod schema; `default` is required. There is no UI or storage for user-defined themes.
- `npm run themes:build` (also run in `prebuild`) compiles all theme files into `src/styles/themes.generated.css` with selectors `[data-color-theme="<id>"]` and `.dark[data-color-theme="<id>"]`.
- The selected mode and color theme are stored in `localStorage`; an inline script applies them before first paint to avoid a flash.

## Alternatives considered
- B: cannot express multiple color themes.
- User-defined themes (editor UI plus storage): not needed; a curated prebuilt set is enough.
- C: adds a large dependency and its own styling model that agents and Copilot would need to learn.
- Storing the theme choice on the `progress` branch: syncs across devices, but adds a network write for a cosmetic setting.

## Consequences
- Components must use semantic tokens, never raw color values; a lint check or test enforces no hex colors in `src/kit` and `src/app`.
- Adding a prebuilt theme is a developer change: one JSON file plus a rebuild.
- Theme choice does not sync across devices.
