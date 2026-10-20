---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/016-github-oauth-login.md
  - ../specs/017-progress-sync-on-progress-branch.md
tags:
  - auth
  - security
---
# ADR-0010: GitHub authentication and write access

## Summary
We sign in with GitHub OAuth through Auth.js (`next-auth` v5) using only the identity scope, allow exactly one GitHub user id configured in an environment variable, and perform progress writes server-side with a fine-grained personal access token limited to this repository's contents. Separating identity from write access keeps the OAuth token minimal while the platform still writes to the repository without any external database.

## Context
- Login is via GitHub OAuth for a single user; there is no external database.
- Progress is written to the `progress` branch of this repository (see [ADR-0011](0011-progress-storage-on-progress-branch.md)).
- Options for write access:
  - A: request the `repo` (or `public_repo`) OAuth scope and write with the user's token.
  - B: a server-side fine-grained PAT scoped to this repository with `contents: write`.
  - C: a GitHub App installed on the repository.

## Decision
- Authentication: Auth.js with the GitHub provider, JWT session strategy, scope `read:user`.
- Authorization: the `signIn` callback rejects any GitHub account whose numeric id differs from `ALLOWED_GITHUB_USER_ID`.
- Write access: option B. `GITHUB_CONTENT_TOKEN` (fine-grained PAT, single repository, `contents: read and write`) is used only in server code under `src/progress/server/`, after a session check.
- Environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ALLOWED_GITHUB_USER_ID`, `GITHUB_CONTENT_TOKEN`, `GITHUB_REPOSITORY` (`owner/name`). `.env.example` documents them.
- Course pages are readable without login. Without login, progress is stored only in the browser; after login it syncs to the repository (see [ADR-0011](0011-progress-storage-on-progress-branch.md)).

## Alternatives considered
- A: grants the browser session write access to all of the user's repositories (classic scopes are coarse).
- C: least privilege and auditable, but requires creating and configuring a GitHub App; overkill for one user.

## Consequences
- The PAT must be rotated manually before it expires; an expired token makes progress writes fail with a visible error.
- Progress writes appear in git history as commits by the PAT owner.
