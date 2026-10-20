---
status: planned
priority: low
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0007-code-challenge-verification.md
tags:
  - kit
  - runners
depends_on:
  - 029-kit-remote-execution-and-cpp-runner.md
---
# Spec: 030-kit-rust-runner

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Courses can use Rust as their code language. Rust challenges run through the remote execution route (Compiler Explorer) in the browser, and during validation with a local `rustc` when installed (always in CI) or Compiler Explorer otherwise, using the same test harness. Tests are plain `test_*` functions using Rust's `assert!` macros.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Verify Compiler Explorer support for Rust as in spec 029 step 1 (`/api/compilers/rust`, newest stable `rustc`), record fixtures in `src/runners/remote/__fixtures__/rust-*.json`; stop and report if execution is unavailable.
2. `compilers.ts`: `rust` entry with the recorded compiler id, `ceLang: 'rust'`, `userArguments: '--edition 2021 -C opt-level=1'`.
3. `src/runners/rust/harness.ts`: `buildRustProgram(code, tests)`: extracts test function names from `tests` with the pattern `fn\s+(test_[A-Za-z0-9_]*)\s*\(\s*\)` (in order; none found → harness returns an `error` result before execution), then emits learner code, tests, and a `main` that installs a panic hook storing the panic message, runs each test with `std::panic::catch_unwind`, and prints `PATHFORGE_RESULT <json>` (JSON escaping implemented in the harness, no crates). Learner code must not define `main`. Unit tests on the generated text and name extraction.
4. `src/runners/rust/node.ts`: compile with `rustc --edition 2021 -C opt-level=1 -o prog main.rs` (90 s compile timeout), run with `timeoutMs`, parse the result line; without `rustc` outside CI, fall back to Compiler Explorer via `local-or-remote.ts` (spec 029). Register `rust` in `nodeRunners`, `browserRunners` (remote runner), and `SUPPORTED_CODE_LANGUAGES`. Tests as in spec 029 (pass, fail with message, compile error, timeout, stdout); local toolchain suite skipped without `rustc` unless `CI` is set.
5. Workflows: in `ci.yml` and `pipeline-e2e.yml` add `dtolnay/rust-toolchain` (pinned to a commit SHA, toolchain `stable`) and print `rustc --version`.
6. Code challenge UI: `@codemirror/lang-rust` for `language: rust`.
7. Add `example-rust.yaml`, show it on `/kit`, and extend `e2e/kit.spec.ts` with a mocked `/api/run` run. Add the Rust case to the optional live test.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Rust tests example:
  ```rust
  fn test_adds() { assert_eq!(add(2, 3), 5); }
  ```
- Only the Rust standard library is available; no crates.
- Status mapping matches spec 010.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Cargo projects, crates, or `#[test]` attribute discovery.
- C# (spec 031).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Compiler Explorer fixtures for Rust are recorded from a real request and committed.
- [ ] Harness and Rust Node runner tests pass in CI.
- [ ] `isSupportedCodeLanguage('rust')` returns true and the manifest includes `rust`; `npm run kit:manifest -- --check` passes.
- [ ] The Rust example on `/kit` shows a passing result with the mocked `/api/run` (e2e).
- [ ] Manual: on the deployed site, running the Rust example's solution shows "All tests passed".
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0007](../adr/0007-code-challenge-verification.md).
- New dependency: `@codemirror/lang-rust`.
- Reuses `/api/run`, `compiler-explorer.ts`, `result-line.ts`, and the remote browser runner from spec 029.
