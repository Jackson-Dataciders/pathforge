---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0009-theme-system.md
tags:
  - frontend
  - theming
depends_on:
  - 001-project-scaffold-and-vercel-deployment.md
---
# Spec: 002-theme-system

## Description
<!-- Written by me: what the feature should do, in plain words. -->
The UI supports light mode, dark mode, and following the system setting, plus a choice of prebuilt color themes. There are no user-defined themes; the prebuilt themes are JSON files in the repository maintained by developers. The user picks a mode and a color theme from the header; the choice is remembered on the device and applied without a flash on page load. All components, including diagrams and graphs added later, use the same semantic color tokens.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/theme/schema.ts`: zod schema `themeFileSchema` = `{ id: kebab-case string, name: string, light: TokenSet, dark: TokenSet }`, where `TokenSet` requires every token in `THEME_TOKENS` (`bg`, `surface`, `fg`, `muted`, `border`, `accent`, `accent-fg`, `success`, `warning`, `danger`, `code-bg`) as CSS color strings. Export `THEME_TOKENS`. Add `src/theme/schema.test.ts`.
2. Create the prebuilt themes `themes/default.json` (neutral grays, blue accent), `themes/forest.json` (green accent), `themes/ocean.json` (teal accent), and `themes/sunset.json` (orange accent), each with `light` and `dark` token sets. Text and background tokens meet WCAG AA contrast (4.5:1) in both modes; add a contrast test in `src/theme/contrast.test.ts`.
3. `scripts/build-themes.ts`: read and validate all `themes/*.json` (via `themesDir()`), fail if `default` is missing or ids duplicate, and write `src/styles/themes.generated.css` (`:root, [data-color-theme="<id>"]` for the default light set; `[data-color-theme="<id>"]` light; `.dark[data-color-theme="<id>"]` dark; each token as `--color-<token>`) and `src/theme/themes.generated.ts` exporting `THEMES: { id, name }[]`. Add npm script `themes:build` and run it in `predev` and `prebuild`. Add `scripts/build-themes.test.ts` using temp directories.
4. `src/app/globals.css`: import `themes.generated.css`; map Tailwind v4 `@theme inline` colors (`--color-bg`, etc.) so utilities like `bg-bg`, `text-fg`, `border-border`, `bg-accent` exist; set `body` to `bg-bg text-fg`; define `--radius`, `--font-sans`, `--font-mono`.
5. Add `next-themes`. `src/theme/theme-provider.tsx` (client): wraps `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`. `src/theme/color-theme.tsx`: `ColorThemeProvider` and `useColorTheme()` storing `pathforge.colorTheme` in `localStorage` (wrapped in try/catch, fallback `default`) and setting `data-color-theme` on `<html>`.
6. `src/theme/no-flash-script.tsx`: an inline `<script>` rendered in `layout.tsx` `<head>` that reads `pathforge.colorTheme` and sets `data-color-theme` before paint; add `suppressHydrationWarning` on `<html>`.
7. `src/theme/use-theme-tokens.ts`: hook returning current resolved token values (via `getComputedStyle(document.documentElement)`) and re-rendering when the `class` or `data-color-theme` attribute on `<html>` changes (MutationObserver). Add a unit test.
8. `src/components/theme-switcher.tsx`: header control with a mode select (Light, Dark, System) and a color theme select listing `THEMES`. Add it to `site-header.tsx`. Add `theme-switcher.test.tsx`.
9. `src/theme/no-raw-colors.test.ts`: fails if any `.ts`/`.tsx`/`.css` file under `src/app`, `src/components`, or `src/kit` (excluding `*.generated.*`) contains a hex color literal or `rgb(`/`hsl(` call.
10. `e2e/theme.spec.ts`: switching to Dark adds class `dark` to `<html>` and changes the computed body background; selecting "Forest" sets `data-color-theme="forest"` and persists after reload.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Default: mode `system`, color theme `default`.
- Mode and color theme are independent; every theme defines both light and dark token sets.
- The choice persists in `localStorage` per device; if storage is unavailable, defaults are used and no error is shown.
- An unknown stored theme id falls back to `default`.
- `npm run themes:build` fails with a message naming the file and token when a theme file is invalid.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- User-defined themes: no UI, storage, or import for creating or editing themes.
- Syncing the theme choice across devices.
- Theming of Mermaid and React Flow (done in their specs using `useThemeTokens`).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `npm run themes:build` generates `src/styles/themes.generated.css` and `src/theme/themes.generated.ts` from the four prebuilt theme files.
- [ ] `src/theme/contrast.test.ts` passes for all four themes in both modes.
- [ ] `npm run themes:build` exits non-zero for a theme missing a token or a missing `default` theme (covered by `scripts/build-themes.test.ts`).
- [ ] The header shows a mode select with Light, Dark, System and a color theme select with Default, Forest, Ocean, and Sunset.
- [ ] `e2e/theme.spec.ts` passes: dark mode changes the body background, and the selected color theme persists after reload.
- [ ] `src/theme/no-raw-colors.test.ts` passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0009](../adr/0009-theme-system.md).
- New dependency: `next-themes`.
- Generated files `src/styles/themes.generated.css` and `src/theme/themes.generated.ts` are committed so editors and type checking work without a prior build; CI regenerates them in `prebuild`.
- Later specs use `useThemeTokens()` to theme Mermaid (spec 007) and React Flow (specs 012, 020).
