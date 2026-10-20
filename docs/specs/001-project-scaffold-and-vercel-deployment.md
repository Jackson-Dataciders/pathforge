---
status: done
priority: high
created: 2026-10-20
work_item: ""
adr:
  - ../adr/0001-frontend-stack-and-tooling.md
  - ../adr/0002-content-repository-layout.md
tags:
  - frontend
  - infrastructure
depends_on: []
---
# Spec: 001-project-scaffold-and-vercel-deployment

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Set up the Pathforge web app: a Next.js (App Router) project in TypeScript at the repository root, with linting, type checking, unit tests, browser tests, and a CI workflow. The app has a simple shell (header with navigation to Home, Courses, and Roadmaps) and placeholder pages. The app deploys to Vercel from `main`. All repository content paths are defined in one place so later features and the course pipeline can find courses, catalog data, and themes.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Initialize Next.js at the repository root with TypeScript, App Router, `src/` directory, Tailwind CSS v4, ESLint, import alias `@/*`, and npm (`create-next-app`). If the tool refuses the non-empty directory, generate into a temporary folder and move the files in. Keep the existing `README.md` text, `.gitignore` entries, `docs/`, and `.github/` untouched apart from appending Next.js ignore entries (`.next/`, `node_modules/`, `.env*.local`, `playwright-report/`, `test-results/`, `.vercel`).
2. `package.json`: set `"engines": { "node": ">=22 <23" }`, add `.nvmrc` with `22`. Add scripts `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:watch`, `test:e2e` (`playwright test`), `format` (`prettier --write .`). Add Prettier with `.prettierrc.json` and `.prettierignore` (ignore `docs/`, `courses/`, generated files).
3. Add Vitest: `vitest.config.ts` (jsdom environment, `@/` alias, `src/**/*.test.ts(x)`, `pipeline/**/*.test.ts`, `scripts/**/*.test.ts`), `vitest.setup.ts` with `@testing-library/jest-dom`. Dev dependencies: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `tsx`.
4. Add Playwright: `playwright.config.ts` with `testDir: 'e2e'`, Chromium only, `webServer` running `npm run build && npm run start` on port 3000 with `PATHFORGE_CONTENT_ROOT` set to `fixtures/content`. Add `e2e/smoke.spec.ts`.
5. Create `src/content/paths.ts` exporting `contentRoot()` (returns `process.env.PATHFORGE_CONTENT_ROOT` resolved against `process.cwd()`, else `process.cwd()`), and functions `coursesDir()`, `catalogDir()`, `taxonomyFile()`, `roadmapsDir()`, `themesDir()` (always repository `themes/`, not the content root), `pipelineDir()`. Add `src/content/paths.test.ts`.
6. Create `fixtures/content/courses/.gitkeep` and `fixtures/content/catalog/.gitkeep` as the test content root used by later specs.
7. App shell: `src/app/layout.tsx` with `<html lang="en">`, a header component `src/components/site-header.tsx` (brand "Pathforge" linking to `/`, nav links "Courses" → `/courses`, "Roadmaps" → `/roadmaps`), a `<main>` landmark, and a footer. Pages: `src/app/page.tsx` (heading "Pathforge", one-line tagline), `src/app/courses/page.tsx` and `src/app/roadmaps/page.tsx` (heading plus empty-state text "No courses yet." / "No roadmaps yet."), `src/app/not-found.tsx`.
8. Add `src/components/site-header.test.tsx` checking the three links.
9. Add `vercel.json` with `$schema` `https://openapi.vercel.sh/vercel.json` and `"framework": "nextjs"`.
10. Add `.github/workflows/ci.yml`: on `pull_request` and `push` to `main`; Node 22 with npm cache; `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; a second job installs Playwright Chromium and runs `npm run test:e2e`.
11. Update `README.md` with a "Development" section (Node 22, `npm ci`, scripts) and a "Deployment" section listing the manual Vercel steps: import the GitHub repository in Vercel, framework Next.js, Node.js 22, production branch `main`.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- `/` shows the heading "Pathforge" and the site header with links to `/courses` and `/roadmaps`.
- `/courses` and `/roadmaps` render placeholder pages with empty-state text.
- Unknown routes render the custom not-found page with a link back to `/`.
- `contentRoot()` returns the repository root unless `PATHFORGE_CONTENT_ROOT` is set; relative values are resolved against the working directory.
- Pushing to `main` produces a Vercel production deployment once the Vercel project is connected (manual one-time setup).

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Theming, dark mode, and design tokens (spec 002).
- Any content loading, courses, roadmaps, authentication, or progress.
- Vercel branch deployment rules (`progress`, `course/*`), added by specs 017 and 027.
- Creating the Vercel project itself (manual step documented in README).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] `npm ci` succeeds on Node 22 from a clean checkout.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all exit with code 0.
- [x] `npm run test:e2e` passes `e2e/smoke.spec.ts`, which asserts the "Pathforge" heading on `/` and that clicking "Courses" navigates to `/courses`.
- [x] `src/content/paths.test.ts` covers default root and `PATHFORGE_CONTENT_ROOT` override and passes.
- [x] `.github/workflows/ci.yml` exists and runs lint, typecheck, unit tests, build, and e2e tests.
- [x] `vercel.json` is valid JSON with `"framework": "nextjs"`.
- [x] `docs/`, `.github/agents/`, `.github/skills/`, `.github/prompts/`, and `.github/instructions/` are unchanged.
- [x] After the manual Vercel setup, the production URL shows the "Pathforge" home page.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0001](../adr/0001-frontend-stack-and-tooling.md) (stack, tooling), [ADR-0002](../adr/0002-content-repository-layout.md) (layout, `paths.ts`).
- New files: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.nvmrc`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `vercel.json`, `.github/workflows/ci.yml`, `src/app/*`, `src/components/site-header.tsx`, `src/content/paths.ts`, `e2e/smoke.spec.ts`, `fixtures/content/**/.gitkeep`.
- `fixtures/content/` is the content root for unit and e2e tests in later specs; it mirrors the real `courses/` and `catalog/` layout.
- Keep `src/content/paths.ts` free of Next.js imports; pipeline scripts import it.
