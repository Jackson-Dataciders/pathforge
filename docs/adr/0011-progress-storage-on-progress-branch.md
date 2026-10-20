---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/017-progress-sync-on-progress-branch.md
  - ../specs/018-progress-tracking-ui.md
tags:
  - progress
  - data
---
# ADR-0011: Progress storage on the progress branch

## Summary
We store all learning progress in one `progress.json` file on an orphan `progress` branch, read and written server-side through the GitHub Contents API with sha-based optimistic concurrency and a merge-and-retry on conflict, and we disable Vercel deployments for that branch with `git.deploymentEnabled` in `vercel.json`. A single small JSON file is enough for one user, syncs across devices through GitHub, and never triggers a deployment.

## Context
- Progress is stored as JSON in the repository on a dedicated `progress` branch so it syncs across devices.
- Vercel must ignore that branch so progress writes do not trigger deployments.
- Writes come from Vercel functions; there is no local git checkout at runtime.

## Decision
- Branch: `progress`, created as an orphan branch containing only `progress.json` and a short `README.md`. The server creates it on first write if missing.
- File schema (`src/progress/schema.ts`, zod):
  ```json
  {
    "version": 1,
    "updatedAt": "ISO-8601",
    "lessons": {
      "<course-slug>/<lesson-file-stem>": {
        "completedAt": "ISO-8601 | null",
        "blocks": { "<block-id>": { "kind": "quiz | code-challenge", "passed": true, "attempts": 2, "updatedAt": "ISO-8601" } }
      }
    }
  }
  ```
- Read: `GET /api/progress` returns the file content and its blob sha.
- Write: `PUT /api/progress` accepts a list of changes; the server reads the latest file, merges changes (latest `updatedAt` wins per lesson and per block; `completedAt` keeps the earliest non-null value), and writes with the current sha. On a 409/422 sha conflict it re-reads and retries up to 3 times.
- The client keeps an optimistic local copy in `localStorage` and flushes queued changes with a 2-second debounce and on `visibilitychange`.
- Signed out, the client records progress in `localStorage` only (local mode). On sign-in, the local progress is merged into the repository file with the same merge rules and the local queue is flushed.
- `vercel.json` contains `"git": { "deploymentEnabled": { "progress": false } }`.

## Alternatives considered
- One file per lesson: more API calls and more commits for a full-course view.
- Git Data API (trees and commits) for batched writes: more complex; one file needs only the Contents API.
- Vercel `ignoreCommand` script: works, but `deploymentEnabled` is declarative and also covers preview deployments.

## Consequences
- Every progress flush is a commit; history grows by one commit per flush, acceptable for one user.
- GitHub API rate limits (authenticated) are far above single-user needs.
- Offline and signed-out progress is kept locally and synced on the next successful flush after sign-in.
- Progress made while signed out on one device stays on that device until the user signs in there.
