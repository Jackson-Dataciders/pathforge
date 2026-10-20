---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/001-project-scaffold-and-vercel-deployment.md
tags:
  - frontend
  - tooling
---
# ADR-0001: Frontend stack and tooling

## Summary
We build the frontend as a single Next.js App Router application in TypeScript at the repository root, styled with Tailwind CSS v4, tested with Vitest and Playwright, managed with npm, and statically generated from repository content on Vercel. This is the stated stack plus the least surprising, well-documented tooling around it, so every later spec is implementable without further tooling decisions.

## Context
- The product brief fixes Next.js (App Router), TypeScript, Vercel hosting, and MDX lesson rendering.
- The repository is the only data store. Course, taxonomy, and roadmap content is read from the file system at build time; only progress is read and written at runtime.
- `docs/architecture.md` is empty, so package manager, styling, test runners, and project layout are still open.
- Course agents (see [ADR-0013](0013-course-agent-runtime.md)) run TypeScript scripts in GitHub Actions that must share schemas with the app.
- Related spec: [001-project-scaffold-and-vercel-deployment](../specs/001-project-scaffold-and-vercel-deployment.md).

## Decision
- We use one Next.js App Router project at the repository root with a `src/` layout and strict TypeScript.
- We use Node.js 22 LTS, pinned in `.nvmrc` and `package.json#engines`, and npm with a committed `package-lock.json`.
- We use Tailwind CSS v4 for styling; design tokens are CSS custom properties (see [ADR-0009](0009-theme-system.md)).
- We use Vitest (jsdom, Testing Library) for unit and component tests and Playwright for browser tests.
- We use ESLint (Next.js config) and Prettier. The canonical scripts are `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`.
- Content pages are statically generated with `generateStaticParams` at build time; runtime server code is limited to authentication and progress API routes.
- Scripts that run outside Next.js (pipeline, validation, generators) are TypeScript executed with `tsx`.
- A GitHub Actions workflow `.github/workflows/ci.yml` runs lint, typecheck, unit tests, and build on pull requests and pushes to `main`.

## Alternatives considered
- pnpm or Bun instead of npm: faster, but npm needs no extra setup on Vercel or in Actions.
- CSS Modules or vanilla-extract instead of Tailwind: workable, but Tailwind v4 maps directly onto CSS-variable themes and is the best-known option for generated code.
- Jest instead of Vitest: slower and needs more configuration for ESM and TypeScript.
- Monorepo (`apps/web`, `packages/*`): unnecessary for one app and one pipeline; pipeline scripts import shared code from `src/`.
- Runtime rendering of content (SSR/ISR): unnecessary because every content change arrives as a commit that triggers a Vercel build.

## Consequences
- Every content change requires a rebuild; build time grows with the number of courses, which is acceptable for one user.
- Modules in `src/content`, `src/kit` schemas, and `src/runners` must not depend on Next.js-only APIs so pipeline scripts can import them.
- The Vercel project's Node.js version must match `.nvmrc` (manual setting).
