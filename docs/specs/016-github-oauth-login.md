---
status: done
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0010-github-authentication-and-write-access.md
tags:
  - auth
depends_on:
  - 001-project-scaffold-and-vercel-deployment.md
---
# Spec: 016-github-oauth-login

## Description
<!-- Written by me: what the feature should do, in plain words. -->
I sign in with my GitHub account. Only my account is allowed; anyone else is rejected. The header shows a sign-in button when I am signed out and my avatar with a sign-out option when I am signed in. Server code has a helper to require that the owner is signed in.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Add `next-auth@5` (Auth.js). `src/auth/config.ts`: GitHub provider with `authorization: { params: { scope: 'read:user' } }`, `session: { strategy: 'jwt' }`, callbacks: `signIn` returns true only if `String(profile.id) === process.env.ALLOWED_GITHUB_USER_ID`; `jwt` stores `githubId` and `login`; `session` exposes `user.githubId` and `user.login`. Custom error page `/auth/error`.
2. `src/auth/index.ts`: export `{ handlers, auth, signIn, signOut }` from `NextAuth(config)`. `src/app/api/auth/[...nextauth]/route.ts` exports `GET` and `POST` handlers.
3. `src/auth/require-owner.ts`: `requireOwner()` → session or throws `UnauthorizedError`; `withOwner(handler)` wrapper for route handlers returning HTTP 401 JSON `{ error: 'unauthorized' }`.
4. `src/components/auth/session-provider.tsx` (client) wrapping `SessionProvider` from `next-auth/react`, added in `layout.tsx`. `src/components/auth/user-menu.tsx` (client) using `useSession()`: loading → placeholder; signed out → "Sign in with GitHub" button calling `signIn('github')`; signed in → avatar, login name, "Sign out" calling `signOut()`. Add to `site-header.tsx`. The session is loaded client-side so content pages stay statically generated.
5. `src/app/auth/error/page.tsx`: "Access denied" message for `AccessDenied`, generic message otherwise, link home.
6. `.env.example`: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ALLOWED_GITHUB_USER_ID`. README "Deployment" section: create a GitHub OAuth App with callback `https://<domain>/api/auth/callback/github` (and `http://localhost:3000/api/auth/callback/github` for development) and set the variables in Vercel.
7. Tests: `src/auth/config.test.ts` for the `signIn` callback (allowed id, other id, missing env → reject); `require-owner.test.ts` with mocked `auth()`; `e2e/auth.spec.ts` asserting the signed-out header shows "Sign in with GitHub".

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- If `ALLOWED_GITHUB_USER_ID` is not set, every sign-in is rejected.
- Rejected users land on `/auth/error?error=AccessDenied`.
- Content pages remain readable while signed out.
- The OAuth token from GitHub is not stored in the session and not used for repository access.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Progress API and repository writes (spec 017).
- Gating content pages behind login.
- Multiple users or roles.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] `signIn` callback tests pass for allowed id, other id, and missing configuration.
- [x] `requireOwner` / `withOwner` tests pass, including a 401 response without a session.
- [x] `e2e/auth.spec.ts` passes.
- [x] Manual: signing in with the allowed account on the deployed site shows the avatar; signing in with another GitHub account shows "Access denied".
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass (build works without auth env vars set).

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0010](../adr/0010-github-authentication-and-write-access.md).
- New dependency: `next-auth@5`.
- The user menu reads the session on the client (`SessionProvider`, `/api/auth/session`) so that no page calls `auth()` during rendering and course routes stay static; verify with the `next build` route list.
- Spec 017's progress provider reuses the same client session.
