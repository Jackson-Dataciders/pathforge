---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0011-progress-storage-on-progress-branch.md
  - ../adr/0010-github-authentication-and-write-access.md
tags:
  - progress
  - data
depends_on:
  - 016-github-oauth-login.md
---
# Spec: 017-progress-sync-on-progress-branch

## Description
<!-- Written by me: what the feature should do, in plain words. -->
My learning progress is stored as JSON in the repository on a dedicated `progress` branch so it syncs across my devices without a database. The server reads and writes it through the GitHub API when I am signed in. When I am not signed in, progress is stored only in the browser, and it is merged into the repository the next time I sign in on that device. The client keeps a local copy, batches changes, and survives short offline periods. Vercel must not deploy when the progress branch changes.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/progress/schema.ts`: zod schemas `progressFileSchema` (version 1, `updatedAt`, `lessons` record keyed `<course>/<lesson-stem>` with `completedAt` and `blocks` record keyed by block id `{ kind: 'quiz' | 'code-challenge', passed, attempts, updatedAt }`) and `progressChangeSchema` (discriminated: `lesson-complete { key, completedAt }`, `lesson-incomplete { key, at }`, `block-result { key, blockId, kind, passed, at }`). `emptyProgress()`.
2. `src/progress/merge.ts`: pure `applyChanges(file, changes)` and `mergeFiles(a, b)`: per block the newer `updatedAt` wins and `attempts` takes the maximum; per lesson `completedAt` keeps the earliest non-null value unless a newer `lesson-incomplete` exists; `passed` once true stays true unless a newer result says otherwise. Unit tests for each rule and for idempotency.
3. `src/progress/server/github-store.ts` using `@octokit/rest` with `GITHUB_CONTENT_TOKEN` and `GITHUB_REPOSITORY`:
   - `readProgress()` → `{ file, sha | null }` from `progress.json` on ref `progress`; 404 for branch or file → `emptyProgress()` and `sha: null`.
   - `ensureProgressBranch()`: if the branch is missing, create an orphan commit with `progress.json` (empty progress) and `README.md` ("Progress data for Pathforge. Do not merge.") via the Git Data API (blobs, tree, commit without parents, `refs/heads/progress`).
   - `writeProgress(changes)`: read, apply changes, `PUT` contents with the sha and commit message `progress: update`; on 409 or 422 conflict re-read and retry up to 3 times; then throw `ProgressConflictError`.
4. `src/app/api/progress/route.ts`: `GET` and `PUT` wrapped with `withOwner` (spec 016); `PUT` validates the body `{ changes: ProgressChange[] }` (max 200) and returns the merged file; `Cache-Control: no-store`; errors map to 400 (validation), 401, 409 (conflict after retries), 502 (GitHub error).
5. `src/progress/client/progress-store.ts`: in-memory state plus `localStorage` cache `pathforge.progress.v1` and a pending-change queue `pathforge.progress.queue.v1` (all storage access in try/catch); `load()` fetches `GET /api/progress` and merges with the local cache; `record(change)` applies locally and queues; flush after 2 s debounce, on `visibilitychange` to hidden (using `fetch` with `keepalive`), and on `online`; failed flushes keep the queue and retry with exponential backoff (max 60 s).
6. `src/progress/client/progress-provider.tsx` and hooks `useProgress()`, `useLessonProgress(course, lesson)`, `useBlockProgress(course, lesson, blockId)`, `useRecordProgress()`, each also exposing `mode: 'local' | 'synced'`. Signed out (from `useSession()`): local mode — changes are applied to the `localStorage` copy and kept in the queue, no network calls. On transition to signed in: `load()` merges server state with the local copy, then flushes the whole queue (which includes all signed-out changes). Signing out keeps the local copy.
7. `vercel.json`: add `"git": { "deploymentEnabled": { "progress": false } }`.
8. `.env.example` and README: `GITHUB_CONTENT_TOKEN` (fine-grained PAT, this repository only, Contents read and write) and `GITHUB_REPOSITORY`.
9. Tests: `github-store.test.ts` with mocked Octokit (missing branch creation, normal write, conflict then success, conflict exhaustion); route tests (401 without session, 400 invalid body, 200 merged result); `progress-store.test.ts` with fake timers and mocked `fetch` (debounce, offline queue retained, merge with server state, local mode makes no network calls, sign-in flushes changes recorded while signed out).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- The `progress` branch contains only `progress.json` and `README.md` and is never merged into `main`.
- Concurrent writes from two devices both end up in the file thanks to merge-and-retry.
- Signed out, progress works fully in the browser (local mode) and is never sent to the server; signing in merges it into the repository file.
- If the token is missing or invalid, the API returns 502 with `{ error: 'github' }`, and the client keeps changes queued and shows nothing destructive.
- Pushes to `progress` create no Vercel deployment.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- UI for progress (spec 018).
- Exporting or resetting progress.
- Syncing theme settings.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] `merge.ts`, `github-store`, route, and `progress-store` tests pass.
- [ ] `vercel.json` contains `git.deploymentEnabled.progress: false`.
- [ ] Manual: with the deployed app and env vars set, `PUT /api/progress` while signed in creates the `progress` branch with `progress.json` on first use and adds a commit on later writes.
- [ ] Manual: a commit on the `progress` branch does not create a Vercel deployment (Vercel dashboard shows none for that commit).
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0011](../adr/0011-progress-storage-on-progress-branch.md), [ADR-0010](../adr/0010-github-authentication-and-write-access.md).
- New dependency: `@octokit/rest`.
- Server code lives in `src/progress/server/` and must never be imported by client components (`import 'server-only'`).
